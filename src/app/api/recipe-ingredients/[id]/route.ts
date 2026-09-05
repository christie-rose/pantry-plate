import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (typeof body !== "object" || body === null || typeof body.pantryItemId !== "string") {
    return NextResponse.json({ error: "pantryItemId is required" }, { status: 400 });
  }

  const ingredient = await prisma.recipeIngredient
    .update({
      where: { id },
      data: { pantryItemId: body.pantryItemId, reviewed: true },
    })
    .catch(() => null);

  if (!ingredient) {
    return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
  }

  return NextResponse.json(ingredient);
}
