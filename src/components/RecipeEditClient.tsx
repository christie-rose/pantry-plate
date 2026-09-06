"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RecipeForm, recipeFormToInput, type RecipeFormState } from "@/components/RecipeForm";
import { IngredientMatchPanel } from "@/components/IngredientMatchPanel";

type RecipeIngredient = {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  reviewed: boolean;
};

type Recipe = {
  id: string;
  title: string;
  tags: string[];
  servings: number;
  notes: string | null;
  instructions: string[];
  ingredients: RecipeIngredient[];
};

export function RecipeEditClient({
  recipe,
  pantryItems,
}: {
  recipe: Recipe;
  pantryItems: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<RecipeFormState>({
    title: recipe.title,
    tags: recipe.tags.join(", "),
    servings: String(recipe.servings),
    notes: recipe.notes ?? "",
    instructions: recipe.instructions.length ? recipe.instructions : [""],
    ingredients: recipe.ingredients.length
      ? recipe.ingredients.map((i) => ({
          name: i.name,
          amount: i.amount != null ? String(i.amount) : "",
          unit: i.unit ?? "",
        }))
      : [{ name: "", amount: "", unit: "" }],
  });
  const [unreviewed, setUnreviewed] = useState(recipe.ingredients.filter((i) => !i.reviewed));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOnce, setSavedOnce] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/recipes/${recipe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipeFormToInput(form)),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save recipe");
      return;
    }

    const updated = await res.json();
    setUnreviewed(updated.ingredients.filter((i: RecipeIngredient) => !i.reviewed));
    setSavedOnce(true);
  }

  async function handleDelete() {
    await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    router.push("/recipes");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/recipes/${recipe.id}`} className="text-sm text-cocoa underline">
            ‹ Cancel
          </Link>
          <h1 className="text-3xl text-brick">Edit recipe</h1>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="min-h-[44px] rounded-md border border-brick/50 px-3 py-2 text-sm text-brick"
        >
          Delete
        </button>
      </div>

      <RecipeForm value={form} onChange={setForm} />

      {error && <p className="text-sm text-brick">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !form.title.trim()}
          className="min-h-[44px] self-start rounded-md bg-brick px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Save changes
        </button>
        {savedOnce && (
          <Link href={`/recipes/${recipe.id}`} className="text-sm text-sage underline">
            Saved — view recipe →
          </Link>
        )}
      </div>

      {unreviewed.length > 0 && (
        <IngredientMatchPanel
          ingredients={unreviewed}
          pantryItems={pantryItems}
          onResolved={(id) => setUnreviewed((prev) => prev.filter((i) => i.id !== id))}
        />
      )}
    </div>
  );
}
