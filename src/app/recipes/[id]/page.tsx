import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RecipeCookingView } from "@/components/RecipeCookingView";

export const dynamic = "force-dynamic";

export default async function RecipeCookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { id }, include: { ingredients: true } });
  if (!recipe) notFound();

  return <RecipeCookingView recipe={recipe} />;
}
