import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_UPLOAD_BYTES, saveRecipeImage } from "@/lib/recipe-image";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await prisma.recipeImage.findUnique({ where: { recipeId: id } });
  if (!image) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      // The page adds ?v=<updatedAt>, so a changed image gets a new address.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

/** Upload or replace: multipart form with a "file" field. */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { id }, select: { id: true } });
  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a picture to upload." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "That picture is too large. Use one under 12 MB." }, { status: 413 });
  }

  try {
    await saveRecipeImage(id, Buffer.from(await file.arrayBuffer()), "upload");
  } catch {
    return NextResponse.json({ error: "That file does not look like a picture we can use. Try a JPG or PNG." }, { status: 415 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.recipeImage.deleteMany({ where: { recipeId: id } });
  return NextResponse.json({ ok: true });
}
