import { prisma } from "@/lib/prisma";
import { formatAmountAsFraction, scaleAmount } from "@/lib/recipes";

/** There is a single grocery list for all time; it lives in the GroceryList row with this key. */
export const GROCERY_LIST_KEY = "main";

export type GroceryItem = {
  id: string;
  name: string;
  note?: string | null;
  checked?: boolean;
  /** Free-form label, e.g. a store name. Created on the fly. */
  tag?: string | null;
};

function formatQuantity(amount: number | null, unit: string | null): string | null {
  if (amount == null) return null;
  return [formatAmountAsFraction(amount), unit].filter(Boolean).join(" ");
}

export type AddRecipeToGroceryResult = {
  items: GroceryItem[];
  added: string[];
};

/**
 * Adds every ingredient of a recipe to the grocery list (scaled to `targetServings` when given),
 * skipping any ingredient whose name is already on the list.
 */
export async function addRecipeToGroceryList(
  recipeId: string,
  existingItems: GroceryItem[],
  targetServings?: number,
): Promise<AddRecipeToGroceryResult> {
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, include: { ingredients: true } });
  if (!recipe) return { items: existingItems, added: [] };

  const ratio = targetServings && recipe.servings ? targetServings / recipe.servings : 1;
  const items = [...existingItems];
  const added: string[] = [];

  for (const ingredient of recipe.ingredients) {
    const alreadyOnList = items.some((i) => i.name.toLowerCase() === ingredient.name.toLowerCase());
    if (alreadyOnList) continue;

    const scaledAmount = ingredient.amount != null ? scaleAmount(ingredient.amount, ratio) : null;
    items.push({
      id: crypto.randomUUID(),
      name: ingredient.name,
      note: formatQuantity(scaledAmount, ingredient.unit),
    });
    added.push(ingredient.name);
  }

  return { items, added };
}

/**
 * Returns the items on the one grocery list. The first time it's needed, the list is created by
 * merging every older per-week list (de-duplicated by name), so nothing from before is lost.
 */
export async function loadGroceryItems(): Promise<GroceryItem[]> {
  const main = await prisma.groceryList.findUnique({ where: { weekKey: GROCERY_LIST_KEY } });
  if (main) return (main.items as unknown as GroceryItem[]) ?? [];

  const older = await prisma.groceryList.findMany({ orderBy: { weekKey: "asc" } });
  const merged: GroceryItem[] = [];
  const byName = new Map<string, GroceryItem>();
  for (const list of older) {
    for (const item of (list.items as unknown as GroceryItem[]) ?? []) {
      const key = item.name.trim().toLowerCase();
      const existing = byName.get(key);
      if (existing) {
        // Keep the first copy, but don't lose a tag the later copy had.
        if (!existing.tag && item.tag) existing.tag = item.tag;
        continue;
      }
      const copy = { ...item };
      byName.set(key, copy);
      merged.push(copy);
    }
  }

  const created = await prisma.groceryList.upsert({
    where: { weekKey: GROCERY_LIST_KEY },
    create: { weekKey: GROCERY_LIST_KEY, items: merged as unknown as object[] },
    update: {},
  });
  return (created.items as unknown as GroceryItem[]) ?? [];
}
