#!/usr/bin/env node
// client/scripts/check-locales.js
//
// Сверяет состав словарей между языками: npm run check:locales
//
// ЗАЧЕМ. Отсутствующий ключ в переводе не ломает сборку и не бросает ошибку —
// i18next молча покажет сам ключ («deleteConfirm» вместо «Удалить безвозвратно»)
// или текст языка по умолчанию. То есть турецкая версия может месяцами стоять
// наполовину русской, и заметит это только турецкий врач.
//
// Пустая строка не лучше отсутствия: подпись исчезает, кнопка остаётся без
// текста. Поэтому пустые значения тоже считаются расхождением.
//
// Эталон — русский: раздел пишется на нём, остальные догоняют.

// CommonJS: у клиента нет "type": "module" в package.json, и ESM-скрипт
// падал бы с SyntaxError при запуске через node.
const fs = require("node:fs");
const path = require("node:path");

const LOCALES = path.join(process.cwd(), "public", "locales");
const REFERENCE = "ru";

// Проверяем ВСЕ словари, а не избранные три.
//
// Раньше здесь стоял список из diagnostics/arena/modalities — «остальные
// исторически расходятся». Из-за этого перекос между языками не ловился
// нигде: заголовок карточки пациента был в русском и арабском, но не в
// азербайджанском, и на азербайджанском страница показывала русский текст.
// Ни сверка кода со словарём, ни детектор разметки такого не видят: ключ
// существует, вызов на месте, паритет никто не смотрит.
//
// Накопленное расхождение (полторы тысячи ключей) заморожено в базовом
// списке — падаем на новых и на устаревших записях, как в соседних
// проверках.
const NAMESPACES = fs
  .readdirSync(path.join(LOCALES, REFERENCE))
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .sort();

const BASELINE = path.join(process.cwd(), "scripts", "locales-parity-baseline.json");

const read = (lang, ns) =>
  JSON.parse(fs.readFileSync(path.join(LOCALES, lang, `${ns}.json`), "utf8"));

// Словари вложенные (rules.exam2, vp.comp.workup), а сравнивать нужно листья.
// По верхнему уровню проверка была бы обманчивой: наличие ветки «rules» ничего
// не говорит о том, что внутри неё есть exam2, а именно там лежит условие
// расхода зачётной попытки. Плюс на объекте String(v).trim() даёт
// «[object Object]» — непустую строку, и проверка на пустые значения молча
// пропускала бы целые ветки.
function flatten(value, prefix = "", out = {}) {
  for (const [key, item] of Object.entries(value)) {
    const name = `${prefix}${key}`;
    if (item && typeof item === "object" && !Array.isArray(item)) flatten(item, `${name}.`, out);
    else out[name] = item;
  }
  return out;
}

const languages = fs
  .readdirSync(LOCALES, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

// Каждое расхождение — одна строка «ns | lang | вид | ключ», чтобы список
// можно было сравнивать построчно, как в соседних проверках.
const findings = [];
const verbose = process.argv.includes("--verbose");

for (const ns of NAMESPACES) {
  const reference = flatten(read(REFERENCE, ns));
  const referenceKeys = Object.keys(reference);
  if (verbose) console.log(`\n${ns}: эталон ${REFERENCE}, ключей ${referenceKeys.length}`);

  for (const lang of languages) {
    if (lang === REFERENCE) continue;

    const file = path.join(LOCALES, lang, `${ns}.json`);
    if (!fs.existsSync(file)) {
      findings.push(`${ns} | ${lang} | файла нет`);
      continue;
    }

    const data = flatten(read(lang, ns));
    // Формы множественного числа сравнивать между языками нельзя.
    //
    // В русском их три — _one / _few / _many («1 таблетка», «2 таблетки»,
    // «5 таблеток»), в английском, турецком и азербайджанском две — _one и
    // _other. Отсутствие русских _few и _many в других языках это не дыра,
    // а правило самого языка; i18next выбирает нужную форму сам.
    //
    // Без этой оговорки проверка выдавала 136 ложных находок и заглушала
    // собой настоящие расхождения — а ради них она и написана.
    const PLURAL_ONLY_IN_RU = /_(few|many)$/;
    const missing = referenceKeys
      .filter((k) => !(k in data))
      .filter((k) => !(lang !== "ru" && PLURAL_ONLY_IN_RU.test(k)));
    const extra = Object.keys(data).filter((k) => !(k in reference));
    const empty = Object.entries(data)
      .filter(([, v]) => !String(v).trim())
      .map(([k]) => k);

    // Списки (checklist, redFlags) — это протокол разбора, который врач читает
    // перед отправкой материала. Одного наличия ключа мало: если в русском
    // семь пунктов, а в турецком шесть, ключ на месте, проверка молчит, а
    // турецкий врач просто не увидит один пункт протокола.
    const shortLists = referenceKeys
      .filter((k) => Array.isArray(reference[k]))
      .filter((k) => !Array.isArray(data[k]) || data[k].length !== reference[k].length)
      .map((k) => `${k} (${reference[k].length} → ${Array.isArray(data[k]) ? data[k].length : "не список"})`);

    if (!missing.length && !extra.length && !empty.length && !shortLists.length) {
      if (verbose) console.log(`  ${lang}: ок`);
      continue;
    }

    for (const k of missing) findings.push(`${ns} | ${lang} | нет ключа | ${k}`);
    for (const k of extra) findings.push(`${ns} | ${lang} | лишний ключ | ${k}`);
    for (const k of empty) findings.push(`${ns} | ${lang} | пустое значение | ${k}`);
    for (const k of shortLists) findings.push(`${ns} | ${lang} | список короче | ${k}`);
  }
}

findings.sort();

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

if (!fresh.length && !stale.length) {
  console.log(`Паритет словарей: ${findings.length} известных расхождений, новых нет.`);
  process.exit(0);
}

if (fresh.length) {
  console.error(`\nНОВЫЕ расхождения между языками (${fresh.length}):\n`);
  for (const f of fresh.slice(0, 40)) console.error("  " + f);
  if (fresh.length > 40) console.error(`  …и ещё ${fresh.length - 40}`);
  console.error(
    "\nКлюч есть в русском, но не во всех языках — i18next покажет русский\n" +
      "текст или сам ключ. Добавьте перевод во ВСЕ языки.",
  );
}

if (stale.length) {
  console.error(`\nУстаревшие записи базового списка (${stale.length}):\n`);
  for (const f of stale.slice(0, 40)) console.error("  " + f);
  if (stale.length > 40) console.error(`  …и ещё ${stale.length - 40}`);
  console.error("\nЭти расхождения закрыты — обновите список:\n  npm run check:locales -- --update-baseline");
}

// На сборщике не валим сборку — та же причина, что и в соседних проверках:
// сорванный деплой дороже неполного перевода.
if (process.env.NETLIFY) {
  console.error("\nСборка продолжена: на выкатке проверка предупреждает, но не останавливает деплой.");
  process.exit(0);
}
process.exit(1);
