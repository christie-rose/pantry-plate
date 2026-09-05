import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeGroceryItemsForWeek, mergeGroceryItems, type GroceryItem } from "@/lib/grocery";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.weekKey !== "string") {
    return NextResponse.json({ error: "weekKey is required" }, { status: 400 });
  }

  const generated = await computeGroceryItemsForWeek(body.weekKey);
  const existing = await prisma.groceryList.findUnique({ where: { weekKey: body.weekKey } });
  const items = mergeGroceryItems((existing?.items as unknown as GroceryItem[]) ?? [], generated);

  const list = await prisma.groceryList.upsert({
    where: { weekKey: body.weekKey },
    create: { weekKey: body.weekKey, items },
    update: { items },
  });

  return NextResponse.json(list);
}
