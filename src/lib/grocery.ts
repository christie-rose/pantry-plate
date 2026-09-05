import { prisma } from "@/lib/prisma";
import type { Dinners, MealEntry, WeeklyMeals } from "@/lib/weekplan";

export type GroceryItem = {
  id: string;
  name: string;
  store: string;
  pantryItemId: string | null;
};

/**
 * Walks every dinner and weekly-meal entry for a week, pulling in each recipe's ingredients
 * (or the entry's own label for a plain-text entry), and decides which ones belong on the
 * grocery list: staple pantry items only when Low/Out, non-staple items only when no quantity
 * is on hand, and anything with no pantry match at all.
 */
export async function computeGroceryItemsForWeek(weekKey: string): Promise<GroceryItem[]> {
  const plan = await prisma.weekPlan.findUnique({ where: { weekKey } });
  if (!plan) return [];

  const dinners = plan.dinners as unknown as Dinners;
  const weeklyMeals = plan.weeklyMeals as unknown as WeeklyMeals;
  const allEntries: MealEntry[] = [...Object.values(dinners).flat(), ...Object.values(weeklyMeals).flat()];

  const recipeIds = allEntries
    .filter((e) => e.type === "recipe" && e.recipeId)
    .map((e) => e.recipeId as string);
  const recipes = await prisma.recipe.findMany({
    where: { id: { in: recipeIds } },
    include: { ingredients: true },
  });
  const recipeById = new Map(recipes.map((r) => [r.id, r]));

  type Candidate = { name: string; pantryItemId: string | null };
  const candidates: Candidate[] = [];

  for (const entry of allEntries) {
    if (entry.type === "recipe" && entry.recipeId) {
      const recipe = recipeById.get(entry.recipeId);
      if (recipe) {
        for (const ingredient of recipe.ingredients) {
          candidates.push({ name: ingredient.name, pantryItemId: ingredient.pantryItemId });
        }
      }
    } else if (entry.type === "text") {
      candidates.push({ name: entry.label, pantryItemId: null });
    }
  }

  const pantryItems = await prisma.pantryItem.findMany();
  const pantryById = new Map(pantryItems.map((p) => [p.id, p]));

  const resolved = new Map<string, GroceryItem>();

  for (const candidate of candidates) {
    let pantryItem = candidate.pantryItemId ? pantryById.get(candidate.pantryItemId) : undefined;

    if (!pantryItem) {
      const lower = candidate.name.toLowerCase();
      pantryItem = pantryItems.find(
        (p) =>
          p.name.toLowerCase() === lower ||
          lower.includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(lower),
      );
    }

    let include: boolean;
    if (pantryItem) {
      include = pantryItem.isStaple ? pantryItem.stapleStatus !== "In stock" : !pantryItem.quantity?.trim();
    } else {
      include = true;
    }
    if (!include) continue;

    const key = pantryItem ? pantryItem.id : candidate.name.toLowerCase();
    if (resolved.has(key)) continue;

    resolved.set(key, {
      id: crypto.randomUUID(),
      name: pantryItem ? pantryItem.name : candidate.name,
      store: pantryItem ? pantryItem.preferredStore : "Other",
      pantryItemId: pantryItem ? pantryItem.id : null,
    });
  }

  return Array.from(resolved.values());
}

/** Merges newly generated items into an existing list without duplicating or resurrecting items already there. */
export function mergeGroceryItems(existing: GroceryItem[], generated: GroceryItem[]): GroceryItem[] {
  const existingKeys = new Set(existing.map((item) => item.pantryItemId ?? item.name.toLowerCase()));
  const additions = generated.filter((item) => !existingKeys.has(item.pantryItemId ?? item.name.toLowerCase()));
  return [...existing, ...additions];
}
