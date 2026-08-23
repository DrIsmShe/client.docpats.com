// Проверка: везде ли объявлен t, который вызывает код.
//
// Прошлая версия считала объявлением сам факт вызова useTranslation() — и
// пропустила SurgicalPlanPage, где написано `const { i18n } = useTranslation()`,
// то есть t оттуда не достали вовсе. Сборка упала на no-undef.
//
// Теперь смотрим ИМЕННО деструктуризацию: t объявлен, если он есть среди
// извлечённых свойств, либо приходит параметром компонента.

const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("@babel/parser");

function* walkFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      yield* walkFiles(full);
    } else if (/\.(jsx|tsx)$/.test(e.name) && !/\.test\./.test(e.name)) {
      yield full;
    }
  }
}

const problems = [];

for (const file of walkFiles("src")) {
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes("t(")) continue;

  let ast;
  try {
    ast = parse(src, { sourceType: "module", plugins: ["jsx"], errorRecovery: true });
  } catch {
    continue;
  }

  const scopes = []; // [start, end] функций, где t доступен
  const calls = [];

  (function walk(node, parent, fnStack) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach((n) => walk(n, parent, fnStack));

    let stack = fnStack;
    if (typeof node.type === "string" && /Function/.test(node.type)) {
      stack = [...fnStack, node];
      // t в параметрах: ({ t }) => … или (props, t) => …
      const params = JSON.stringify(node.params || []);
      // В JSON между "type" и "name" стоят start/end, поэтому ищем
      // только само имя.
      if (/"name":"t"/.test(params)) {
        scopes.push([node.start, node.end]);
      }
    }

    // const { t } = useTranslation(...) — важно, что t ИЗВЛЕЧЁН.
    if (
      node.type === "VariableDeclarator" &&
      node.init &&
      node.init.type === "CallExpression" &&
      node.init.callee &&
      node.init.callee.name === "useTranslation" &&
      node.id &&
      node.id.type === "ObjectPattern"
    ) {
      const hasT = node.id.properties.some(
        (p) =>
          p.type === "ObjectProperty" &&
          ((p.key && p.key.name === "t") || (p.value && p.value.name === "t")),
      );
      const fn = stack[stack.length - 1];
      if (hasT && fn) scopes.push([fn.start, fn.end]);
    }

    if (node.type === "CallExpression" && node.callee && node.callee.name === "t") {
      calls.push(node);
    }

    for (const k of Object.keys(node)) {
      if (k === "loc") continue;
      walk(node[k], node, stack);
    }
  })(ast.program, null, []);

  const outside = calls.filter((c) => !scopes.some(([s, e]) => c.start >= s && c.start <= e));
  if (outside.length) {
    problems.push({
      file: path.relative(process.cwd(), file).replace(/\\/g, "/"),
      lines: outside.map((c) => src.slice(0, c.start).split("\n").length),
    });
  }
}

if (!problems.length) {
  console.log("t объявлен везде, где вызывается.");
  process.exit(0);
}
console.error(`t вызывается там, где не объявлен — ${problems.length} файлов:\n`);
for (const p of problems) {
  console.error("  " + p.file + " — строки " + p.lines.slice(0, 6).join(", "));
}
process.exit(1);
