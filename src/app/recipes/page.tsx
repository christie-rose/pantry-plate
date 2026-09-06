import { prisma } from "@/lib/prisma";
import { RecipesClient } from "@/components/RecipesClient";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({ orderBy: { title: "asc" } });

  return <RecipesClient initialRecipes={recipes} />;
}
