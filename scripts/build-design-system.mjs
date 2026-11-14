// Builds the A Tavola design system's component bundle from the real app files in src/ui.
// Usage: node scripts/build-design-system.mjs <output dir>   (writes <dir>/project/components/bundle.js, bundle.css, src/*)
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
// Parts shown inside another component's preview rather than as their own entry.
const INTERNAL = new Set(["DisabledButton", "MenuItem", "GroceryList", "AddButton"]);

// Remix icons: the app's own icon package supplies the real path data.
const remix = require("@remixicon/react");
const iconNames = new Set();
for (const f of files) {
  const src = fs.readFileSync(path.join(uiDir, f), "utf8");
  for (const m of src.matchAll(/import \{([^}]+)\} from "@remixicon\/react"/g)) {
    m[1].split(",").map((n) => n.trim()).filter(Boolean).forEach((n) => iconNames.add(n));
  }
}
const iconPaths = {};
for (const n of iconNames) {
  const m = String(remix[n]).match(/\{d:"([^"]+)"\}/);
  if (!m) throw new Error("No path found for icon " + n);
  iconPaths[n] = m[1];
}

const names = [];
let body = "";
for (const f of files) {
  const src = fs.readFileSync(path.join(uiDir, f), "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2017 },
  }).outputText;
  names.push(...[...src.matchAll(/export function (\w+)/g)].map((m) => m[1]));
  body += `\n  (function(exports){${js}\n  })(__m);\n`;
}

const header = `/* @ds-bundle: ${JSON.stringify({
  format: 4,
  namespace: "ATavola",
  components: names.filter((n) => !INTERNAL.has(n)).map((name) => ({ name })),
})} */\n`;
const bundle = `${header}(function(){
  var __m = {};
  var React = window.React;
  var ICONS = ${JSON.stringify(iconPaths)};
  var icons = {};
  Object.keys(ICONS).forEach(function (n) {
    icons[n] = function (p) {
      var s = p.size || 24;
      return React.createElement("svg", { viewBox: "0 0 24 24", width: s, height: s, fill: "currentColor", "aria-hidden": true }, React.createElement("path", { d: ICONS[n] }));
    };
  });
  var require = function (n) { if (n === "react") return React; if (n === "@remixicon/react") return icons; if (n.indexOf("./") === 0) return __m; throw new Error(n); };
${body}
  window.ATavola = Object.assign(window.ATavola || {}, __m);
})();
`;

// CSS: compile Tailwind over src/ui with the app's tokens, radii and the .card rule.
const globals = fs.readFileSync("src/app/globals.css", "utf8");
const input =
  globals.replace('@import "tailwindcss";', `@import "tailwindcss" source("${uiDir}");`) +
  "\nbody{font-family:var(--font-body),system-ui,sans-serif;margin:0}h2,h3,h4{font-family:var(--font-display),Georgia,serif}h1,.font-title{font-family:var(--font-title),cursive}\n";
const css = (await postcss([tailwind()]).process(input, { from: path.resolve("src/app/globals.css") })).css;

const dir = path.join(out, "project/components");
fs.mkdirSync(path.join(dir, "src"), { recursive: true });
fs.writeFileSync(path.join(dir, "bundle.js"), bundle);
fs.writeFileSync(path.join(dir, "bundle.css"), css);
for (const f of fs.readdirSync(uiDir)) fs.copyFileSync(path.join(uiDir, f), path.join(dir, "src", f));
console.log("components:", names.filter((n) => !INTERNAL.has(n)).join(", "), "| css bytes:", css.length);
