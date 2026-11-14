# A Tavola

## Design system is the source of truth
The A Tavola Design System artifact (https://claude.ai/artifact/186Vm4ZaQ32Y2doaVoLJFP) drives the app's colors and shared components. The user edits it there, then asks "sync the app to the design system".

To sync:
1. Read these files from the artifact (Artifact `read` with `paths`, `out_dir` in the scratchpad): `project/tokens.json` and everything in `project/components/src/`.
2. `node scripts/sync-from-design-system.mjs <out_dir>` writes the color tokens into the marked block of `src/app/globals.css` and copies the component sources into `src/ui/`.
3. Run `npx tsc --noEmit`, start the preview and check the Grocery List and Meal Plan screens. Report what changed. Do not commit or push without the user's say-so.
4. Rebuild the design system's compiled bundle with `node scripts/build-design-system.mjs <folder>` and publish `project/components/bundle.js` and `bundle.css` to the artifact.

Do not hand-edit the `ds:colors` block in `globals.css` or the four files in `src/ui/`; the next sync overwrites them. If the user asks for a change to those in the app, make it in the design system first (or tell them the edit will be overwritten).

Not yet synced (documented in the design system, built by hand in the app): type scale, spacing, radius, grocery row, actions menu, modal, card and nav layouts. The mirrors of those live in `scripts/design-system/`; keep them in step when the app changes.
