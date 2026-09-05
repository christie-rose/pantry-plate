"use client";

import { useState } from "react";
import type { MealEntry } from "@/lib/weekplan";

type Recipe = { id: string; title: string; servings: number };

export function MealEntryAdder({
  recipes,
  onAdd,
}: {
  recipes: Recipe[];
  onAdd: (entry: MealEntry) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"recipe" | "text">("text");
  const [recipeId, setRecipeId] = useState("");
  const [servings, setServings] = useState("");
  const [text, setText] = useState("");

  function reset() {
    setOpen(false);
    setMode("text");
    setRecipeId("");
    setServings("");
    setText("");
  }

  function handleAdd() {
    if (mode === "text") {
      if (!text.trim()) return;
      onAdd({ id: crypto.randomUUID(), type: "text", label: text.trim() });
    } else {
      const recipe = recipes.find((r) => r.id === recipeId);
      if (!recipe) return;
      onAdd({
        id: crypto.randomUUID(),
        type: "recipe",
        recipeId: recipe.id,
        label: recipe.title,
        servings: servings.trim() ? Number(servings) : recipe.servings,
      });
    }
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
          onClick={() => setMode("text")}
          className={`rounded px-2 py-0.5 ${mode === "text" ? "bg-brick text-white" : "border border-cocoa/40"}`}
        >
          Text
        </button>
        <button
          type="button"
          onClick={() => setMode("recipe")}
          className={`rounded px-2 py-0.5 ${mode === "recipe" ? "bg-brick text-white" : "border border-cocoa/40"}`}
        >
          Recipe
        </button>
      </div>

      {mode === "text" ? (
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. White rice"
          className="rounded border border-cocoa/40 bg-white px-2 py-1 text-xs"
        />
      ) : (
        <div className="flex gap-1">
          <select
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
            className="flex-1 rounded border border-cocoa/40 bg-white px-2 py-1 text-xs"
          >
            <option value="">Choose recipe…</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
          <input
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            placeholder="Servings"
            className="w-16 rounded border border-cocoa/40 bg-white px-2 py-1 text-xs"
          />
        </div>
      )}

      <div className="flex gap-1">
        <button type="button" onClick={handleAdd} className="rounded bg-sage px-2 py-0.5 text-xs text-white">
          Add
        </button>
        <button type="button" onClick={reset} className="rounded border border-cocoa/40 px-2 py-0.5 text-xs">
          Cancel
        </button>
      </div>
    </div>
  );
}
