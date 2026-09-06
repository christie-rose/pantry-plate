import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { matchIngredientToPantry, validateRecipeInput } from "@/lib/recipes";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { ingredients: true },
  });
  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  return NextResponse.json(recipe);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const result = validateRecipeInput(body);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const existing = await prisma.recipe.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  // Replace ingredients wholesale: simpler and safer than diffing, and re-runs pantry matching.
  await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });

  const recipe = await prisma.recipe.update({
    where: { id },
    data: {
      title: result.title,
      tags: result.tags,
      categories: result.categories,
      servings: result.servings,
      instructions: result.instructions,
      prepAhead: result.prepAhead,
      notes: result.notes,
      sourceUrl: result.sourceUrl,
      ingredients: {
        create: await Promise.all(
          result.ingredients.map(async (ingredient) => {
            const match = await matchIngredientToPantry(ingredient.name);
            return {
              name: ingredient.name,
              amount: ingredient.amount,
              unit: ingredient.unit,
              pantryItemId: match?.id ?? null,
              reviewed: Boolean(match),
            };
          }),
        ),
      },
    },
    include: { ingredients: true },
  });

  return NextResponse.json(recipe);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.recipe.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
