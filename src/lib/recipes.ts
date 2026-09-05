import { prisma } from "@/lib/prisma";

export const RECIPE_SOURCES = ["manual", "ai", "photo", "link"] as const;
export type RecipeSource = (typeof RECIPE_SOURCES)[number];

export type IngredientInput = {
  name: string;
  amount: number | null;
  unit: string | null;
};

export type RecipeInput = {
  title: string;
  tags: string[];
  servings: number;
  instructions: string[];
  notes: string | null;
  source: RecipeSource;
  sourceUrl: string | null;
  ingredients: IngredientInput[];
};

export function validateRecipeInput(body: unknown): RecipeInput | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Invalid request body" };
  }
  const b = body as Record<string, unknown>;

  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (!title) return { error: "Title is required" };

  const servings = Number(b.servings);
  if (!Number.isFinite(servings) || servings <= 0) {
    return { error: "Servings must be a positive number" };
  }

  const tags = Array.isArray(b.tags)
    ? b.tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim())
    : [];

  const instructions = Array.isArray(b.instructions)
    ? b.instructions.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim())
    : [];
  if (instructions.length === 0) return { error: "At least one instruction step is required" };

  const source = typeof b.source === "string" && RECIPE_SOURCES.includes(b.source as RecipeSource)
    ? (b.source as RecipeSource)
    : "manual";

  const sourceUrl = typeof b.sourceUrl === "string" && b.sourceUrl.trim() ? b.sourceUrl.trim() : null;
  const notes = typeof b.notes === "string" && b.notes.trim() ? b.notes.trim() : null;

  const rawIngredients = Array.isArray(b.ingredients) ? b.ingredients : [];
  const ingredients: IngredientInput[] = [];
  for (const raw of rawIngredients) {
    if (typeof raw !== "object" || raw === null) continue;
    const r = raw as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!name) continue;
    const amount = typeof r.amount === "number" && Number.isFinite(r.amount) ? r.amount : null;
    const unit = typeof r.unit === "string" && r.unit.trim() ? r.unit.trim() : null;
    ingredients.push({ name, amount, unit });
  }
  if (ingredients.length === 0) return { error: "At least one ingredient is required" };

  return { title, tags, servings, instructions, notes, source, sourceUrl, ingredients };
}

/** Matches a candidate ingredient name against pantry item names (case-insensitive, either-direction substring). */
export async function matchIngredientToPantry(name: string) {
  const lower = name.toLowerCase();
  const pantryItems = await prisma.pantryItem.findMany();
  return pantryItems.find(
    (item) =>
      item.name.toLowerCase() === lower ||
      lower.includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(lower),
  );
}
