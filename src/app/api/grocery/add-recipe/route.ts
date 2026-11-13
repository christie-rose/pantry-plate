import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GROCERY_LIST_KEY, addRecipeToGroceryList, loadGroceryItems } from "@/lib/grocery";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.recipeId !== "string") {
    return NextResponse.json({ error: "recipeId is required" }, { status: 400 });
  }

  const targetServings = typeof body.servings === "number" && body.servings > 0 ? body.servings : undefined;

  const existing = await loadGroceryItems();
  const result = await addRecipeToGroceryList(body.recipeId, existing, targetServings);

  const list = await prisma.groceryList.upsert({
    where: { weekKey: GROCERY_LIST_KEY },
    create: { weekKey: GROCERY_LIST_KEY, items: result.items },
    update: { items: result.items },
  });

  return NextResponse.json({ list, added: result.added });
}
