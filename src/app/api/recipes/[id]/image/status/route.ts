import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isGenerating, takeLastError } from "@/lib/recipe-image";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await prisma.recipeImage.findUnique({ where: { recipeId: id }, select: { updatedAt: true, source: true } });
  const generating = isGenerating(id);
  return NextResponse.json({
    version: image ? image.updatedAt.getTime() : null,
    source: image?.source ?? null,
    generating,
    error: generating ? null : takeLastError(id),
  });
}
