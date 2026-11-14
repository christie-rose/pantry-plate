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
const shadowToken = tokens.shadow?.tokens?.find((t) => t.name === "shadow-card");
const shadowValue = typeof shadowToken?.value === "string" ? shadowToken.value : shadowToken?.value?.[theme];
if (!shadowValue || !/^[0-9a-z\s.,()-]+$/i.test(shadowValue)) throw new Error("shadow-card token is missing or has unsupported characters");
css = replaceBlock(css, "colors", lines, "  ");
css = replaceBlock(css, "shadow", [`  --shadow-card: ${shadowValue};`], "  ");
css = replaceBlock(css, "radius", [`  --radius-md: ${radius["radius-control"]};`, `  --radius-lg: ${radius["radius-modal"]};`], "  ");
css = replaceBlock(
  css,
  "card",
  [
    ".card {",
    `  border-radius: ${radius["radius-card-sm"]} ${radius["radius-card-lg"]} ${radius["radius-card-sm"]} ${radius["radius-card-lg"]};`,
    "  border: none;",
    "  background: var(--white);",
    "  box-shadow: var(--shadow-card);",
    "}",
  ],
  ""
);
const titleStack = tokens.type?.families?.title;
if (!titleStack || !/^"[^"]+",\s*[a-z-]+$/.test(titleStack)) throw new Error('type.families.title must look like "Font Name", cursive');
const titleFallback = titleStack.split(",").slice(1).join(",").trim();
css = replaceBlock(css, "title", ["h1,", ".font-title {", `  font-family: var(--font-kaushan), ${titleFallback};`, "}"], "");
const grain = Number(tokens.texture?.tokens?.find((t) => t.name === "paper-grain")?.value ?? "0");
if (!(grain >= 0 && grain <= 0.3)) throw new Error("texture paper-grain must be a number from 0 to 0.3");
const noise =
  "%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.45 0 0 0 0 0.34 0 0 0 0 0.2 0 0 0 3 -0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
css = replaceBlock(
  css,
  "paper",
  [
    "body::before {",
    '  content: "";',
    "  position: fixed;",
    "  inset: 0;",
    "  z-index: -1;",
    "  pointer-events: none;",
    `  opacity: ${grain};`,
    `  background-image: url("data:image/svg+xml,${noise}");`,
    "}",
  ],
  ""
);
fs.writeFileSync("src/app/globals.css", css);
console.log(`Wrote ${lines.length} color tokens and 4 radii`);
