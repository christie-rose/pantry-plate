# A Tavola

## Design system
The A Tavola Design System artifact (https://claude.ai/artifact/186Vm4ZaQ32Y2doaVoLJFP) mirrors the shared UI: tokens in `src/app/globals.css`, and AppNav, filter chips, tag chips, grocery rows, the actions menu, the recipe modal and the week selector. After changing any of those, update the matching design-system files so they stay in sync.

Shared UI (Button, FilterChip, TagChip, NavLink) lives in `src/ui/` and is used by the screens and compiled into the design system by `node scripts/build-design-system.mjs <folder>`. Change those files, not copies of their classes in the screens. After changing them, or the hand-written mirrors in `scripts/design-system/`, rebuild and publish the design system.
