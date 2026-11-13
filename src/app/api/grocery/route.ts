import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GROCERY_LIST_KEY, loadGroceryItems } from "@/lib/grocery";

export async function GET() {
  const items = await loadGroceryItems();
  return NextResponse.json({ items });
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (typeof body !== "object" || body === null || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Invalid grocery list payload" }, { status: 400 });
  }

  const list = await prisma.groceryList.upsert({
    where: { weekKey: GROCERY_LIST_KEY },
    create: { weekKey: GROCERY_LIST_KEY, items: body.items },
    update: { items: body.items },
  });

  return NextResponse.json(list);
}
