"use client";

import { useMemo, useState } from "react";
import { RiCloseLine } from "@remixicon/react";
import { CUISINES, PROTEIN_TYPES, RECIPE_CATEGORIES, detectProteins } from "@/lib/recipes";
import type { PlanRecipeOption } from "@/components/WeekPlanClient";

export function RecipePickerModal({
  recipes,
  onSelect,
  onClose,
}: {
  recipes: PlanRecipeOption[];
  onSelect: (recipe: PlanRecipeOption) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [proteinFilter, setProteinFilter] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");

  const hasActiveFilters = Boolean(search || categoryFilter || proteinFilter || cuisineFilter);

  function clearFilters() {
    setSearch("");
    setCategoryFilter("");
    setProteinFilter("");
    setCuisineFilter("");
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return recipes.filter((recipe) => {
      if (query && !recipe.title.toLowerCase().includes(query)) return false;
      if (categoryFilter && !recipe.categories.includes(categoryFilter)) return false;
      if (cuisineFilter && recipe.cuisine !== cuisineFilter) return false;
      if (proteinFilter) {
        const proteins = detectProteins(recipe.ingredients.map((i) => i.name));
        if (!proteins.includes(proteinFilter as (typeof PROTEIN_TYPES)[number])) return false;
      }
      return true;
    });
  }, [recipes, search, categoryFilter, proteinFilter, cuisineFilter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-md flex-col gap-3 rounded-lg bg-white p-4 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-brick">Choose a recipe</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-md text-cocoa hover:bg-paper-alt">
            <RiCloseLine size={20} aria-hidden />
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes…"
          autoFocus
          className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-3 py-2 text-sm text-ink"
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-h-[36px] rounded-md border border-cocoa/40 bg-white px-2 text-xs text-ink"
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
            className="min-h-[36px] rounded-md border border-cocoa/40 bg-white px-2 text-xs text-ink"
          >
            <option value="">All proteins</option>
            {PROTEIN_TYPES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={cuisineFilter}
            onChange={(e) => setCuisineFilter(e.target.value)}
            className="min-h-[36px] rounded-md border border-cocoa/40 bg-white px-2 text-xs text-ink"
          >
            <option value="">All cuisines</option>
            {CUISINES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-[36px] rounded-md border border-cocoa/40 px-2 text-xs text-cocoa"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto rounded-md border border-cocoa/20">
          {filtered.length === 0 ? (
            <p className="p-3 text-sm text-cocoa">No recipes match.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-cocoa/20">
              {filtered.map((recipe) => (
                <li key={recipe.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(recipe)}
                    className="flex w-full flex-col gap-1 px-3 py-2 text-left hover:bg-paper-alt"
                  >
                    <span className="text-sm text-ink">{recipe.title}</span>
                    {(recipe.cuisine || recipe.categories.length > 0) && (
                      <span className="text-xs text-cocoa">
                        {[recipe.cuisine, ...recipe.categories].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
