import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const weekKey = request.nextUrl.searchParams.get("weekKey");
  if (!weekKey) {
    return NextResponse.json({ error: "weekKey is required" }, { status: 400 });
  }

  const list = await prisma.groceryList.findUnique({ where: { weekKey } });
  return NextResponse.json(list ?? { weekKey, items: [] });
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (typeof body !== "object" || body === null || typeof body.weekKey !== "string" || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Invalid grocery list payload" }, { status: 400 });
  }

  const list = await prisma.groceryList.upsert({
    where: { weekKey: body.weekKey },
    create: { weekKey: body.weekKey, items: body.items },
    update: { items: body.items },
  });

  return NextResponse.json(list);
}
