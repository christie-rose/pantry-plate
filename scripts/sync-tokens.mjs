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
const css = fs.readFileSync("src/app/globals.css", "utf8");
const start = "/* ds:colors:start";
const end = "/* ds:colors:end */";
const a = css.indexOf(start);
const b = css.indexOf(end);
if (a < 0 || b < 0) throw new Error("ds:colors markers missing in src/app/globals.css");
const headerEnd = css.indexOf("*/", a) + 2;
const next = css.slice(0, headerEnd) + "\n" + lines.join("\n") + "\n  " + css.slice(b);
fs.writeFileSync("src/app/globals.css", next);
console.log(`Wrote ${lines.length} color tokens`);
