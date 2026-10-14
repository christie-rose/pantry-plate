import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const original = await prisma.recipe.findUnique({ where: { id }, include: { ingredients: true } });
  if (!original) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  const copy = await prisma.recipe.create({
    data: {
      title: `${original.title} (copy)`,
      tags: original.tags,
      categories: original.categories,
      cuisine: original.cuisine,
      servings: original.servings,
      instructions: original.instructions,
      prepAhead: original.prepAhead,
      notes: original.notes,
      source: original.source,
      sourceUrl: original.sourceUrl,
      ingredients: {
        create: original.ingredients.map((i) => ({
          name: i.name,
          amount: i.amount,
          unit: i.unit,
          pantryItemId: i.pantryItemId,
          reviewed: i.reviewed,
        })),
      },
    },
  });

  return NextResponse.json({ id: copy.id }, { status: 201 });
}
