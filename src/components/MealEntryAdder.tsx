"use client";

import { useState } from "react";
import type { MealEntry } from "@/lib/weekplan";
import { RecipePickerModal } from "@/components/RecipePickerModal";
import type { PlanRecipeOption } from "@/components/WeekPlanClient";

export function MealEntryAdder({
  recipes,
  onAdd,
}: {
  recipes: PlanRecipeOption[];
  onAdd: (entry: MealEntry) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  function reset() {
    setOpen(false);
    setText("");
  }

  function handleAddText() {
    if (!text.trim()) return;
    onAdd({ id: crypto.randomUUID(), type: "text", label: text.trim() });
    reset();
  }

  function handleSelectRecipe(recipe: PlanRecipeOption) {
    onAdd({
      id: crypto.randomUUID(),
      type: "recipe",
      recipeId: recipe.id,
      label: recipe.title,
      servings: recipe.servings,
    });
    setShowRecipeModal(false);
    reset();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-sage underline">
        + Add
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-md bg-paper-alt p-2">
      <div className="flex gap-1 text-xs">
        <button
          type="button"
          onClick={() => setShowRecipeModal(true)}
          className="rounded border border-cocoa/40 px-2 py-0.5"
        >
          Choose recipe…
        </button>
      </div>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Or type e.g. White rice"
        className="rounded border border-cocoa/40 bg-white px-2 py-1 text-xs"
      />

      <div className="flex gap-1">
        <button type="button" onClick={handleAddText} disabled={!text.trim()} className="rounded bg-sage px-2 py-0.5 text-xs text-white disabled:opacity-50">
          Add
        </button>
        <button type="button" onClick={reset} className="rounded border border-cocoa/40 px-2 py-0.5 text-xs">
          Cancel
        </button>
      </div>

      {showRecipeModal && (
        <RecipePickerModal recipes={recipes} onSelect={handleSelectRecipe} onClose={() => setShowRecipeModal(false)} />
      )}
    </div>
  );
}
