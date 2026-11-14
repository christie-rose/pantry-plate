import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RecipeEditClient } from "@/components/RecipeEditClient";

export default async function EditRecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aiEdit?: string }>;
}) {
  const { id } = await params;
  const { aiEdit } = await searchParams;
  const recipe = await prisma.recipe.findUnique({ where: { id }, include: { ingredients: true } });
  if (!recipe) notFound();

  return <RecipeEditClient recipe={recipe} initialAiInstruction={aiEdit?.slice(0, 500) ?? ""} />;
}
