# A Tavola

## Design system is the source of truth
The A Tavola Design System artifact (https://claude.ai/artifact/186Vm4ZaQ32Y2doaVoLJFP) drives the app's colors, corner radii and shared components. The user edits it there, then asks "sync the app to the design system".

To sync:
1. Read these files from the artifact (Artifact `read` with `paths`, `out_dir` in the scratchpad): `project/tokens.json` and every file in `project/components/src/` (list them with `action: "list", scope: "files"` first, so new files are not missed).
2. `node scripts/sync-from-design-system.mjs <out_dir>` writes colors and radii into the marked `ds:` blocks of `src/app/globals.css` and copies the component sources into `src/ui/`.
3. Run `npx tsc --noEmit`, start the preview and check the Grocery List and Meal Plan screens (desktop and mobile width). Report what changed. Do not commit or push without the user's say-so.
4. Rebuild the design system bundle with `node scripts/build-design-system.mjs <folder>` and publish `project/components/bundle.js`, `bundle.css` and `src/*` (as `text/plain`) to the artifact. If a component was added, also add its `components/<Name>/preview.html` and `README.md`, and wire the app screens to it.

Do not hand-edit the `ds:` blocks in `globals.css` or anything in `src/ui/`; the next sync overwrites them. If the user asks for a change to those in the app, make it in the design system first (or tell them the edit will be overwritten).

Synced: colors, the four radii, and every component in `src/ui/` (Button, FilterChip, TagChip, NavLink, Card, Modal, ActionsMenu, WeekSelector, GroceryList/GroceryRow/AddButton, SideRail, MobileBar, MobileMenu). Not synced, documented in tokens.json only: type scale, spacing, shadow. Screen logic (grocery editing, plan drag and drop, recipe picker filters) stays in `src/components/`.
