import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RecipeEditClient } from "@/components/RecipeEditClient";

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { id }, include: { ingredients: true } });
  if (!recipe) notFound();

  const pantryItems = await prisma.pantryItem.findMany({ orderBy: { name: "asc" } });

  return <RecipeEditClient recipe={recipe} pantryItems={pantryItems} />;
}
