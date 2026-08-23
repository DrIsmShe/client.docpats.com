#!/usr/bin/env node
// client/scripts/check-locale-usage.cjs
//
// Сверяет КОД со словарями: есть ли перевод у каждого ключа, который код
// действительно запрашивает. Запуск: npm run check:locale-usage
//
// ЗАЧЕМ ОТДЕЛЬНО ОТ check-locales.cjs. Тот сверяет языки МЕЖДУ СОБОЙ и ловит
// перекос: ключ есть в русском, нет в турецком. Но самый частый дефект другой —
// ключа нет НИ В ОДНОМ языке. Паритет при этом идеальный, и та проверка молчит.
//
// А t() с отсутствующим ключом не падает: подставляется defaultValue, а он у
// нас всюду русский. Значит на русском всё выглядит правильно, и увидеть
// дефект может только тот, кто переключил язык — то есть ровно азербайджанский
// и арабский рынок, ради которого платформа многоязычна.
//
// Так дашборд клиники месяцами был наполовину русским в арабской версии: из 51
// ключа 23 не существовали нигде.
//
// ЧТО ПРОВЕРЯЕТСЯ. Только литеральные ключи: t("a.b.c"). Ключи, собранные из
// переменных, проверить статически нельзя, и они молча пропускаются — это
// сознательное ограничение, а не недосмотр.
//
// ЭТАЛОН — русский: раздел пишется на нём. Если ключа нет в ru, его нет нигде.
//
// БАЗОВЫЙ СПИСОК. Пропусков в проекте накопилось много, и падать на всех сразу
// значит приучить запускать проверку с закрытыми глазами. Поэтому текущее
// состояние заморожено в i18n-baseline.json: проверка падает на НОВЫХ пропусках
// и на устаревших строках базового списка, чтобы он не превращался в свалку.

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const LOCALES = path.join(ROOT, "public", "locales");
const REFERENCE = "ru";
const BASELINE = path.join(ROOT, "scripts", "i18n-baseline.json");
const DEFAULT_NS = "common"; // из src/i18n.js

// ── словари ──────────────────────────────────────────────────────────────
//
// Имя файла ищем БЕЗ учёта регистра, и это принципиально.
//
// Разработка идёт на Windows, сборка — на Linux у Netlify. fs.existsSync на
// Windows находит Examinations.json по запросу examinations.json, на Linux —
// нет. Проверка, снявшая базовый список на Windows, падала на сборщике с 34
// «новыми» пропусками, которых на самом деле не было: словарь лежал рядом,
// просто с заглавной буквы.
//
// Раздача статики у Netlify к регистру нечувствительна (проверено запросом:
// /locales/ru/examinations.json и /Examinations.json отдают один JSON), так
// что в браузере это работало всегда. Значит и проверка должна вести себя
// так же — иначе она ломает сборку на дефекте, которого нет.
//
// Расхождение регистра при этом остаётся хрупкостью и о нём сообщается ниже.
const filesByLower = new Map();
{
  const dir = path.join(LOCALES, REFERENCE);
  if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir)) {
      filesByLower.set(name.toLowerCase(), name);
    }
  }
}

const caseMismatches = [];

function loadNamespace(ns) {
  const wanted = `${ns}.json`;
  const actual = filesByLower.get(wanted.toLowerCase());
  if (!actual) return null;
  if (actual !== wanted) caseMismatches.push(`${ns} → ${actual}`);
  try {
    return JSON.parse(fs.readFileSync(path.join(LOCALES, REFERENCE, actual), "utf8"));
  } catch (err) {
    console.error(`Словарь ${REFERENCE}/${actual} не читается: ${err.message}`);
    process.exit(1);
  }
}

const cache = new Map();
function dictOf(ns) {
  if (!cache.has(ns)) cache.set(ns, loadNamespace(ns));
  return cache.get(ns);
}

// Формы множественного числа i18next v22 (Intl.PluralRules). Ключ
// articlesWord существует в словаре только как articlesWord_one,
// _few, _many, _other — искать его точное имя бессмысленно.
const PLURAL_SUFFIXES = ["_other", "_one", "_zero", "_two", "_few", "_many"];

function hasKey(ns, key) {
  const dict = dictOf(ns);
  if (!dict) return false;
  const parts = key.split(".");
  const last = parts.pop();
  let cur = dict;
  for (const part of parts) {
    if (!cur || typeof cur !== "object" || !(part in cur)) return false;
    cur = cur[part];
  }
  if (!cur || typeof cur !== "object") return false;

  if (!(last in cur)) {
    // Ключ с числом: достаточно любой из форм — какая подойдёт, решит
    // Intl.PluralRules языка, и у арабского их шесть, а у турецкого одна.
    return PLURAL_SUFFIXES.some((sfx) => {
      const v = cur[last + sfx];
      return typeof v === "string" && v.trim().length > 0;
    });
  }

  const value = cur[last];
  // Пустое значение не лучше отсутствия: подпись исчезает, кнопка остаётся
  // без текста.
  return typeof value === "string" ? value.trim().length > 0 : value != null;
}

