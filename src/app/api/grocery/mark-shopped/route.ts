import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { restockPantryItem, type GroceryItem } from "@/lib/grocery";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.weekKey !== "string" || typeof body.itemId !== "string") {
    return NextResponse.json({ error: "weekKey and itemId are required" }, { status: 400 });
  }

  const existing = await prisma.groceryList.findUnique({ where: { weekKey: body.weekKey } });
  const items = (existing?.items as unknown as GroceryItem[]) ?? [];
  const item = items.find((i) => i.id === body.itemId);

  if (item?.pantryItemId) {
    await restockPantryItem(item.pantryItemId);
  }

  const remaining = items.filter((i) => i.id !== body.itemId);
  const list = await prisma.groceryList.upsert({
    where: { weekKey: body.weekKey },
    create: { weekKey: body.weekKey, items: remaining },
    update: { items: remaining },
  });

  return NextResponse.json(list);
}
