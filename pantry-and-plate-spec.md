# Pantry & Plate — Build Specification

A private, mobile-optimized family meal-planning app: pantry tracking, a recipe box, weekly meal planning, grocery lists split by store, and a monthly grocery budget with receipt logging. Single household password, no individual accounts.

This document is written to be handed directly to Claude Code as the starting brief.

---

## 1. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | One project for pages, API routes, and server logic |
| Database | PostgreSQL | Relational data, works well with Railway |
| ORM | Prisma | Type-safe queries, easy migrations |
| Hosting | Railway | Postgres + app in one project/one bill; no server maintenance |
| Auth | Single shared password, signed cookie | No user accounts needed — see §4 |
| AI | Anthropic API, server-side only | Recipe generation, weekly planning, photo/receipt reading |
| Styling | Same design system as the original artifact (see §9) | Carries over the "Pantry & Plate" look with no redesign work |

**Not DreamHost:** your DreamHost plan is shared hosting, which doesn't support Postgres or an always-on Node process (confirmed against DreamHost's own docs). Railway is the right fit here — Postgres and the app live in one project, no server admin required. If you later get a DreamHost VPS with root access, this stack could move there, but it would then be on you to patch the OS and manage the server indefinitely, which isn't worth it for a household app.

---

## 2. Environment variables

```
DATABASE_URL=          # provided by Railway's Postgres plugin
ANTHROPIC_API_KEY=     # from console.anthropic.com — server-side only, never sent to the browser
APP_PASSWORD=          # the household password
SESSION_SECRET=        # random string, used to sign the login cookie
```

---

## 3. Data model (Prisma schema)

```prisma
model PantryItem {
  id             String   @id @default(cuid())
  name           String
  location       String   // "Pantry" | "Fridge" | "Freezer"
  preferredStore String   // "Costco" | "Albertsons" | "WinCo" | "Other"
  isStaple       Boolean  @default(false)
  stapleStatus   String?  // "In stock" | "Low" | "Out" — used when isStaple = true
  quantity       String?  // free text, e.g. "2 lb" — used when isStaple = false
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  ingredientLinks RecipeIngredient[]
}

model Recipe {
  id           String   @id @default(cuid())
  title        String
  tags         String[]
  servings     Int
  instructions String[]
  notes        String?
  source       String   // "manual" | "ai" | "photo" | "link"
  sourceUrl    String?
  createdAt    DateTime @default(now())
  ingredients  RecipeIngredient[]
}

model RecipeIngredient {
  id           String      @id @default(cuid())
  recipeId     String
  recipe       Recipe      @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  name         String
  amount       Float?
  unit         String?
  pantryItemId String?
  pantryItem   PantryItem? @relation(fields: [pantryItemId], references: [id])
  reviewed     Boolean     @default(false) // false = still needs pantry-matching pass
}

model DietaryEntry {
  id       String  @id @default(cuid())
  name     String
  category String  // "Allergy" | "Diet" | "Dislike" | "Preference"
  detail   String?
}

model WeekPlan {
  id          String @id @default(cuid())
  weekKey     String @unique // ISO date of that week's Monday
  dayTags     Json   // { Mon: "busy", Tue: "normal", Wed: "eating-out", ... }
  dinners     Json   // { Mon: [entry, entry], Tue: [...], ... } — see §6 for entry shape
  weeklyMeals Json   // { breakfast: [entry...], lunch: [...], snack: [...] }
}

model GroceryList {
  id      String @id @default(cuid())
  weekKey String @unique
  items   Json   // array of grocery item objects — see §7
}

model Budget {
  id            String    @id @default(cuid())
  monthlyBudget Float     @default(0)
  expenses      Expense[]
}

model Expense {
  id       String   @id @default(cuid())
  budgetId String
  budget   Budget   @relation(fields: [budgetId], references: [id])
  date     DateTime
  amount   Float
  store    String
  note     String?
}
```

**Meal plan / grocery list entries are stored as JSON, not fully normalized tables.** This is a deliberate simplification: this data isn't queried or reported on across weeks, it's just read and written as a whole per week, so JSON columns save a lot of join complexity for no real cost. `RecipeIngredient`, `PantryItem`, `Recipe`, `DietaryEntry`, and `Expense` are normalized because those genuinely benefit from relations and filtering.

