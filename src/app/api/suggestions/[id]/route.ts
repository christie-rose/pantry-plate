import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const data: { text?: string; done?: boolean } = {};
  if (typeof body?.text === "string") {
    const text = body.text.trim();
    if (!text) return NextResponse.json({ error: "text can't be empty" }, { status: 400 });
    data.text = text;
  }
  if (typeof body?.done === "boolean") data.done = body.done;
  const item = await prisma.suggestion.update({ where: { id }, data }).catch(() => null);
  if (!item) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  await prisma.suggestion.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
