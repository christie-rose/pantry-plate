"use client";

import { RiCloseLine, RiShoppingCartLine } from "@remixicon/react";
import { ActionsMenu, MenuItem } from "@/ui";

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
  return (
    <ActionsMenu>
      {(close) => (
        <>
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
                  close();
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
            <MenuItem
              tone="sage"
              icon={<RiShoppingCartLine size={16} aria-hidden />}
              disabled={addingToGrocery}
              onClick={() => {
                onAddToGrocery();
                close();
              }}
            >
              Add to grocery list
            </MenuItem>
          )}

          <MenuItem
            tone="danger"
            icon={<RiCloseLine size={16} aria-hidden />}
            onClick={() => {
              onRemove();
              close();
            }}
          >
            Remove
          </MenuItem>
        </>
      )}
    </ActionsMenu>
  );
}
