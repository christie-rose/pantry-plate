import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { matchIngredientToPantry, validateRecipeInput } from "@/lib/recipes";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search")?.trim() ?? "";
  const category = searchParams.get("category");

  const where: Prisma.RecipeWhereInput = {};
  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }
  if (category) {
    where.categories = { has: category };
  }

  const recipes = await prisma.recipe.findMany({
    where,
    include: { ingredients: true },
    orderBy: { title: "asc" },
  });
  return NextResponse.json(recipes);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = validateRecipeInput(body);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const recipe = await prisma.recipe.create({
    data: {
      title: result.title,
      tags: result.tags,
      categories: result.categories,
      servings: result.servings,
      instructions: result.instructions,
      prepAhead: result.prepAhead,
      notes: result.notes,
      source: result.source,
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

  return NextResponse.json(recipe, { status: 201 });
}
