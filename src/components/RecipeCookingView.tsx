"use client";

import { useState } from "react";
import Link from "next/link";
import { RiCheckLine, RiCalendarLine } from "@remixicon/react";

type Ingredient = {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
};

type Recipe = {
  id: string;
  title: string;
  tags: string[];
  categories: string[];
  servings: number;
  notes: string | null;
  instructions: string[];
  prepAhead: string[];
  source: string;
  sourceUrl: string | null;
  ingredients: Ingredient[];
};

function formatAmount(ingredient: Ingredient): string {
  const parts = [ingredient.amount != null ? String(ingredient.amount) : null, ingredient.unit].filter(Boolean);
  return parts.join(" ");
}

export function RecipeCookingView({ recipe }: { recipe: Recipe }) {
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [checkedPrepSteps, setCheckedPrepSteps] = useState<Set<number>>(new Set());

  function toggleIngredient(id: string) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleStep(index: number) {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function togglePrepStep(index: number) {
    setCheckedPrepSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 pb-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/recipes" className="text-sm text-cocoa underline">
            ‹ Recipes
          </Link>
          <h1 className="text-3xl text-brick">{recipe.title}</h1>
          <p className="text-sm text-cocoa">
            Serves {recipe.servings}
            {recipe.categories.length > 0 ? ` · ${recipe.categories.join(", ")}` : ""}
            {recipe.tags.length > 0 ? ` · ${recipe.tags.join(", ")}` : ""}
          </p>
        </div>
        <Link
          href={`/recipes/${recipe.id}/edit`}
          className="min-h-[44px] shrink-0 rounded-md border border-cocoa/40 px-4 py-2 text-sm font-medium text-ink"
        >
          Edit
        </Link>
      </div>

      <div className="card flex flex-col gap-2 p-4">
        <h2 className="text-xl text-ink">Ingredients</h2>
        <ul className="flex flex-col divide-y divide-cocoa/20">
          {recipe.ingredients.map((ingredient) => {
            const checked = checkedIngredients.has(ingredient.id);
            return (
              <li key={ingredient.id}>
                <button
                  type="button"
                  onClick={() => toggleIngredient(ingredient.id)}
                  className="flex min-h-[44px] w-full items-center gap-3 py-2 text-left"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      checked ? "border-sage bg-sage text-white" : "border-cocoa/40"
                    }`}
                    aria-hidden
                  >
                    {checked && <RiCheckLine size={16} aria-hidden />}
                  </span>
                  <span className={`text-base ${checked ? "text-cocoa line-through" : "text-ink"}`}>
                    {formatAmount(ingredient) && (
                      <span className="font-medium">{formatAmount(ingredient)} </span>
                    )}
                    {ingredient.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {recipe.prepAhead.length > 0 && (
        <div className="card flex flex-col gap-2 p-4">
          <h2 className="flex items-center gap-2 text-xl text-ink">
            <RiCalendarLine size={18} className="text-sage" aria-hidden />
            Prep ahead
          </h2>
          <ol className="flex flex-col divide-y divide-cocoa/20">
            {recipe.prepAhead.map((step, index) => {
              const checked = checkedPrepSteps.has(index);
              return (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => togglePrepStep(index)}
                    className="flex w-full items-start gap-3 py-3 text-left"
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium ${
                        checked ? "border-sage bg-sage text-white" : "border-cocoa/40 text-cocoa"
                      }`}
                      aria-hidden
                    >
                      {checked ? <RiCheckLine size={16} aria-hidden /> : index + 1}
                    </span>
                    <span className={`text-base leading-relaxed ${checked ? "text-cocoa line-through" : "text-ink"}`}>
                      {step}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="card flex flex-col gap-2 p-4">
        <h2 className="text-xl text-ink">Instructions</h2>
        <ol className="flex flex-col divide-y divide-cocoa/20">
          {recipe.instructions.map((step, index) => {
            const checked = checkedSteps.has(index);
            return (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => toggleStep(index)}
                  className="flex w-full items-start gap-3 py-3 text-left"
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium ${
                      checked ? "border-sage bg-sage text-white" : "border-cocoa/40 text-cocoa"
                    }`}
                    aria-hidden
                  >
                    {checked ? <RiCheckLine size={16} aria-hidden /> : index + 1}
                  </span>
                  <span className={`text-base leading-relaxed ${checked ? "text-cocoa line-through" : "text-ink"}`}>
                    {step}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {recipe.notes && (
        <div className="card flex flex-col gap-1 p-4">
          <h2 className="text-xl text-ink">Notes</h2>
          <p className="text-sm text-cocoa">{recipe.notes}</p>
        </div>
      )}

      {recipe.sourceUrl && (
        <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className="text-sm text-cocoa underline">
          View original source
        </a>
      )}
    </div>
  );
}
