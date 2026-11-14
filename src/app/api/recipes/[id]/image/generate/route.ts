import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateImageForRecipe, isGenerating } from "@/lib/recipe-image";

/** Starts making a photo in the background and returns right away; the page polls /image/status. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { id }, select: { id: true } });
  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI photos are not set up yet. The server needs an OPENAI_API_KEY." }, { status: 503 });
  }
  if (!isGenerating(id)) {
    void generateImageForRecipe(id).catch(() => {});
  }
  return NextResponse.json({ started: true }, { status: 202 });
}
