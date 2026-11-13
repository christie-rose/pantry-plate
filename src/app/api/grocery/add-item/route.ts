import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { GroceryItem } from "@/lib/grocery";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (
    typeof body !== "object" ||
    body === null ||
    typeof body.weekKey !== "string" ||
    typeof body.name !== "string" ||
    !body.name.trim()
  ) {
    return NextResponse.json({ error: "weekKey and name are required" }, { status: 400 });
  }

  const newItem: GroceryItem = { id: crypto.randomUUID(), name: body.name.trim() };

  const existing = await prisma.groceryList.findUnique({ where: { weekKey: body.weekKey } });
  const items = [...((existing?.items as unknown as GroceryItem[]) ?? []), newItem];

  const list = await prisma.groceryList.upsert({
    where: { weekKey: body.weekKey },
    create: { weekKey: body.weekKey, items },
    update: { items },
  });

  return NextResponse.json(list);
}
