import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asJson, emptyMenuDoc, isMenuDoc } from "@/lib/menus";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const original = await prisma.menu.findUnique({ where: { id } });
  if (!original)
    return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  const copy = await prisma.menu.create({
    data: {
      title: `${original.title} (copy)`,
      startDate: original.startDate,
      endDate: original.endDate,
      content: asJson(
        isMenuDoc(original.content) ? original.content : emptyMenuDoc(),
      ),
    },
  });
  return NextResponse.json(copy, { status: 201 });
}
