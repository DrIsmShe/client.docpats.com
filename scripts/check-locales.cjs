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

// Проверяем только те пространства имён, которые ведём по-настоящему
// синхронно. Остальные исторически расходятся, и падать на них — значит
// приучить всех запускать проверку с закрытыми глазами.
const NAMESPACES = ["diagnostics", "arena", "modalities"];

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

let problems = 0;

for (const ns of NAMESPACES) {
  const reference = flatten(read(REFERENCE, ns));
  const referenceKeys = Object.keys(reference);
  console.log(`\n${ns}: эталон ${REFERENCE}, ключей ${referenceKeys.length}`);

  for (const lang of languages) {
    if (lang === REFERENCE) continue;

    const file = path.join(LOCALES, lang, `${ns}.json`);
    if (!fs.existsSync(file)) {
      console.log(`  ${lang}: файла нет`);
      problems += 1;
      continue;
    }

    const data = flatten(read(lang, ns));
    const missing = referenceKeys.filter((k) => !(k in data));
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
      console.log(`  ${lang}: ок`);
      continue;
    }

    problems += 1;
    if (missing.length) console.log(`  ${lang}: нет ключей — ${missing.join(", ")}`);
    if (extra.length) console.log(`  ${lang}: лишние ключи — ${extra.join(", ")}`);
    if (empty.length) console.log(`  ${lang}: пустые значения — ${empty.join(", ")}`);
    if (shortLists.length) console.log(`  ${lang}: списки разной длины — ${shortLists.join(", ")}`);
  }
}

if (problems) {
  console.error(`\nРасхождений: ${problems}`);
  process.exit(1);
}
console.log("\nВсе словари согласованы.");
