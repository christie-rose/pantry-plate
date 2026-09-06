import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addRecipeToGroceryList, type GroceryItem } from "@/lib/grocery";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.weekKey !== "string" || typeof body.recipeId !== "string") {
    return NextResponse.json({ error: "weekKey and recipeId are required" }, { status: 400 });
  }

  const existing = await prisma.groceryList.findUnique({ where: { weekKey: body.weekKey } });
  const result = await addRecipeToGroceryList(
    body.recipeId,
    (existing?.items as unknown as GroceryItem[]) ?? [],
    existing?.claimedPantryItemIds ?? [],
  );

  const list = await prisma.groceryList.upsert({
    where: { weekKey: body.weekKey },
    create: { weekKey: body.weekKey, items: result.items, claimedPantryItemIds: result.claimedPantryItemIds },
    update: { items: result.items, claimedPantryItemIds: result.claimedPantryItemIds },
  });

  return NextResponse.json({
    list,
    added: result.added,
    skippedStaples: result.skippedStaples,
    skippedOnHand: result.skippedOnHand,
  });
}
