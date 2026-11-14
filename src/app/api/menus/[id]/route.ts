import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asJson, isMenuDoc } from "@/lib/menus";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const menu = await prisma.menu.findUnique({ where: { id } });
  if (!menu) return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  return NextResponse.json(menu);
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid menu" }, { status: 400 });

  const data: { title?: string; date?: Date | null; content?: ReturnType<typeof asJson> } = {};
  if (typeof body.title === "string") data.title = body.title.trim() || "Untitled menu";
  if ("date" in body) {
    if (!body.date) data.date = null;
    else if (typeof body.date === "string") {
      const d = new Date(`${body.date}T00:00:00.000Z`);
      if (isNaN(d.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      data.date = d;
    }
  }
  if ("content" in body) {
    if (!isMenuDoc(body.content)) return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    data.content = asJson(body.content);
  }

  const existing = await prisma.menu.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  const menu = await prisma.menu.update({ where: { id }, data });
  return NextResponse.json(menu);
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  await prisma.menu.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
