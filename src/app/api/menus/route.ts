import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asJson, emptyMenuDoc, parseDay, recipeBlocksIn } from "@/lib/menus";

export async function GET() {
  const menus = await prisma.menu.findMany({
    orderBy: [{ startDate: "desc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json(
    menus.map((m) => ({
      id: m.id,
      title: m.title,
      startDate: m.startDate,
      endDate: m.endDate,
      updatedAt: m.updatedAt,
      recipeCount: recipeBlocksIn(m.content).length,
    })),
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const startDate = parseDay(body?.startDate) ?? null;
  const parsedEnd = parseDay(body?.endDate) ?? null;
  const endDate =
    startDate && parsedEnd && parsedEnd >= startDate ? parsedEnd : null;
  const menu = await prisma.menu.create({
    data: {
      title: title || "Untitled menu",
      startDate,
      endDate,
      content: asJson(emptyMenuDoc()),
    },
  });
  return NextResponse.json(menu, { status: 201 });
}
