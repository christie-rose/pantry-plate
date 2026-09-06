"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { detectProteins, PROTEIN_TYPES, RECIPE_CATEGORIES } from "@/lib/recipes";

type Recipe = {
  id: string;
  title: string;
  servings: number;
  source: string;
  tags: string[];
  categories: string[];
  ingredients: { name: string }[];
};

export function RecipesClient({ initialRecipes }: { initialRecipes: Recipe[] }) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [proteinFilter, setProteinFilter] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (proteinFilter) params.set("protein", proteinFilter);
    return params.toString();
  }, [search, categoryFilter, proteinFilter]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/recipes?${queryString}`, { signal: controller.signal })
      .then((res) => res.json())
      .then(setRecipes)
      .catch(() => {});
    return () => controller.abort();
  }, [queryString]);

  const hasActiveFilters = Boolean(search || categoryFilter || proteinFilter);

  function clearFilters() {
    setSearch("");
    setCategoryFilter("");
    setProteinFilter("");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-brick">Recipes</h1>
        <Link href="/recipes/new" className="min-h-[44px] flex items-center rounded-md bg-brick px-4 text-sm font-medium text-white">
          Add recipe
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes…"
          className="min-h-[44px] flex-1 min-w-[140px] rounded-md border border-cocoa/40 bg-white px-3 py-2 text-sm text-ink"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-2 py-2 text-sm text-ink"
        >
          <option value="">All categories</option>
          {RECIPE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={proteinFilter}
          onChange={(e) => setProteinFilter(e.target.value)}
          className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-2 py-2 text-sm text-ink"
        >
          <option value="">All proteins</option>
          {PROTEIN_TYPES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-[44px] rounded-md border border-cocoa/40 px-3 text-sm text-cocoa"
          >
            Clear filters
          </button>
        )}
      </div>

      {recipes.length === 0 ? (
        <p className="text-sm text-cocoa">
          {hasActiveFilters ? "No recipes match." : "No recipes yet — add your first one."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {recipes.map((recipe) => {
            const proteins = detectProteins(recipe.ingredients.map((i) => i.name));
            return (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="card flex flex-col gap-2 p-4">
                <h2 className="text-xl text-ink">{recipe.title}</h2>
                <p className="text-xs text-cocoa">
                  Serves {recipe.servings} · {recipe.source}
                </p>
                {(recipe.categories.length > 0 || proteins.length > 0 || recipe.tags.length > 0) && (
                  <div className="flex flex-wrap gap-1">
                    {recipe.categories.map((category) => (
                      <span key={category} className="rounded-full bg-sage/20 px-2 py-0.5 text-xs text-ink">
                        {category}
                      </span>
                    ))}
                    {proteins.map((protein) => (
                      <span key={protein} className="rounded-full bg-brick/10 px-2 py-0.5 text-xs text-brick">
                        {protein}
                      </span>
                    ))}
                    {recipe.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-paper-alt px-2 py-0.5 text-xs text-cocoa">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
