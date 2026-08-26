#!/usr/bin/env node
// client/scripts/check-tdz.cjs
//
// Ищет обращение к const/let ДО его объявления в пределах одной функции —
// «мёртвую зону», которая падает ReferenceError уже при первом рендере.
// Запуск: npm run check:tdz
//
// ЗАЧЕМ ОТДЕЛЬНАЯ ПРОВЕРКА. Каталог /education однажды выкатился белым
// экраном. Код был такой:
//
//     const availableLangs = useMemo(() => { ... programLang(p) ... }, [...]);
//     ...
//     const programLang = (p) => p.primaryLang || p.languages?.[0];
//
// useMemo исполняет колбэк ПРЯМО при рендере, то есть до строки с
// programLang. Обращение к const в мёртвой зоне — ReferenceError, React не
// монтирует ничего, страница пустая.
//
// Ни одна из существующих проверок этого не видела и не могла: для линтера
// имя определено, просто ниже. Сборка CRA идёт с CI=false, поэтому её
// собственные предупреждения ничего не роняют. Пять постбилд-проверок смотрят
// локали и артефакты. Ошибка доехала до боя.
//
// ПОЧЕМУ НЕ ГОЛЫЙ no-use-before-define. На этом коде он даёт 1055 находок, и
// почти все — не ошибки: константа на уровне модуля, использованная внутри
// компонента, к моменту вызова компонента давно определена. Правило их не
// различает, а проверка, которая кричит на тысяче безобидных мест, приучает
// себя не читать.
//
// Здесь сужено до того единственного случая, который действительно падает:
// объявление и обращение лежат в ОДНОЙ функции, и обращение выше. Модульный
// уровень не проверяем вовсе — там до вызова успевает выполниться весь файл.
//
// ЧЕГО ПРОВЕРКА НЕ ВИДИТ, и это осознанные границы:
//   • обращение из вложенной функции, которую вызвали позже (законный приём:
//     колбэк объявлен выше, вызывается ниже);
//   • var — у него мёртвой зоны нет, только undefined;
//   • обращение через this/объект.
//
// БАЗОВЫЙ СПИСОК — как у соседних проверок: падаем на НОВЫХ находках и на
// устаревших записях, чтобы список не превращался в свалку.

const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("@babel/parser");
const traverseModule = require("@babel/traverse");

const traverse = traverseModule.default ?? traverseModule;

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const BASELINE = path.join(ROOT, "scripts", "tdz-baseline.json");

const UPDATE = process.argv.includes("--update-baseline");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

// Вызовы, которые ОТКЛАДЫВАЮТ колбэк. Ссылка из такого колбэка законна:
// к моменту исполнения объявление уже отработало. Всё остальное считаем
// немедленным — useMemo, .map/.filter/.forEach и прочая итерация зовут
// колбэк тут же, и именно так белый экран и случился.
const DEFERRED_CALLEES = new Set([
  "setTimeout",
  "setInterval",
  "setImmediate",
  "queueMicrotask",
  "requestAnimationFrame",
  "requestIdleCallback",
  "addEventListener",
  "then",
  "catch",
  "finally",
  "useEffect",
  "useLayoutEffect",
  "useCallback",
  "useImperativeHandle",
  "Promise",
]);

function calleeName(node) {
  if (!node) return "";
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression" && node.property?.type === "Identifier") {
    return node.property.name;
  }
  return "";
}

/**
 * Исполнится ли эта функция ПРЯМО СЕЙЧАС, по ходу объемлющей.
 *
 * Отличать это обязательно. Первая версия проверки отбрасывала любую ссылку
 * из вложенной функции как безопасную — и пропустила ровно тот баг, ради
 * которого писалась: колбэк .map() и колбэк useMemo вызываются немедленно.
 * Обратная крайность — считать опасным всё подряд — ловила бы обработчики
 * onClick, которые к моменту клика давно в порядке.
 *
 * Признак: функция стоит АРГУМЕНТОМ вызова, и этот вызов не из списка
 * откладывающих. Функция, положенная в переменную, под правило не подпадает —
 * её ещё надо позвать.
 */
