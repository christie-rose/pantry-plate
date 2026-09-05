import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePantryItemInput } from "@/lib/pantry";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search")?.trim() ?? "";
  const location = searchParams.get("location");
  const store = searchParams.get("store");
  const stapleStatus = searchParams.get("stapleStatus");
  const sort = searchParams.get("sort") ?? "name";

  const where: Prisma.PantryItemWhereInput = {};

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (location) {
    where.location = location;
  }
  if (store) {
    where.preferredStore = store;
  }
  if (stapleStatus) {
    where.isStaple = true;
    where.stapleStatus = stapleStatus;
  }

  const orderBy: Prisma.PantryItemOrderByWithRelationInput =
    sort === "updatedAt" ? { updatedAt: "desc" } : { name: "asc" };

  const items = await prisma.pantryItem.findMany({ where, orderBy });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = validatePantryItemInput(body);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const item = await prisma.pantryItem.create({ data: result });
  return NextResponse.json(item, { status: 201 });
}
