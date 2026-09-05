import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({ orderBy: { title: "asc" } });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-brick">Recipes</h1>
        <Link href="/recipes/new" className="rounded-md bg-brick px-4 py-2 text-sm font-medium text-white">
          Add recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <p className="text-sm text-cocoa">No recipes yet — add your first one.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <Link key={recipe.id} href={`/recipes/${recipe.id}/edit`} className="card flex flex-col gap-2 p-4">
              <h2 className="text-xl text-ink">{recipe.title}</h2>
              <p className="text-xs text-cocoa">
                Serves {recipe.servings} · {recipe.source}
              </p>
              {recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {recipe.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-paper-alt px-2 py-0.5 text-xs text-cocoa">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
