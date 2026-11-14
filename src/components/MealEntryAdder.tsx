"use client";

import { useRef, useState } from "react";
import { AddLink } from "@/ui";
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
  const skipBlur = useRef(false);

  function reset() {
    setOpen(false);
    setText("");
  }

  // Adds what's been typed as a plain text meal. Enter keeps the line open for another one.
  function commitText(keepOpen: boolean) {
    const label = text.trim();
    if (label) onAdd({ id: crypto.randomUUID(), type: "text", label });
    setText("");
    if (!keepOpen) setOpen(false);
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
      <AddLink onClick={() => setOpen(true)}>Add</AddLink>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span aria-hidden className="h-5 w-5 shrink-0 rounded-full border-2 border-dashed border-brick/60" />
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitText(true);
          if (e.key === "Escape") {
            skipBlur.current = true;
            reset();
          }
        }}
        onBlur={() => {
          if (skipBlur.current) {
            skipBlur.current = false;
            return;
          }
          if (!showRecipeModal) commitText(false);
        }}
        placeholder="Type a meal…"
        aria-label="Add a meal"
        className="min-w-0 flex-1 border-0 bg-transparent p-0 py-1 text-base text-ink outline-none! ring-0 placeholder:text-cocoa/50"
      />
      {/* mousedown is held back so the field keeps focus and doesn't close before the picker opens */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setShowRecipeModal(true)}
        className="shrink-0 text-xs text-cocoa underline"
      >
        Choose recipe…
      </button>

      {showRecipeModal && (
        <RecipePickerModal recipes={recipes} onSelect={handleSelectRecipe} onClose={() => setShowRecipeModal(false)} />
      )}
    </div>
  );
}
