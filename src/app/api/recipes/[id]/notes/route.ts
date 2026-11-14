import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Adds one note to the end of a recipe's notes. Used when the cook accepts a suggestion after cooking. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 1000) : "";
  if (!text) return NextResponse.json({ error: "Write a note first." }, { status: 400 });

  const recipe = await prisma.recipe.findUnique({ where: { id }, select: { notes: true } });
  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  const notes = recipe.notes ? `${recipe.notes}\n${text}` : text;
  await prisma.recipe.update({ where: { id }, data: { notes } });
  return NextResponse.json({ notes });
}
