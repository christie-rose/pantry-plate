import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asJson, emptyMenuDoc, recipeBlocksIn } from "@/lib/menus";

export async function GET() {
  const menus = await prisma.menu.findMany({ orderBy: [{ date: "desc" }, { updatedAt: "desc" }] });
  return NextResponse.json(
    menus.map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date,
      updatedAt: m.updatedAt,
      recipeCount: recipeBlocksIn(m.content).length,
    })),
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const date = typeof body?.date === "string" && body.date ? new Date(`${body.date}T00:00:00.000Z`) : null;
  const menu = await prisma.menu.create({
    data: { title: title || "Untitled menu", date: date && !isNaN(date.getTime()) ? date : null, content: asJson(emptyMenuDoc()) },
  });
  return NextResponse.json(menu, { status: 201 });
}
