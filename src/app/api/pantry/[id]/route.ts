import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePantryItemInput } from "@/lib/pantry";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const result = validatePantryItemInput(body);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const item = await prisma.pantryItem
    .update({ where: { id }, data: result })
    .catch(() => null);

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  await prisma.pantryItem.delete({ where: { id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}