/**
 * Ключ указывает на ВЕТКУ, а не на строку.
 *
 * Отдельный дефект, который проверка выше пропускает: значение есть, оно не
 * пустое — просто это объект. i18next вернёт не текст, и на экране появится
 * сам ключ.
 *
 * Так ломается ключ, вокруг которого позже завели группу: был chat: "Чат",
 * кто-то добавил chat.selectDialog — и подпись пункта меню исчезла во всех
 * пяти языках. Сверка словарей между собой при этом довольна: паритет
 * идеальный, ключи на месте.
 *
 * Законное исключение — t(key, { returnObjects: true }) для массивов
 * (списки в AboutPage, TermsConsentPage). Такие вызовы пропускаем.
 */
function valueAt(ns, key) {
  const dict = dictOf(ns);
  if (!dict) return undefined;
  let cur = dict;
  for (const part of key.split(".")) {
    if (!cur || typeof cur !== "object" || !(part in cur)) return undefined;
    cur = cur[part];
  }
  return cur;
}

// ── обход исходников ─────────────────────────────────────────────────────
function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) yield full;
  }
}

/**
 * Пространства имён файла.
 *
 * useTranslation("clinic") → clinic; useTranslation(["a","b"]) → оба;
 * useTranslation() → common. Файл может звать несколько раз — собираем все и
 * считаем ключ найденным, если он есть хотя бы в одном: какой именно t()
 * относится к какому вызову, статически не определить.
 */
function namespacesOf(src) {
  const found = new Set();
  const re = /useTranslation\(\s*(\[[^\]]*\]|"[^"]*"|'[^']*')?\s*\)/g;
  let m;
  while ((m = re.exec(src))) {
    const arg = m[1];
    if (!arg) {
      found.add(DEFAULT_NS);
      continue;
    }
    for (const name of arg.match(/["']([^"']+)["']/g) || []) {
      found.add(name.slice(1, -1));
    }
  }
  if (found.size === 0) found.add(DEFAULT_NS);
  return [...found];
}

/**
 * Имена функции перевода в файле: t по умолчанию плюс псевдонимы вида
 * `const { t: tr } = useTranslation(...)` — они встречаются в блоках витрины.
 */
function translatorNames(src) {
  const names = new Set(["t"]);
  const re = /\{\s*t\s*:\s*([a-zA-Z_$][\w$]*)\s*\}/g;
  let m;
  while ((m = re.exec(src))) names.add(m[1]);
  return [...names];
}

/** Ключи, вызванные с returnObjects: их значение и должно быть не строкой. */
function objectKeys(src, names) {
  const keys = new Set();
  for (const name of names) {
    const re = new RegExp(
      // Только литеральные ключи в кавычках: t(`a.${b}`) с returnObjects
      // выше всё равно не собирается, ключ там динамический.
      "\\b" + name + "\\(\\s*[\"']([^\"']+)[\"']\\s*,[^)]*returnObjects",
      "g",
    );
    let m;
    while ((m = re.exec(src))) keys.add(m[1]);
  }
  return keys;
}

function literalKeys(src, names) {
  const keys = new Set();
  for (const name of names) {
    const re = new RegExp(`\\b${name}\\(\\s*["']([^"'\`]+)["']`, "g");
    let m;
    while ((m = re.exec(src))) {
      // Половина склейки — не ключ. В коде встречается
      // t("page.status_" + status): искать «page.status_» в словаре
      // бессмысленно, настоящий ключ собирается во время работы.
      const after = src.slice(m.index + m[0].length).trimStart();
      if (after.startsWith("+")) continue;
      keys.add(m[1]);
    }
  }
  for (const k of keysFromConfig(src)) keys.add(k);
  // Ключ со звёздочкой — не ключ, а запись в комментарии вида
  // t("booking.*", …), объясняющая соглашение файла.
  for (const k of [...keys]) if (k.includes("*")) keys.delete(k);
  return keys;
}

/**
 * Ключи, записанные в объектах-справочниках, а не переданные в t() прямо.
 *
 * Так устроена навигация витрины:
 *   const NAV_DEFS = [{ type: "whyUs", key: "publicClinic.navAbout", def: "О нас" }];
 *   t(d.key, { defaultValue: d.def })
 *
 * Для t() ключ здесь — переменная, поэтому проверка выше его не видела: все
 * девять пунктов меню витрины не были переведены ни на один язык, а
 * defaultValue исправно подставлял русский. Ловим по имени свойства
 * (key / labelKey / titleKey / i18nKey / transKey) и по виду значения —
 * ключ выглядит как «слово.слово», без пробелов.
 *
 * Свойство key часто хранит и обычные идентификаторы («variant1», "all"),
 * поэтому берём только значения с точкой: без неё это почти наверняка не
 * путь в словаре, и ложные срабатывания были бы сплошным шумом.
 */
