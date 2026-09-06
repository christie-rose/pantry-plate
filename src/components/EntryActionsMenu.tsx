"use client";

import { useState } from "react";
import { RiCloseLine, RiMore2Fill, RiShoppingCartLine } from "@remixicon/react";

export function EntryActionsMenu({
  isRecipe,
  servings,
  onServingsChange,
  addingToGrocery,
  onAddToGrocery,
  onRemove,
  moveOptions,
  onMove,
}: {
  isRecipe: boolean;
  servings?: number;
  onServingsChange: (servings: number) => void;
  addingToGrocery: boolean;
  onAddToGrocery: () => void;
  onRemove: () => void;
  moveOptions: { value: string; label: string }[];
  onMove: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-cocoa hover:bg-cocoa/10"
        aria-label="Actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <RiMore2Fill size={18} aria-hidden />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 flex w-52 flex-col gap-2 rounded-md border border-cocoa/30 bg-white p-2 text-xs shadow-lg">
            {isRecipe && (
              <label className="flex items-center justify-between gap-2 text-cocoa">
                Servings
                <input
                  type="number"
                  min={1}
                  value={servings ?? ""}
                  onChange={(e) => onServingsChange(Number(e.target.value))}
                  className="h-8 w-14 rounded-md border border-cocoa/40 bg-white px-1 text-center text-sm text-ink"
                />
              </label>
            )}

            <label className="flex items-center justify-between gap-2 text-cocoa">
              Move to
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onMove(e.target.value);
                    setOpen(false);
                  }
                }}
                className="h-8 flex-1 rounded-md border border-cocoa/40 bg-white px-1 text-ink"
              >
                <option value="">Choose…</option>
                {moveOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            {isRecipe && (
              <button
                type="button"
                onClick={() => {
                  onAddToGrocery();
                  setOpen(false);
                }}
                disabled={addingToGrocery}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sage hover:bg-sage/10 disabled:opacity-50"
              >
                <RiShoppingCartLine size={16} aria-hidden />
                Add to grocery list
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onRemove();
                setOpen(false);
              }}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-brick hover:bg-brick/10"
            >
              <RiCloseLine size={16} aria-hidden />
              Remove
            </button>
          </div>
        </>
      )}
    </div>
  );
}
