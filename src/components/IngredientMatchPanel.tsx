"use client";

import { useState } from "react";
import { LOCATIONS, STORES, type Location, type Store } from "@/lib/pantry";

type PantryItem = { id: string; name: string };

type UnmatchedIngredient = { id: string; name: string };

export function IngredientMatchPanel({
  ingredients,
  pantryItems,
  onResolved,
}: {
  ingredients: UnmatchedIngredient[];
  pantryItems: PantryItem[];
  onResolved: (ingredientId: string) => void;
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    location: "Pantry" as Location,
    preferredStore: "Costco" as Store,
    isStaple: false,
    quantity: "",
  });

  const visible = ingredients.filter((i) => !dismissed.has(i.id));
  if (visible.length === 0) return null;

  async function linkToExisting(ingredientId: string, pantryItemId: string) {
    if (!pantryItemId) return;
    await fetch(`/api/recipe-ingredients/${ingredientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pantryItemId }),
    });
    onResolved(ingredientId);
  }

  async function addFreshAndLink(ingredientId: string, name: string) {
    const pantryRes = await fetch("/api/pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        location: newItem.location,
        preferredStore: newItem.preferredStore,
        isStaple: newItem.isStaple,
        stapleStatus: newItem.isStaple ? "In stock" : null,
        quantity: newItem.isStaple ? null : newItem.quantity || null,
      }),
    });
    if (!pantryRes.ok) return;
    const created = await pantryRes.json();
    await linkToExisting(ingredientId, created.id);
    setAddingId(null);
  }

  return (
    <div className="card flex flex-col gap-3 p-4">
      <h3 className="text-lg text-brick">New ingredients found</h3>
      <p className="text-sm text-cocoa">
        These ingredients didn&apos;t match anything in your pantry. Match them to an existing item, add
        them fresh, or dismiss — the recipe is already saved either way.
      </p>
      <ul className="flex flex-col gap-3">
        {visible.map((ingredient) => (
          <li key={ingredient.id} className="border-t border-cocoa/20 pt-3 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-ink">{ingredient.name}</span>
              <select
                defaultValue=""
                onChange={(e) => linkToExisting(ingredient.id, e.target.value)}
                className="rounded-md border border-cocoa/40 bg-white px-2 py-1 text-sm"
              >
                <option value="" disabled>
                  Match to pantry item…
                </option>
                {pantryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAddingId(addingId === ingredient.id ? null : ingredient.id)}
                className="rounded-md border border-sage px-2 py-1 text-sm text-sage"
              >
                Add as new
              </button>
              <button
                type="button"
                onClick={() => setDismissed((prev) => new Set(prev).add(ingredient.id))}
                className="rounded-md border border-cocoa/40 px-2 py-1 text-sm text-cocoa"
              >
                Dismiss
              </button>
            </div>

            {addingId === ingredient.id && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md bg-paper-alt p-2">
                <select
                  value={newItem.location}
                  onChange={(e) => setNewItem((f) => ({ ...f, location: e.target.value as Location }))}
                  className="rounded-md border border-cocoa/40 bg-white px-2 py-1 text-sm"
                >
                  {LOCATIONS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <select
                  value={newItem.preferredStore}
                  onChange={(e) => setNewItem((f) => ({ ...f, preferredStore: e.target.value as Store }))}
                  className="rounded-md border border-cocoa/40 bg-white px-2 py-1 text-sm"
                >
                  {STORES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={newItem.isStaple}
                    onChange={(e) => setNewItem((f) => ({ ...f, isStaple: e.target.checked }))}
                  />
                  Staple
                </label>
                {!newItem.isStaple && (
                  <input
                    value={newItem.quantity}
                    onChange={(e) => setNewItem((f) => ({ ...f, quantity: e.target.value }))}
                    placeholder="Quantity"
                    className="rounded-md border border-cocoa/40 bg-white px-2 py-1 text-sm"
                  />
                )}
                <button
                  type="button"
                  onClick={() => addFreshAndLink(ingredient.id, ingredient.name)}
                  className="rounded-md bg-sage px-2 py-1 text-sm text-white"
                >
                  Save to pantry
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
