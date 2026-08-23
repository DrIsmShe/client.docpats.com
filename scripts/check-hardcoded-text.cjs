#!/usr/bin/env node
// client/scripts/check-hardcoded-text.cjs
//
// Ищет текст, написанный прямо в разметке, минуя t().
// Запуск: npm run check:hardcoded
//
// ЗАЧЕМ, ЕСЛИ ЕСТЬ check-locale-usage. Тот идёт от кода к словарю: берёт
// каждый t("ключ") и проверяет, есть ли перевод. Но строку, которая никогда
// не была ключом, он увидеть не может — там нет t(), нечего проверять.
//
// Так и получилось: ChatPage.jsx и TrainingVisibilityToggle.jsx не подключали
// useTranslation вовсе. «Messages», «Select a dialog», «Показывать учебную
// активность» стояли в JSX как есть. Обе проверки словарей молчали — паритет
// языков идеальный, все ключи на месте, — а пользователь на арабском видел
// английские и русские подписи.
//
// ЧТО СЧИТАЕТСЯ НАХОДКОЙ. Текстовый узел JSX и значение переводимого
// атрибута (placeholder, title, alt, aria-label, label), если в нём есть
// буквы. Разбор через @babel/parser: регулярка по такому коду неизбежно
// ловит содержимое строк CSS, комментарии и обычные JS-строки, которые
// пользователю никогда не показываются.
//
// ЧЕГО ПРОВЕРКА НЕ ВИДИТ — и это осознанные границы, не недосмотр:
//   • текст, собранный в переменной и подставленный через {msg};
//   • текст в шаблонных строках;
//   • строки, приходящие с сервера (ранги арены приходили именно так).
//
// БАЗОВЫЙ СПИСОК. Находок в проекте много, и падать на всех сразу значит
// приучить запускать проверку с закрытыми глазами. Текущее состояние
// заморожено в hardcoded-baseline.json: падаем на НОВЫХ строках и на
// устаревших записях, чтобы список не превращался в свалку.

const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("@babel/parser");

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const BASELINE = path.join(ROOT, "scripts", "hardcoded-baseline.json");

// Атрибуты, чьё значение видит пользователь. className, id, type и прочая
// техника сюда не входит намеренно.
const TEXT_ATTRS = new Set([
  "placeholder",
  "title",
  "alt",
  "label",
  "aria-label",
  "aria-placeholder",
  "aria-description",
]);

// Что переводить не нужно. Это не «исключения по неудобству», а вещи,
// которые на всех языках пишутся одинаково.
const ALLOWED = new Set([
  "DocPats",
  "DocPats AI",
  "AI",
  "ID",
  "XP",
  "OK",
  "URL",
  "PDF",
  "DICOM",
  "HTML",
  "CSS",
  "JSON",
  "SMS",
  "Email",
  "e-mail",
  "WhatsApp",
  "Telegram",
  "Google",
  "Apple",
  "iOS",
  "Android",
  "AZERBAIJAN",
  "Azerbaijan",
  "Baku",
  "+994",
  "БМИ",
  "BMI",

  // Логотип разрезан на два узла ради двухцветности: Doc<span>Pats</span>.
  // Переводить нечего, но детектор видит два отдельных текстовых узла.
  "Doc",
  "Pats",
  // Инициалы в декоративном кружке аватара соавторов.
  "Co",
  // Суффикс бренда в <title> и og:title, слоганы разделов.
  "| DocPats",
  "DocPats ·",
  "DocPats Editorial",
  "DocPats · Medical Intelligence",
  "Dr.",
  // Образцы в редакторе темы витрины: размеры экрана и проба шрифта.
  "380px",
  "850px",
  "Aa Бб Cc",
  // Маска даты в поле ввода: на всех языках пишется одинаково.
  "dd/mm/yyyy",
  // Код языка в списке выбора — значение, а не подпись.
  "az",
  // Подписи кнопок переключателя языка: код языка одинаков на всех языках.
  "AR", "AZ", "EN", "RU", "TR",
  // Бренд и домен в подвале.
  "DOCPATS",
  "DR-DESIGN",
  "- www.docpats.com",
  // Единица измерения размера файла.
  "MB",
  // Заглушка недоделанной страницы: текста для пользователя тут нет вовсе,
  // страница возвращает собственное имя. Переводить нечего — её надо
  // дописать или удалить.
  "deletePatientFromOffice",
  // Технические обозначения в антропометрии: имя режима и единицы.
  "alert", "annotation", "calibration", "px/mm", "мм",
]);

const LETTER = /[A-Za-zА-Яа-яЁёĀ-ſƀ-ɏ؀-ۿ]/;