**Entry shape** used inside `dinners` and `weeklyMeals`:
```json
{ "id": "m1", "type": "recipe", "recipeId": "abc123", "label": "Chicken fajitas", "servings": 4 }
{ "id": "m2", "type": "text", "label": "White rice" }
```

---

## 4. Authentication

No user accounts. A single middleware checks for a signed cookie on every route except `/login`:

- `/login` — password field, checks against `APP_PASSWORD`, sets an httpOnly signed cookie (long expiry, e.g. 90 days) on success
- Everything else — redirects to `/login` if the cookie is missing or invalid
- No "who's logged in" concept anywhere in the UI — it's one household, one session type

---

## 5. Navigation & mobile optimization

- **Bottom tab bar on mobile** (not the side rail from the artifact) — five icons: Pantry, Recipes, Plan, Grocery, Budget. Household/dietary settings live behind a gear icon rather than taking a tab slot.
- Side rail returns at desktop widths (≥768px), same as the artifact.
- Add a **web app manifest** (`manifest.json`) with icons so "Add to Home Screen" gives it a real app icon and launches without browser chrome.
- Touch targets sized for thumbs (minimum ~44px), no hover-only interactions.
- Voice input buttons (mic icon) next to the relevant quick-add fields — see §11.

---

## 6. Meal planning

- **Dinner**: one column per day, Monday–Sunday. Each day can hold multiple entries — recipes or plain-text items (e.g., "Chicken fajitas" + "White rice" as two entries under Wednesday).
- **Breakfast / Lunch / Snack**: one list per meal type for the whole week, not tied to a specific day. Same entry shape (recipe or text), just not nested under a day.
- Adding a recipe to any slot lets you set servings independently of the recipe's default servings.
- **"Plan my week" (AI)**: before generating, you tag each day with one of: Normal / Busy or quick / Eating out / Have extra time. Claude then proposes a full week of dinners using:
  - your existing recipe library first, generating new ones only where nothing fits
  - your day tags (quick meals on busy nights, something more involved on "have time" days)
  - a variety pass — avoiding the same protein or cuisine on consecutive nights
  - your pantry, prioritizing recipes that use what's already on hand
  - your dietary profile, governed by the same "respect household restrictions" toggle as single-recipe generation
  - The result is a **draft you review and edit before it saves** — same pattern as the single-recipe draft preview in the current artifact, just for seven days at once.

---

## 7. Pantry

Fields: name, location (Pantry / Fridge / Freezer), preferred store, staple flag, and either a staple status (In stock / Low / Out) or a free-text quantity, depending on the flag.

- Manual add and delete only — an item going "Out" never disappears on its own.
- Default sort: alphabetical. Also searchable, and filterable by location, store, and staple status.
- Voice add (see §11).

---

## 8. Grocery list

- **Generate from the week's plan**: walks every dinner entry, every weekly breakfast/lunch/snack entry, and every recipe's ingredients.
  - Staple pantry items: skipped only when status is "In stock"; Low or Out gets added.
  - Non-staple pantry items: skipped if there's any quantity on hand at all, added if none. (Deliberately not doing exact quantity math against recipe amounts — too fragile to be worth it.)
  - Items with no pantry match at all are added.
- Grouped by store, same as the artifact. A per-item store dropdown lets you override the store for this trip only, without changing the item's saved preferred store.
- **Manual add**: if the item name doesn't already exist in the pantry, it's created there too (default: non-staple, location "Pantry", quantity blank, store = whichever you picked for the grocery item) — you can adjust anytime from the Pantry tab.
- **Mark shopped**: on a single item or the whole list. Removes it/them from the grocery list. Per your call, this does **not** touch pantry status or quantity — you'll update pantry separately.
- Manual delete, independent of "shopped."

---

## 9. Recipes

Three ways to add a recipe, all landing in the same editable form before saving:

1. **Manual** — same form as the current artifact.
2. **Photo of a paper recipe** — upload/take a photo; sent directly to Claude's vision capability to extract title, ingredients, and steps. The photo itself isn't stored (see note below); only the extracted text is saved.
3. **Link to a recipe online** — the app fetches the page server-side. Most recipe sites embed structured data (schema.org `Recipe` JSON-LD) that's parsed directly and reliably; if a site doesn't have that, the page text is sent to Claude to extract the recipe instead.

