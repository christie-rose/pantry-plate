import { prisma } from "@/lib/prisma";
import { scaleAmount } from "@/lib/recipes";

export type GroceryItem = {
  id: string;
  name: string;
  store: string;
  pantryItemId: string | null;
  note?: string | null;
};

function formatQuantity(amount: number | null, unit: string | null): string | null {
  if (amount == null) return null;
  return [amount, unit].filter(Boolean).join(" ");
}

export type AddRecipeToGroceryResult = {
  items: GroceryItem[];
  claimedPantryItemIds: string[];
  added: string[];
  skippedStaples: string[];
  skippedOnHand: string[];
};

/**
 * Works out which of a recipe's ingredients belong on the grocery list, given what's already
 * there and which non-staple pantry items other recipes added to this same list have already
 * claimed as "using up what's on hand":
 * - Staple pantry items are never added (their stock is managed separately).
 * - A non-staple pantry item with any quantity on hand is skipped the first time it's needed —
 *   but that on-hand stock is then "claimed" for this list, so a later recipe needing the same
 *   item will add it (the earlier recipe is assumed to have used up what was on hand).
 * - A non-staple item with nothing on hand, or anything with no pantry match at all, is added.
 */
export async function addRecipeToGroceryList(
  recipeId: string,
  existingItems: GroceryItem[],
  claimedPantryItemIds: string[],
  targetServings?: number,
): Promise<AddRecipeToGroceryResult> {
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, include: { ingredients: true } });
  if (!recipe) {
    return { items: existingItems, claimedPantryItemIds, added: [], skippedStaples: [], skippedOnHand: [] };
  }

  const ratio = targetServings && recipe.servings ? targetServings / recipe.servings : 1;

  const pantryItems = await prisma.pantryItem.findMany();
  const pantryById = new Map(pantryItems.map((p) => [p.id, p]));

  const items = [...existingItems];
  const claimed = new Set(claimedPantryItemIds);
  const added: string[] = [];
  const skippedStaples: string[] = [];
  const skippedOnHand: string[] = [];

  for (const ingredient of recipe.ingredients) {
    let pantryItem = ingredient.pantryItemId ? pantryById.get(ingredient.pantryItemId) : undefined;
    if (!pantryItem) {
      const lower = ingredient.name.toLowerCase();
      pantryItem = pantryItems.find(
        (p) =>
          p.name.toLowerCase() === lower ||
          lower.includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(lower),
      );
    }

    if (pantryItem?.isStaple) {
      skippedStaples.push(pantryItem.name);
      continue;
    }

    if (pantryItem) {
      const hasOnHand = Boolean(pantryItem.quantity?.trim());
      if (hasOnHand && !claimed.has(pantryItem.id)) {
        claimed.add(pantryItem.id);
        skippedOnHand.push(pantryItem.name);
        continue;
      }
    }

    const key = pantryItem ? pantryItem.id : ingredient.name.toLowerCase();
    const alreadyOnList = items.some((i) => (pantryItem ? i.pantryItemId === pantryItem.id : i.name.toLowerCase() === key));
    if (alreadyOnList) continue;

    const scaledAmount = ingredient.amount != null ? scaleAmount(ingredient.amount, ratio) : null;

    items.push({
      id: crypto.randomUUID(),
      name: pantryItem ? pantryItem.name : ingredient.name,
      store: pantryItem ? pantryItem.preferredStore : "Other",
      pantryItemId: pantryItem ? pantryItem.id : null,
      note: formatQuantity(scaledAmount, ingredient.unit),
    });
    added.push(pantryItem ? pantryItem.name : ingredient.name);
  }

  return { items, claimedPantryItemIds: Array.from(claimed), added, skippedStaples, skippedOnHand };
}

/**
 * Restocks a pantry item once its grocery entry is marked shopped: staples go back to "In stock",
 * and non-staples get a quantity so they read as on hand again (we don't track a purchased amount,
 * so this is a generic marker rather than a specific number).
 */
export async function restockPantryItem(pantryItemId: string): Promise<void> {
  const pantryItem = await prisma.pantryItem.findUnique({ where: { id: pantryItemId } });
  if (!pantryItem) return;

  if (pantryItem.isStaple) {
    await prisma.pantryItem.update({ where: { id: pantryItemId }, data: { stapleStatus: "In stock" } });
  } else {
    await prisma.pantryItem.update({ where: { id: pantryItemId }, data: { quantity: "In stock" } });
  }
}

/** Merges newly generated items into an existing list without duplicating or resurrecting items already there. */
export function mergeGroceryItems(existing: GroceryItem[], generated: GroceryItem[]): GroceryItem[] {
  const existingKeys = new Set(existing.map((item) => item.pantryItemId ?? item.name.toLowerCase()));
  const additions = generated.filter((item) => !existingKeys.has(item.pantryItemId ?? item.name.toLowerCase()));
  return [...existing, ...additions];
}
