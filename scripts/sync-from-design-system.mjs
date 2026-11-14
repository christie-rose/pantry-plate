// Pulls the design system into the app. The design system is the source of truth for
// colors (tokens.json) and the shared components (components/src/*.tsx).
// Usage: node scripts/sync-from-design-system.mjs <folder holding the design system's project/ files>
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(process.argv[2] ?? "");
const tokens = path.join(root, "project/tokens.json");
const srcDir = path.join(root, "project/components/src");
if (!fs.existsSync(tokens) || !fs.existsSync(srcDir)) {
  throw new Error("Expected project/tokens.json and project/components/src/ in " + root);
}
execFileSync("node", ["scripts/sync-tokens.mjs", tokens], { stdio: "inherit" });
for (const f of fs.readdirSync(srcDir).filter((f) => /\.tsx?$/.test(f))) {
  fs.copyFileSync(path.join(srcDir, f), path.join("src/ui", f));
  console.log("Updated src/ui/" + f);
}
console.log("Next: npx tsc --noEmit, check the app, then rebuild the design-system bundle.");
