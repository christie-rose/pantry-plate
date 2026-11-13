import { prisma } from "@/lib/prisma";
import { formatAmountAsFraction, scaleAmount } from "@/lib/recipes";

export type GroceryItem = {
  id: string;
  name: string;
  note?: string | null;
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
