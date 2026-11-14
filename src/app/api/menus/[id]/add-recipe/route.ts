import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asJson, emptyMenuDoc, isMenuDoc, type MenuDoc } from "@/lib/menus";

/** Appends a recipe block to the end of a menu (used by "Add to a menu" on recipes). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.recipeId !== "string") {
    return NextResponse.json({ error: "recipeId is required" }, { status: 400 });
  }
  const [menu, recipe] = await Promise.all([
    prisma.menu.findUnique({ where: { id } }),
    prisma.recipe.findUnique({ where: { id: body.recipeId }, select: { id: true, title: true, servings: true } }),
  ]);
  if (!menu) return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  const doc: MenuDoc = isMenuDoc(menu.content) ? menu.content : emptyMenuDoc();
  const content = [...(doc.content ?? [])];
  // Replace a lone empty paragraph so the recipe doesn't sit under a blank line.
  const last = content[content.length - 1];
  if (content.length === 1 && last?.type === "paragraph" && !last.content?.length) content.pop();
  content.push({
    type: "recipe",
    attrs: { recipeId: recipe.id, title: recipe.title, servings: recipe.servings },
  });
  content.push({ type: "paragraph" });

  const updated = await prisma.menu.update({ where: { id }, data: { content: asJson({ type: "doc", content }) } });
  return NextResponse.json(updated);
}
