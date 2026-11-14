"use client";

import {
  EmptyState,
  FilterButton,
  FilterChip,
  FilterGroup,
  FilterSheet,
  MasonryGrid,
  PageTitle,
  RecipeImage,
} from "@/ui";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CUISINES, detectProteins, PROTEIN_TYPES, RECIPE_CATEGORIES } from "@/lib/recipes";

type Recipe = {
  id: string;
  title: string;
  servings: number;
  source: string;
  tags: string[];
  categories: string[];
  cuisine: string | null;
  ingredients: { name: string }[];
  image?: { updatedAt: string | Date } | null;
};

export function RecipesClient({ initialRecipes }: { initialRecipes: Recipe[] }) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [proteinFilter, setProteinFilter] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (proteinFilter) params.set("protein", proteinFilter);
    if (cuisineFilter) params.set("cuisine", cuisineFilter);
    return params.toString();
  }, [search, categoryFilter, proteinFilter, cuisineFilter]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/recipes?${queryString}`, { signal: controller.signal })
      .then((res) => res.json())
      .then(setRecipes)
      .catch(() => {});
    return () => controller.abort();
  }, [queryString]);

  const hasActiveFilters = Boolean(search || categoryFilter || proteinFilter || cuisineFilter);

  const filterCount = [proteinFilter, cuisineFilter].filter(Boolean).length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-24">
      <div className="flex items-center justify-between">
        <PageTitle>Recipes</PageTitle>
        <Link href="/recipes/new" className="min-h-[44px] flex items-center rounded-md bg-brick px-4 text-sm font-medium text-white">
          Add recipe
        </Link>
      </div>

      <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-cocoa/20 px-1">
        {(["", ...RECIPE_CATEGORIES] as const).map((c) => (
          <button
            key={c || "all"}
            type="button"
            onClick={() => setCategoryFilter(c)}
            className={`-mb-px shrink-0 whitespace-nowrap rounded-t-md border-b-2 px-3 py-2 text-sm ${
              categoryFilter === c
                ? "border-brick bg-paper-alt font-medium text-brick"
                : "border-transparent text-cocoa hover:text-ink"
            }`}
          >
            {c || "All"}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes…"
          aria-label="Search recipes"
          className="min-h-[44px] min-w-0 flex-1 rounded-md border border-cocoa/40 bg-white px-3 py-2 text-sm text-ink"
        />
        <FilterButton count={filterCount} onClick={() => setFiltersOpen(true)} />
      </div>

      {filtersOpen && (
        <FilterSheet
          onClose={() => setFiltersOpen(false)}
          onClear={() => {
            setProteinFilter("");
            setCuisineFilter("");
          }}
          doneLabel={`Show ${recipes.length} ${recipes.length === 1 ? "recipe" : "recipes"}`}
        >
          <FilterGroup label="Protein">
            {["", ...PROTEIN_TYPES].map((p) => (
              <FilterChip key={p || "all"} selected={proteinFilter === p} onClick={() => setProteinFilter(p)}>
                {p || "All"}
              </FilterChip>
            ))}
          </FilterGroup>
          <FilterGroup label="Cuisine">
            {["", ...CUISINES].map((c) => (
              <FilterChip key={c || "all"} selected={cuisineFilter === c} onClick={() => setCuisineFilter(c)}>
                {c || "All"}
              </FilterChip>
            ))}
          </FilterGroup>
        </FilterSheet>
      )}

      {recipes.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState art="lemon" title="No recipes match">
            Try a different search, or clear the filters.
          </EmptyState>
        ) : (
          <EmptyState art="bowl" title="No recipes yet">
            Add your first one with the button above.
          </EmptyState>
        )
      ) : (
        <MasonryGrid weights={recipes.map((recipe) => (recipe.image ? 3 : 1))}>
          {recipes.map((recipe) => {
            const proteins = detectProteins(recipe.ingredients.map((i) => i.name));
            return (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="card flex flex-col gap-2 p-4">
                {recipe.image && (
                  <RecipeImage
                    size="thumb"
                    alt=""
                    src={`/api/recipes/${recipe.id}/image?v=${new Date(recipe.image.updatedAt).getTime()}`}
                  />
                )}
                <h2 className="font-title text-2xl leading-tight text-ink">{recipe.title}</h2>
                <p className="text-xs text-cocoa">
                  Serves {recipe.servings} · {recipe.source}
                </p>
                {(recipe.categories.length > 0 || recipe.cuisine || proteins.length > 0 || recipe.tags.length > 0) && (
                  <div className="flex flex-wrap gap-1">
                    {recipe.cuisine && (
                      <span className="rounded-full bg-butter/40 px-2 py-0.5 text-xs text-ink">{recipe.cuisine}</span>
                    )}
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
        </MasonryGrid>
      )}
    </div>
  );
}
