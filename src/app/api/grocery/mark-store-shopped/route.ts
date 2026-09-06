import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { restockPantryItem, type GroceryItem } from "@/lib/grocery";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.weekKey !== "string" || typeof body.store !== "string") {
    return NextResponse.json({ error: "weekKey and store are required" }, { status: 400 });
  }

  const existing = await prisma.groceryList.findUnique({ where: { weekKey: body.weekKey } });
  const items = (existing?.items as unknown as GroceryItem[]) ?? [];
  const shopped = items.filter((i) => i.store === body.store);

  await Promise.all(shopped.filter((i) => i.pantryItemId).map((i) => restockPantryItem(i.pantryItemId as string)));

  const remaining = items.filter((i) => i.store !== body.store);
  const list = await prisma.groceryList.upsert({
    where: { weekKey: body.weekKey },
    create: { weekKey: body.weekKey, items: remaining },
    update: { items: remaining },
  });

  return NextResponse.json(list);
}
