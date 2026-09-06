"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { RiSparklingLine } from "@remixicon/react";
import { RecipeForm, recipeFormToInput, type RecipeFormState } from "@/components/RecipeForm";
import { IngredientMatchPanel } from "@/components/IngredientMatchPanel";
import { scaleAmount, type Cuisine, type RecipeCategory } from "@/lib/recipes";

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
  categories: string[];
  cuisine: string | null;
  servings: number;
  notes: string | null;
  instructions: string[];
  prepAhead: string[];
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
    categories: recipe.categories as RecipeCategory[],
    cuisine: (recipe.cuisine as Cuisine) ?? "",
    servings: String(recipe.servings),
    notes: recipe.notes ?? "",
    instructions: recipe.instructions.length ? recipe.instructions : [""],
    prepAhead: recipe.prepAhead,
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
  const [scaling, setScaling] = useState(false);
  const [scaleError, setScaleError] = useState<string | null>(null);
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiEditing, setAiEditing] = useState(false);
  const [aiEditError, setAiEditError] = useState<string | null>(null);

  // Fixed baseline the current form was last scaled from — kept steady across repeated scales so
  // rounding doesn't compound, but reflects the form's own state at the time of each scale.
  const baselineRef = useRef({
    servings: recipe.servings,
    ingredients: form.ingredients,
    instructions: form.instructions,
    prepAhead: form.prepAhead,
  });

  async function handleScale(targetServings: number) {
    const baseline = baselineRef.current;
    if (!Number.isFinite(targetServings) || targetServings <= 0 || targetServings === baseline.servings) return;

    setScaling(true);
    setScaleError(null);

    const ratio = targetServings / baseline.servings;
    const scaledIngredients = baseline.ingredients.map((ing) => ({
      ...ing,
      amount: ing.amount.trim() && Number.isFinite(Number(ing.amount)) ? String(scaleAmount(Number(ing.amount), ratio)) : ing.amount,
    }));

    setForm((f) => ({ ...f, ingredients: scaledIngredients }));
    baselineRef.current = { ...baseline, servings: targetServings, ingredients: scaledIngredients };

    try {
      const res = await fetch("/api/recipes/scale-instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructions: baseline.instructions,
          prepAhead: baseline.prepAhead,
          oldServings: baseline.servings,
          newServings: targetServings,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setScaleError(data.error ?? "Scaled ingredients, but could not auto-adjust instructions text");
        return;
      }

      const { instructions, prepAhead } = await res.json();
      setForm((f) => ({
        ...f,
        instructions: instructions?.length ? instructions : f.instructions,
        prepAhead: prepAhead ?? f.prepAhead,
      }));
      baselineRef.current = {
        ...baselineRef.current,
        instructions: instructions?.length ? instructions : baselineRef.current.instructions,
        prepAhead: prepAhead ?? baselineRef.current.prepAhead,
      };
    } catch {
      setScaleError("Scaled ingredients, but could not auto-adjust instructions text");
    } finally {
      setScaling(false);
    }
  }

  async function handleAiEdit() {
    if (!aiInstruction.trim()) return;
    setAiEditing(true);
    setAiEditError(null);

    const res = await fetch("/api/recipes/edit-with-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instruction: aiInstruction.trim(),
        recipe: {
          title: form.title,
          servings: Number(form.servings) || 1,
          ingredients: form.ingredients
            .filter((i) => i.name.trim())
            .map((i) => ({
              name: i.name.trim(),
              amount: i.amount.trim() ? Number(i.amount) : null,
              unit: i.unit.trim() || null,
            })),
          instructions: form.instructions.filter((s) => s.trim()),
          prepAhead: form.prepAhead.filter((s) => s.trim()),
        },
      }),
    });

    setAiEditing(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setAiEditError(data.error ?? "Could not edit the recipe");
      return;
    }

    const parsed = await res.json();
    const nextIngredients = parsed.ingredients?.length
      ? parsed.ingredients.map((i: { name: string; amount: number | null; unit: string | null }) => ({
          name: i.name,
          amount: i.amount != null ? String(i.amount) : "",
          unit: i.unit ?? "",
        }))
      : form.ingredients;
    const nextInstructions = parsed.instructions?.length ? parsed.instructions : form.instructions;
    const nextPrepAhead = parsed.prepAhead ?? form.prepAhead;
    const nextServings = parsed.servings ? String(parsed.servings) : form.servings;

    setForm((f) => ({
      ...f,
      title: parsed.title ?? f.title,
      servings: nextServings,
      ingredients: nextIngredients,
      instructions: nextInstructions,
      prepAhead: nextPrepAhead,
    }));
    baselineRef.current = {
      servings: Number(nextServings) || baselineRef.current.servings,
      ingredients: nextIngredients,
      instructions: nextInstructions,
      prepAhead: nextPrepAhead,
    };
    setAiInstruction("");
  }

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

      <div className="card flex flex-col gap-2 p-4">
        <label className="text-sm text-cocoa">Edit with AI</label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
            placeholder="e.g. make it vegetarian, add a side of rice, make it spicier"
            className="min-h-[44px] flex-1 min-w-[200px] rounded-md border border-cocoa/40 bg-white px-3 py-2 text-sm text-ink"
          />
          <button
            type="button"
            onClick={handleAiEdit}
            disabled={aiEditing || !aiInstruction.trim()}
            className="flex min-h-[44px] items-center gap-2 rounded-md border border-cocoa/40 px-3 py-2 text-sm disabled:opacity-50"
          >
            <RiSparklingLine size={18} aria-hidden />
            {aiEditing ? "Editing…" : "Apply"}
          </button>
        </div>
        {aiEditError && <p className="text-sm text-brick">{aiEditError}</p>}
      </div>

      <RecipeForm value={form} onChange={setForm} onScale={handleScale} scaling={scaling} scaleError={scaleError} />

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
