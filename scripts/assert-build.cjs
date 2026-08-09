// client/scripts/assert-build.cjs
//
// ПРОВЕРКА, ЧТО СБОРКА ДЕЙСТВИТЕЛЬНО СОБРАЛАСЬ. Запускается npm-хуком
// postbuild, то есть сразу после `npm run build`.
//
// Зачем это нужно. В build-скрипте стоит CI=false — иначе тысячи накопленных
// предупреждений ESLint валили бы сборку. Но у этого есть последствие, которое
// однажды уронило прод: при ОШИБКЕ ESLint (не предупреждении — например
// no-undef на опечатке в имени функции) webpack не эмитит index.html и
// static/, а react-scripts всё равно завершается кодом 0 и печатает
// «Compiled with the following type errors».
//
// Netlify видит успешный код возврата, публикует папку build — а в ней лежат
// только скопированные файлы из public/. Сайт отвечает 404 на все пути, потому
// что SPA-фоллбэк ведёт на /index.html, которого нет. При этом ни одна
// проверка не покраснела: тесты серверные, а сборка «прошла».
//
// Поэтому здесь проверяется не текст лога, а ФАКТ наличия артефактов. Нет
// index.html или бандла — выходим с ненулевым кодом, и Netlify помечает
// деплой упавшим, оставив предыдущий рабочий опубликованным.

const fs = require("fs");
const path = require("path");

const buildDir = path.join(__dirname, "..", "build");
const indexHtml = path.join(buildDir, "index.html");
const staticJs = path.join(buildDir, "static", "js");

const problems = [];

if (!fs.existsSync(indexHtml)) {
  problems.push("нет build/index.html");
}
if (!fs.existsSync(staticJs) || fs.readdirSync(staticJs).filter((f) => f.endsWith(".js")).length === 0) {
  problems.push("нет ни одного файла в build/static/js");
}

if (problems.length) {
  console.error("");
  console.error("СБОРКА НЕ СОСТОЯЛАСЬ: " + problems.join(", ") + ".");
  console.error("");
  console.error("Почти всегда причина — ОШИБКА ESLint (не предупреждение) выше по логу:");
  console.error("ищите строку «Compiled with the following type errors» и правьте её.");
  console.error("Типичный случай — no-undef: вызов функции, которой в этом файле нет.");
  console.error("");
  console.error("Публиковать эту папку нельзя: в ней только файлы из public/,");
  console.error("а сайт без index.html отвечает 404 на все адреса.");
  process.exit(1);
}

console.log("✓ Артефакты сборки на месте: index.html и бандл в build/static/js");
