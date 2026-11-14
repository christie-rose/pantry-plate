// Writes the design system's color tokens into src/app/globals.css.
// Usage: node scripts/sync-tokens.mjs <path to the design system's tokens.json>
import fs from "node:fs";

const tokens = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const theme = tokens.color.themes[0].id;
const lines = tokens.color.tokens.map((t) => {
  const v = typeof t.value === "string" ? t.value : t.value[theme];
  if (!/^#[0-9a-f]{3,8}$/i.test(v)) throw new Error(`Token ${t.name} must be a hex color, got ${v}`);
  return `  --${t.name}: ${v};`;
});
let css = fs.readFileSync("src/app/globals.css", "utf8");

function replaceBlock(css, name, lines, indent) {
  const start = `/* ds:${name}:start`;
  const end = `/* ds:${name}:end */`;
  const a = css.indexOf(start);
  const b = css.indexOf(end);
  if (a < 0 || b < 0) throw new Error(`ds:${name} markers missing in src/app/globals.css`);
  const headerEnd = css.indexOf("*/", a) + 2;
  return css.slice(0, headerEnd) + "\n" + lines.join("\n") + "\n" + indent + css.slice(b);
}

const radius = Object.fromEntries((tokens.radius?.tokens ?? []).map((t) => [t.name, t.value]));
for (const k of ["radius-control", "radius-modal", "radius-card-sm", "radius-card-lg"]) {
  if (!/^\d+(\.\d+)?(px|rem)$/.test(radius[k] ?? "")) throw new Error(`Radius token ${k} must be a px or rem length`);
}
css = replaceBlock(css, "colors", lines, "  ");
css = replaceBlock(css, "radius", [`  --radius-md: ${radius["radius-control"]};`, `  --radius-lg: ${radius["radius-modal"]};`], "  ");
css = replaceBlock(
  css,
  "card",
  [
    ".card {",
    `  border-radius: ${radius["radius-card-sm"]} ${radius["radius-card-lg"]} ${radius["radius-card-sm"]} ${radius["radius-card-lg"]};`,
    "  border: 1px solid var(--cocoa);",
    "  background: var(--white);",
    "}",
  ],
  ""
);
const titleStack = tokens.type?.families?.title;
if (!titleStack || !/^"[^"]+",\s*[a-z-]+$/.test(titleStack)) throw new Error('type.families.title must look like "Font Name", cursive');
css = replaceBlock(css, "title", ["h1 {", `  font-family: var(--font-kaushan), ${titleStack.split(",").slice(1).join(",").trim()};`, "}"], "");
fs.writeFileSync("src/app/globals.css", css);
console.log(`Wrote ${lines.length} color tokens and 4 radii`);
