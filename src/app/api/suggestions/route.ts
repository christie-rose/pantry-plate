import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.suggestion.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });
  // The page picks the id so a new line can show up instantly and still match what's saved.
  const id = typeof body?.id === "string" && /^[\w-]{8,64}$/.test(body.id) ? body.id : undefined;
  const item = await prisma.suggestion.create({ data: { id, text } });
  return NextResponse.json(item, { status: 201 });
}

/** Deletes every checked suggestion in one go. */
export async function DELETE() {
  const { count } = await prisma.suggestion.deleteMany({ where: { done: true } });
  return NextResponse.json({ deleted: count });
}
