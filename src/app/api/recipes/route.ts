import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectProteins, validateRecipeInput, PROTEIN_TYPES, type ProteinType } from "@/lib/recipes";
import type { Prisma } from "@prisma/client";
import { generateImageForRecipe } from "@/lib/recipe-image";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search")?.trim() ?? "";
  const category = searchParams.get("category");
  // Protein and cuisine accept several values, comma separated; a recipe matches if it has any of them.
  const proteins = (searchParams.get("protein") ?? "").split(",").filter((p): p is ProteinType => PROTEIN_TYPES.includes(p as ProteinType));
  const cuisines = (searchParams.get("cuisine") ?? "").split(",").filter(Boolean);

  const where: Prisma.RecipeWhereInput = {};
  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }
  if (category) {
    where.categories = { has: category };
  }
  if (cuisines.length > 0) {
    where.cuisine = { in: cuisines };
  }

  const recipes = await prisma.recipe.findMany({
    where,
    include: { ingredients: true, image: { select: { updatedAt: true } } },
    orderBy: { title: "asc" },
  });

  const filtered =
    proteins.length > 0
      ? recipes.filter((r) => {
          const found = detectProteins(r.ingredients.map((i) => i.name));
          return proteins.some((p) => found.includes(p));
        })
      : recipes;

  return NextResponse.json(filtered);
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
      cuisine: result.cuisine,
      servings: result.servings,
      instructions: result.instructions,
      prepAhead: result.prepAhead,
      notes: result.notes,
      source: result.source,
      sourceUrl: result.sourceUrl,
      ingredients: {
        create: result.ingredients.map((ingredient) => ({
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
        })),
      },
    },
    include: { ingredients: true },
  });

  // A recipe written by AI gets a photo made for it automatically, in the background.
  if (recipe.source === "ai" && process.env.OPENAI_API_KEY) {
    void generateImageForRecipe(recipe.id).catch(() => {});
  }

  return NextResponse.json(recipe, { status: 201 });
}
