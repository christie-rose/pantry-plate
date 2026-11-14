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
  const [text, setText] = useState("");
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  // Adds what's been typed as a plain text meal. The line stays ready for the next one.
  function commitText() {
    const label = text.trim();
    if (label) onAdd({ id: crypto.randomUUID(), type: "text", label });
    setText("");
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
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitText();
          if (e.key === "Escape") setText("");
        }}
        onBlur={() => {
          if (!showRecipeModal) commitText();
        }}
        placeholder="Add a meal…"
        aria-label="Add a meal"
        className="min-w-0 flex-1 border-0 bg-transparent p-0 py-1 text-base text-ink outline-none! ring-0 placeholder:text-cocoa/50"
      />
      {/* mousedown is held back so the field keeps focus until the picker opens */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setShowRecipeModal(true)}
        className="shrink-0 text-xs text-cocoa underline"
      >
        Choose recipe…
      </button>

      {showRecipeModal && (
        <RecipePickerModal
          recipes={recipes}
          onSelect={handleSelectRecipe}
          onClose={() => setShowRecipeModal(false)}
        />
      )}
    </div>
  );
}