**Ingredient ↔ pantry matching**: after any recipe is saved (manual, AI, photo, or link), each ingredient is checked against pantry item names. Unmatched ones appear in a lightweight "new ingredients found" panel — match to an existing pantry item, or add fresh (setting store, staple flag, and quantity in the same step). This panel is dismissible and non-blocking: the recipe saves regardless, and unmatched ingredients are simply flagged `reviewed: false` so grocery-list generation still works correctly (it just treats them as "no pantry match," which is the safe default).

Servings: each recipe has a default; adding it to a meal plan slot lets you override the servings for that specific meal without changing the recipe's default.

**On not storing photos:** recipe photos and receipt photos are sent to the Anthropic API for reading, then discarded — only the extracted data is saved. This keeps the build simple (no file storage service to set up). If you later want a photo archive of receipts or recipe cards, that's a real feature to add, but it means adding object storage (e.g., Cloudflare R2) — worth doing only if you find you actually want it.

---

## 10. Budget & receipts

- Same monthly budget tracking as the artifact: target, running total, progress bar, purchase log.
- **Logging a purchase**: snap a photo of the receipt; Claude reads it and proposes a total, which you confirm (or correct) before it's logged as an expense. No line-item parsing — just the total, which is what actually needs to hit the budget.

---

## 11. Voice input

- Pantry quick-add and grocery quick-add both get a mic button using the browser's built-in speech-to-text (the Web Speech API — built into Chrome and Safari on iOS, no extra service needed).
- The transcribed text ("three cans of black beans") is sent to Haiku to parse into a structured item (name, quantity, unit) before showing it to you to confirm and save. This call is cheap enough to be a rounding error (see §12).

---

## 12. AI usage (Haiku 4.5, server-side only)

| Feature | Roughly | Notes |
|---|---|---|
| Single recipe generation | <1¢ | Same as current artifact |
| Weekly plan generation | 1–3¢ | Larger prompt (whole recipe library + week context), still trivial |
| Photo recipe parsing | ~1–2¢ | Vision input costs a bit more than text |
| Receipt reading | ~1¢ | Vision, short output (just a number) |
| Voice item parsing | <<1¢ | Tiny prompt, tiny output |

Realistic total: a few dollars a **year**, even with daily use. Budget for a small prepaid balance on the Anthropic Console and forget about it.

---

## 13. Design system (carried over from the artifact)

```
Colors: --paper #F6EFDD, --paper-alt #EFE6CE, --ink #2B3B2F,
        --brick #A8412F, --butter #E8B84B, --sage #7C8A6E,
        --cocoa #6B5744, --white #FFFDF7
Fonts: Fraunces (headings), Karla (body/UI)
Cards: asymmetric corner radius (4px 14px 4px 14px), warm hairline borders
Ledger-style rows for pantry/grocery/budget lists; card grid for recipes
```

Ask Claude Code to reuse this token set exactly — it's already been through a design pass and there's no reason to redo that work.

---

## 14. Suggested build order

Building all of this in one shot invites mistakes. Suggested phases, each a working checkpoint:

1. **Scaffold + auth** — Next.js project, Prisma schema, Railway Postgres connected, password gate working.
2. **Pantry** — full CRUD, sort/search/filter, voice add.
3. **Recipes** — manual add/edit first, then photo parsing, then link parsing, then the ingredient-matching panel.
4. **Meal plan** — dinner-per-day + weekly breakfast/lunch/snack, text and recipe entries, servings override.
5. **AI: single recipe + weekly planner** — single recipe first (it's simpler and reuses the artifact's prompt), then the day-tagging + weekly planner on top of it.
6. **Grocery list** — generation logic, store grouping, manual add/delete, shopped marking.
7. **Budget + receipts** — budget tracking, then receipt photo → AI total → confirm flow.
8. **Mobile polish** — bottom nav, manifest.json/PWA install, touch target pass.
9. **Deploy to Railway** — connect GitHub repo, set environment variables, verify live.

---

## 15. First prompt for Claude Code

```
I want to build a private family meal-planning web app called "Pantry & Plate."
I have a full specification in pantry-and-plate-spec.md in this folder — please
read it in full before writing any code. Start with Phase 1 from section 14
(scaffold + auth) and stop for my review before moving to Phase 2.
```

Drop the spec file in your project folder alongside that prompt.
