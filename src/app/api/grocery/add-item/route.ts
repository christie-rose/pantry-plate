import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STORES, type Store } from "@/lib/pantry";
import type { GroceryItem } from "@/lib/grocery";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (
    typeof body !== "object" ||
    body === null ||
    typeof body.weekKey !== "string" ||
    typeof body.name !== "string" ||
    !body.name.trim() ||
    typeof body.store !== "string" ||
    !STORES.includes(body.store as Store)
  ) {
    return NextResponse.json({ error: "weekKey, name, and a valid store are required" }, { status: 400 });
  }

  const name = body.name.trim();
  const store = body.store as Store;

  let pantryItem = await prisma.pantryItem.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });

  if (!pantryItem) {
    pantryItem = await prisma.pantryItem.create({
      data: { name, location: "Pantry", preferredStore: store, isStaple: false, quantity: null },
    });
  }

  const newItem: GroceryItem = {
    id: crypto.randomUUID(),
    name: pantryItem.name,
    store,
    pantryItemId: pantryItem.id,
  };

  const existing = await prisma.groceryList.findUnique({ where: { weekKey: body.weekKey } });
  const items = [...((existing?.items as unknown as GroceryItem[]) ?? []), newItem];

  const list = await prisma.groceryList.upsert({
    where: { weekKey: body.weekKey },
    create: { weekKey: body.weekKey, items },
    update: { items },
  });

  return NextResponse.json(list);
}