function keysFromConfig(src) {
  const keys = new Set();
  const re =
    /\b(?:i18nKey|labelKey|titleKey|transKey|key)\s*:\s*["']([A-Za-z0-9_$]+(?:\.[A-Za-z0-9_$]+)+)["']/g;
  let m;
  while ((m = re.exec(src))) keys.add(m[1]);
  return keys;
}

// ── проверка ─────────────────────────────────────────────────────────────
const misses = [];

for (const file of walk(SRC)) {
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes("useTranslation")) continue;

  const nss = namespacesOf(src);
  const names = translatorNames(src);
  const asObjects = objectKeys(src, names);

  for (const key of literalKeys(src, names)) {
    // Явное пространство имён: t("clinic:dashboard.title").
    const explicit = key.includes(":") ? key.split(":", 2) : null;
    const candidates = explicit ? [explicit[0]] : nss;
    const bare = explicit ? explicit[1] : key;

    // Плоские ключи (t("title"), t("loading")) проверяются наравне с
    // вложенными. Сначала здесь стояло «ключ без точки — скорее всего не
    // ключ», и это было ошибкой: в проекте 631 плоский ключ живёт в словарях
    // по-настоящему, а правило прятало 127 реальных пропусков — включая
    // t("title") в шапке профиля врача, из-за которого там во всех языках
    // печаталось слово «title».

    const rel = path.relative(ROOT, file).replace(/\\/g, "/");

    if (!candidates.some((ns) => hasKey(ns, bare))) {
      misses.push(`${rel} → ${key}`);
      continue;
    }

    // Ключ найден — но ведёт ли он к тексту?
    if (!asObjects.has(key)) {
      const resolved = candidates
        .map((ns) => valueAt(ns, bare))
        .find((v) => v !== undefined);
      if (resolved && typeof resolved === "object" && !Array.isArray(resolved)) {
        misses.push(`${rel} → ${key} (ключ ведёт к ветке, а не к тексту)`);
      }
    }
  }
}

misses.sort();

// Предупреждение, а не ошибка: сайт с таким расхождением работает, но держится
// на том, что раздача не различает регистр. Стоит выровнять.
if (caseMismatches.length) {
  const uniq = [...new Set(caseMismatches)].sort();
  console.warn(
    `\nПространство имён и файл различаются регистром (${uniq.length}):`,
  );
  for (const m of uniq) console.warn("  " + m);
  console.warn(
    "Работает только потому, что раздача статики регистр не различает.\n",
  );
}

// ── сравнение с базовым списком ──────────────────────────────────────────
let baseline = [];
if (fs.existsSync(BASELINE)) {
  baseline = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
}

if (process.argv.includes("--update-baseline")) {
  fs.writeFileSync(BASELINE, JSON.stringify(misses, null, 2) + "\n", "utf8");
  console.log(`Базовый список обновлён: ${misses.length} записей.`);
  process.exit(0);
}

const known = new Set(baseline);
const fresh = misses.filter((m) => !known.has(m));
const current = new Set(misses);
const stale = baseline.filter((m) => !current.has(m));

if (fresh.length === 0 && stale.length === 0) {
  console.log(
    `Ключи перевода: проверено ${misses.length + 0} пропусков из базового списка, новых нет.`,
  );
  process.exit(0);
}

if (fresh.length) {
  console.error(`\nНОВЫЕ ключи без перевода (${fresh.length}):\n`);
  for (const m of fresh) console.error("  " + m);
  console.error(
    "\nДобавьте ключ во ВСЕ языки public/locales/*/<namespace>.json.\n" +
      "defaultValue не заменяет перевод: он лишь прячет пропуск за русским текстом.",
  );
}

if (stale.length) {
  console.error(`\nУстаревшие записи базового списка (${stale.length}):\n`);
  for (const m of stale) console.error("  " + m);
  console.error(
    "\nЭти пропуски уже закрыты — уберите их: npm run check:locale-usage -- --update-baseline",
  );
}

// На сборщике Netlify не валим сборку.
//
// Эта проверка уже остановила выкатку сайта на ЛОЖНОМ срабатывании: базовый
// список снят на Windows, где регистр имени файла не важен, а на Linux
// словарь не нашёлся — 34 «новых» пропуска, которых не было. Цена ошибки
// оказалась несоразмерной: прод не обновлялся, пока это не заметили.
//
// Непереведённая подпись — дефект, но сайт от неё работать не перестаёт.
// Не выехавший деплой — перестаёт. Поэтому на машине разработчика проверка
// падает, а на выкатке говорит громко и пропускает.
if (process.env.NETLIFY) {
  console.error(
    "\nСборка продолжена: на выкатке эта проверка предупреждает, но не\n" +
      "останавливает деплой. Исправьте и закоммитьте — локально она падает.",
  );
  process.exit(0);
}

process.exit(1);