/** Показывается ли эта строка пользователю как текст. */
function isUserText(raw) {
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s) return false;
  if (ALLOWED.has(s)) return false;
  // Нужны хотя бы две буквы подряд: «·», «—», «₼», «1/2», «×» — это не текст.
  const letters = s.match(new RegExp(LETTER.source, "g")) || [];
  if (letters.length < 2) return false;
  // Одна латинская буква с цифрами — обозначение, а не подпись: «T2», «V1».
  if (/^[A-Za-z]{1,2}\d+$/.test(s)) return false;
  return true;
}

function norm(raw) {
  const s = raw.replace(/\s+/g, " ").trim();
  return s.length > 70 ? s.slice(0, 67) + "…" : s;
}

function* walkFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      yield* walkFiles(full);
    } else if (/\.(jsx|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      yield full;
    }
  }
}

/** Обход AST без @babel/traverse: узел — всё, у чего есть .type. */
function walkNodes(node, visit) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walkNodes(item, visit);
    return;
  }
  if (typeof node.type === "string") visit(node);
  for (const key of Object.keys(node)) {
    if (key === "loc" || key === "leadingComments" || key === "trailingComments") continue;
    walkNodes(node[key], visit);
  }
}

const findings = [];

for (const file of walkFiles(SRC)) {
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes("<")) continue;

  let ast;
  try {
    ast = parse(src, {
      sourceType: "module",
      plugins: ["jsx", "typescript", "classProperties", "decorators-legacy"],
      errorRecovery: true,
    });
  } catch {
    // Файл не разбирается — это забота сборки, не наша.
    continue;
  }

  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const seen = new Set();

  walkNodes(ast.program, (node) => {
    let text = null;

    if (node.type === "JSXText") {
      text = node.value;
    } else if (node.type === "JSXAttribute" && node.value) {
      const name =
        node.name?.type === "JSXNamespacedName"
          ? `${node.name.namespace.name}:${node.name.name.name}`
          : node.name?.name;
      if (!TEXT_ATTRS.has(name)) return;
      if (node.value.type === "StringLiteral") text = node.value.value;
      // placeholder={"..."} — та же строка, просто в скобках.
      else if (
        node.value.type === "JSXExpressionContainer" &&
        node.value.expression?.type === "StringLiteral"
      ) {
        text = node.value.expression.value;
      }
    } else if (
      node.type === "JSXExpressionContainer" &&
      node.expression?.type === "StringLiteral"
    ) {
      // <div>{"Select a dialog"}</div> — обход текстового узла кавычками.
      text = node.expression.value;
    }

    if (text == null || !isUserText(text)) return;
    const entry = `${rel} → ${norm(text)}`;
    if (seen.has(entry)) return;
    seen.add(entry);
    findings.push(entry);
  });
}

findings.sort();

// ── сравнение с базовым списком ──────────────────────────────────────────
let baseline = [];
if (fs.existsSync(BASELINE)) baseline = JSON.parse(fs.readFileSync(BASELINE, "utf8"));

if (process.argv.includes("--update-baseline")) {
  fs.writeFileSync(BASELINE, JSON.stringify(findings, null, 2) + "\n", "utf8");
  console.log(`Базовый список обновлён: ${findings.length} записей.`);
  process.exit(0);
}

const known = new Set(baseline);
const fresh = findings.filter((f) => !known.has(f));
const current = new Set(findings);
const stale = baseline.filter((f) => !current.has(f));

if (fresh.length === 0 && stale.length === 0) {
  console.log(
    `Текст в разметке: ${findings.length} известных мест, новых нет.`,
  );
  process.exit(0);
}

if (fresh.length) {
  console.error(`\nНОВЫЙ текст в разметке мимо t() (${fresh.length}):\n`);
  for (const f of fresh) console.error("  " + f);
  console.error(
    "\nЗаверните строку в t(\"ключ\") и добавьте ключ во ВСЕ языки\n" +
      "public/locales/*/<namespace>.json. Если переводить нечего (бренд,\n" +
      "код страны, аббревиатура) — впишите строку в ALLOWED этого скрипта.",
  );
}

if (stale.length) {
  console.error(`\nУстаревшие записи базового списка (${stale.length}):\n`);
  for (const f of stale) console.error("  " + f);
  console.error(
    "\nЭти строки уже переведены — уберите их:\n" +
      "  npm run check:hardcoded -- --update-baseline",
  );
}

// На сборщике Netlify не валим сборку — см. тот же блок в
// check-locale-usage.cjs: сорванный деплой дороже непереведённой подписи.
if (process.env.NETLIFY) {
  console.error(
    "\nСборка продолжена: на выкатке эта проверка предупреждает, но не\n" +
      "останавливает деплой. Исправьте и закоммитьте — локально она падает.",
  );
  process.exit(0);
}

process.exit(1);