function runsImmediately(fnPath) {
  const parent = fnPath.parentPath;
  if (!parent?.isCallExpression()) return false;
  if (parent.node.callee === fnPath.node) return true; // IIFE
  if (!parent.node.arguments.includes(fnPath.node)) return false;
  return !DEFERRED_CALLEES.has(calleeName(parent.node.callee));
}

/**
 * Находки одного файла: обращение к const/let выше его объявления, которое
 * реально исполнится до объявления.
 */
function findInFile(file) {
  const code = fs.readFileSync(file, "utf8");
  let ast;
  try {
    ast = parse(code, {
      sourceType: "module",
      plugins: [
        "jsx",
        "classProperties",
        "optionalChaining",
        "nullishCoalescingOperator",
      ],
    });
  } catch {
    // Файл не разбирается — это забота сборки, не наша.
    return [];
  }

  const found = [];

  // Идём от ССЫЛКИ к её биндингу, а не сопоставляем имена руками. Первая
  // версия делала именно это и врала: `const m` внутри блока if она путала с
  // одноимённым уровнем выше, и сорок три находки из сорока трёх оказались
  // ложными. Области видимости разрешает Babel, и делать это второй раз
  // самому — гарантированная ошибка.
  traverse(ast, {
    ReferencedIdentifier(refPath) {
      const binding = refPath.scope.getBinding(refPath.node.name);
      if (!binding) return;
      // var мёртвой зоны не имеет — там undefined, а не ReferenceError.
      if (binding.kind !== "const" && binding.kind !== "let") return;

      const declNode = binding.path.node;
      if (typeof declNode.start !== "number") return;
      // Ссылка ниже объявления — обычный порядок.
      if (refPath.node.start >= declNode.start) return;

      // Поднимаемся от ссылки до функции, где живёт объявление. Каждая
      // функция по пути должна исполняться немедленно — иначе ссылка
      // законна.
      const declFn = binding.path.getFunctionParent();
      let fn = refPath.getFunctionParent();
      let immediate = true;
      while (fn && fn !== declFn) {
        if (!runsImmediately(fn)) {
          immediate = false;
          break;
        }
        fn = fn.getFunctionParent();
      }
      if (!immediate) return;
      // Ссылка вне функции объявления вовсе — другой модульный порядок,
      // к мёртвой зоне отношения не имеет.
      if (fn !== declFn) return;

      const line = refPath.node.loc?.start.line ?? 0;
      found.push(`${rel(file)}:${line} → ${refPath.node.name}`);
    },
  });

  return [...new Set(found)];
}

const files = walk(SRC);
const findings = files.flatMap(findInFile).sort();

if (UPDATE) {
  fs.writeFileSync(BASELINE, JSON.stringify(findings, null, 2) + "\n", "utf8");
  console.log(`Базовый список обновлён: ${findings.length} записей.`);
  process.exit(0);
}

let baseline = [];
try {
  baseline = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
} catch {
  baseline = [];
}

const known = new Set(baseline);
const current = new Set(findings);
const fresh = findings.filter((f) => !known.has(f));
const stale = baseline.filter((f) => !current.has(f));

if (!fresh.length && !stale.length) {
  console.log(
    `Мёртвая зона: ${findings.length} известных мест, новых нет.`,
  );
  process.exit(0);
}

if (fresh.length) {
  console.error(`\nНОВОЕ обращение к переменной до её объявления (${fresh.length}):\n`);
  for (const f of fresh) console.error("  " + f);
  console.error(
    "\nЭто падает ReferenceError при первом же рендере — белым экраном, а не\n" +
      "предупреждением. Перенесите объявление ВЫШЕ первого использования.",
  );
}

if (stale.length) {
  console.error(`\nУстаревшие записи базового списка (${stale.length}):\n`);
  for (const f of stale) console.error("  " + f);
  console.error(
    "\nЭти места уже исправлены — уберите их:\n" +
      "  npm run check:tdz -- --update-baseline",
  );
}

// На сборщике Netlify не валим сборку — та же причина, что у соседних
// проверок: сорванный деплой дороже, чем находка, которую видно локально.
if (process.env.NETLIFY) {
  console.error(
    "\nСборка продолжена: на выкатке эта проверка предупреждает, но не\n" +
      "останавливает деплой. Исправьте и закоммитьте — локально она падает.",
  );
  process.exit(0);
}

process.exit(1);
