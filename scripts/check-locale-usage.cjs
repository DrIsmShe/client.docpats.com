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
function loadNamespace(ns) {
  const file = path.join(LOCALES, REFERENCE, `${ns}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    console.error(`Словарь ${REFERENCE}/${ns}.json не читается: ${err.message}`);
    process.exit(1);
  }
}

const cache = new Map();
function dictOf(ns) {
  if (!cache.has(ns)) cache.set(ns, loadNamespace(ns));
  return cache.get(ns);
}

function hasKey(ns, key) {
  const dict = dictOf(ns);
  if (!dict) return false;
  let cur = dict;
  for (const part of key.split(".")) {
    if (!cur || typeof cur !== "object" || !(part in cur)) return false;
    cur = cur[part];
  }
  // Пустое значение не лучше отсутствия: подпись исчезает, кнопка остаётся
  // без текста.
  return typeof cur === "string" ? cur.trim().length > 0 : cur != null;
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

function literalKeys(src, names) {
  const keys = new Set();
  for (const name of names) {
    const re = new RegExp(`\\b${name}\\(\\s*["']([^"'\`]+)["']`, "g");
    let m;
    while ((m = re.exec(src))) keys.add(m[1]);
  }
  return keys;
}

// ── проверка ─────────────────────────────────────────────────────────────
const misses = [];

for (const file of walk(SRC)) {
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes("useTranslation")) continue;

  const nss = namespacesOf(src);
  const names = translatorNames(src);

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

    if (!candidates.some((ns) => hasKey(ns, bare))) {
      misses.push(`${path.relative(ROOT, file).replace(/\\/g, "/")} → ${key}`);
    }
  }
}

misses.sort();

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

process.exit(1);
