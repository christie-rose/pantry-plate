"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiCalendarLine, RiDeleteBinLine, RiEdit2Line, RiFileCopyLine } from "@remixicon/react";
import { ActionsMenu, CheckMark, DividedList, MenuItem, PageTitle, SectionHeading } from "@/ui";
import { CookingAssistant } from "@/components/CookingAssistant";
import { RecipeImageManager } from "@/components/RecipeImageManager";
import { formatAmountAsFraction } from "@/lib/recipes";

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
  cuisine: string | null;
  servings: number;
  notes: string | null;
  instructions: string[];
  prepAhead: string[];
  source: string;
  sourceUrl: string | null;
  ingredients: Ingredient[];
  image: { updatedAt: Date } | null;
};

function formatAmount(ingredient: Ingredient): string {
  const parts = [
    ingredient.amount != null ? formatAmountAsFraction(ingredient.amount) : null,
    ingredient.unit,
  ].filter(Boolean);
  return parts.join(" ");
}

export function RecipeCookingView({ recipe, originalServings }: { recipe: Recipe; originalServings?: number }) {
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [checkedPrepSteps, setCheckedPrepSteps] = useState<Set<number>>(new Set());
  const [duplicating, setDuplicating] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDuplicate() {
    setDuplicating(true);
    const res = await fetch(`/api/recipes/${recipe.id}/duplicate`, { method: "POST" });
    if (!res.ok) {
      setDuplicating(false);
      return;
    }
    const { id } = await res.json();
    router.push(`/recipes/${id}/edit`);
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" }).catch(() => null);
    router.push("/recipes");
  }

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
          <PageTitle>{recipe.title}</PageTitle>
          <p className="text-sm text-cocoa">
            Serves {recipe.servings}
            {originalServings ? ` (scaled from ${originalServings} in the plan)` : ""}
            {recipe.cuisine ? ` · ${recipe.cuisine}` : ""}
            {recipe.categories.length > 0 ? ` · ${recipe.categories.join(", ")}` : ""}
            {recipe.tags.length > 0 ? ` · ${recipe.tags.join(", ")}` : ""}
          </p>
        </div>
        <ActionsMenu size="lg" label="Recipe actions">
          {(close) =>
            confirmingDelete ? (
              <div className="flex flex-col gap-2 p-1">
                <p className="text-sm text-ink">Delete “{recipe.title}” for good? This can’t be undone.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingDelete(false);
                      close();
                    }}
                    className="min-h-[40px] flex-1 rounded-md border border-cocoa/40 px-2 text-sm text-ink"
                  >
                    Keep it
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="min-h-[40px] flex-1 rounded-md bg-brick px-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <MenuItem
                  tone="ink"
                  icon={<RiEdit2Line size={16} aria-hidden />}
                  onClick={() => router.push(`/recipes/${recipe.id}/edit`)}
                >
                  Edit recipe
                </MenuItem>
                {/* The menu stays open while copying so "Duplicating…" shows until the new recipe opens. */}
                <MenuItem
                  tone="ink"
                  icon={<RiFileCopyLine size={16} aria-hidden />}
                  onClick={handleDuplicate}
                  disabled={duplicating}
                >
                  {duplicating ? "Duplicating…" : "Duplicate"}
                </MenuItem>
                <MenuItem
                  tone="danger"
                  icon={<RiDeleteBinLine size={16} aria-hidden />}
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete recipe
                </MenuItem>
              </>
            )
          }
        </ActionsMenu>
      </div>

      <RecipeImageManager
        recipeId={recipe.id}
        title={recipe.title}
        initialVersion={recipe.image ? new Date(recipe.image.updatedAt).getTime() : null}
        expectAiImage={recipe.source === "ai"}
      />

      <div className="card flex flex-col gap-2 p-4">
        <SectionHeading>Ingredients</SectionHeading>
        <DividedList>
          {recipe.ingredients.map((ingredient) => {
            const checked = checkedIngredients.has(ingredient.id);
            return (
              <li key={ingredient.id}>
                <button
                  type="button"
                  onClick={() => toggleIngredient(ingredient.id)}
                  className="flex min-h-[44px] w-full items-center gap-3 py-2 text-left"
                >
                  <CheckMark checked={checked} />
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
        </DividedList>
      </div>

      {recipe.prepAhead.length > 0 && (
        <div className="card flex flex-col gap-2 p-4">
          <SectionHeading>
            <RiCalendarLine size={18} className="text-sage" aria-hidden />
            Prep ahead
          </SectionHeading>
          <DividedList as="ol">
            {recipe.prepAhead.map((step, index) => {
              const checked = checkedPrepSteps.has(index);
              return (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => togglePrepStep(index)}
                    className="flex w-full items-start gap-3 py-3 text-left"
                  >
                    <CheckMark checked={checked} className="mt-0.5">
                      {index + 1}
                    </CheckMark>
                    <span className={`text-base leading-relaxed ${checked ? "text-cocoa line-through" : "text-ink"}`}>
                      {step}
                    </span>
                  </button>
                </li>
              );
            })}
          </DividedList>
        </div>
      )}

      <div className="card flex flex-col gap-2 p-4">
        <SectionHeading>Instructions</SectionHeading>
        <DividedList as="ol">
          {recipe.instructions.map((step, index) => {
            const checked = checkedSteps.has(index);
            return (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => toggleStep(index)}
                  className="flex w-full items-start gap-3 py-3 text-left"
                >
                  <CheckMark checked={checked} className="mt-0.5">
                    {index + 1}
                  </CheckMark>
                  <span className={`text-base leading-relaxed ${checked ? "text-cocoa line-through" : "text-ink"}`}>
                    {step}
                  </span>
                </button>
              </li>
            );
          })}
        </DividedList>
      </div>

      {recipe.notes && (
        <div className="card flex flex-col gap-1 p-4">
          <SectionHeading>Notes</SectionHeading>
          <p className="text-sm text-cocoa">{recipe.notes}</p>
        </div>
      )}

      {recipe.sourceUrl && (
        <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className="text-sm text-cocoa underline">
          View original source
        </a>
      )}
      <CookingAssistant
        recipeId={recipe.id}
        servings={recipe.servings}
        progress={{
          ingredients: [...checkedIngredients],
          steps: [...checkedSteps],
          prep: [...checkedPrepSteps],
        }}
      />
    </div>
  );
}
