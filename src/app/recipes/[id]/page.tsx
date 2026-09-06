import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RecipeCookingView } from "@/components/RecipeCookingView";
import { scaleAmount } from "@/lib/recipes";

export const dynamic = "force-dynamic";

export default async function RecipeCookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ servings?: string }>;
}) {
  const { id } = await params;
  const { servings: servingsParam } = await searchParams;
  const recipe = await prisma.recipe.findUnique({ where: { id }, include: { ingredients: true } });
  if (!recipe) notFound();

  const targetServings = servingsParam ? Number(servingsParam) : null;
  const scaled =
    targetServings && targetServings > 0 && targetServings !== recipe.servings
      ? {
          ...recipe,
          servings: targetServings,
          ingredients: recipe.ingredients.map((ingredient) => ({
            ...ingredient,
            amount: ingredient.amount != null ? scaleAmount(ingredient.amount, targetServings / recipe.servings) : ingredient.amount,
          })),
        }
      : recipe;

  return <RecipeCookingView recipe={scaled} originalServings={scaled === recipe ? undefined : recipe.servings} />;
}
