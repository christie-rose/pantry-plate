// Builds the A Tavola design system's component bundle from the real app files in src/ui.
// Shared pieces come from src/ui; scripts/design-system/handwritten.* hold the rest.
// Usage: node scripts/build-design-system.mjs <output dir>   (writes <dir>/project/components/bundle.js + bundle.css)
// Then publish those files to the design system artifact.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const out = path.resolve(process.argv[2] ?? "design-system-build");
const uiDir = path.resolve("src/ui");
const files = fs.readdirSync(uiDir).filter((f) => /\.tsx?$/.test(f) && f !== "index.ts");
const names = [];

let body = "";
for (const f of files) {
  const src = fs.readFileSync(path.join(uiDir, f), "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2017 },
  }).outputText;
  const exportsFound = [...src.matchAll(/export function (\w+)/g)].map((m) => m[1]);
  names.push(...exportsFound);
  body += `\n  (function(exports){${js}\n  })(__m);\n`;
}
const hand = fs.readFileSync("scripts/design-system/handwritten.js", "utf8");
names.push(...[...hand.matchAll(/(\w+): \1[,\s}]/g)].map((m) => m[1]).filter((n) => /^[A-Z]/.test(n)));
const INTERNAL = new Set(["DisabledButton"]);
const header = `/* @ds-bundle: ${JSON.stringify({ format: 4, namespace: "ATavola", components: names.filter((n) => !INTERNAL.has(n)).map((name) => ({ name })) })} */\n`;
const bundle = `${header}(function(){\n  var __m = {};\n  var React = window.React;\n  var require = function(n){ if (n === "react") return React; throw new Error(n); };\n${body}\n  window.ATavola = Object.assign(window.ATavola || {}, __m);\n})();\n${hand}`;

// CSS: compile Tailwind over src/ui with the app's tokens.
const tokens = fs.readFileSync("src/app/globals.css", "utf8").split("@theme inline")[0].replace('@import "tailwindcss";', "");
const theme = fs.readFileSync("src/app/globals.css", "utf8").match(/@theme inline \{[\s\S]*?\n\}/)[0];
const input = `@import "tailwindcss" source("${uiDir}");\n${tokens}\n${theme}\n`;
const css = (await postcss([tailwind()]).process(input, { from: path.resolve("src/app/globals.css") })).css;

const dir = path.join(out, "project/components");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "bundle.js"), bundle);
fs.writeFileSync(path.join(dir, "bundle.css"), css + "\n" + fs.readFileSync("scripts/design-system/handwritten.css", "utf8"));
console.log("components:", names.join(", "), "| css bytes:", css.length);
