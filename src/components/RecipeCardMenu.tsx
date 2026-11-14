"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiDeleteBinLine, RiEdit2Line, RiFileCopyLine } from "@remixicon/react";
import { RiCalendarLine } from "@remixicon/react";
import { ActionsMenu, MenuItem } from "@/ui";
import { AddToDayMenu } from "@/components/AddToDayMenu";

/** The Edit / Duplicate / Delete menu on a recipe card in the list. */
export function RecipeCardMenu({
  id,
  title,
  servings,
  onDeleted,
}: {
  id: string;
  title: string;
  servings: number;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [duplicating, setDuplicating] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pickingDay, setPickingDay] = useState(false);

  async function handleDuplicate() {
    setDuplicating(true);
    const res = await fetch(`/api/recipes/${id}/duplicate`, { method: "POST" }).catch(() => null);
    if (!res?.ok) {
      setDuplicating(false);
      return;
    }
    const { id: newId } = await res.json();
    router.push(`/recipes/${newId}/edit`);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) onDeleted(id);
    else setDeleting(false);
  }

  return (
    <ActionsMenu label={`Actions for ${title}`}>
      {(close) =>
        pickingDay ? (
          <AddToDayMenu
            recipe={{ id, title, servings }}
            onBack={() => setPickingDay(false)}
            onDone={() => {
              setPickingDay(false);
              close();
            }}
          />
        ) : confirmingDelete ? (
          <div className="flex flex-col gap-2 p-1">
            <p className="text-sm text-ink">Delete “{title}” for good? This can’t be undone.</p>
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
            <MenuItem tone="ink" icon={<RiCalendarLine size={16} aria-hidden />} onClick={() => setPickingDay(true)}>
              Add to meal plan
            </MenuItem>
            <MenuItem tone="ink" icon={<RiEdit2Line size={16} aria-hidden />} onClick={() => router.push(`/recipes/${id}/edit`)}>
              Edit recipe
            </MenuItem>
            <MenuItem
              tone="ink"
              icon={<RiFileCopyLine size={16} aria-hidden />}
              onClick={handleDuplicate}
              disabled={duplicating}
            >
              {duplicating ? "Duplicating…" : "Duplicate"}
            </MenuItem>
            <MenuItem tone="danger" icon={<RiDeleteBinLine size={16} aria-hidden />} onClick={() => setConfirmingDelete(true)}>
              Delete recipe
            </MenuItem>
          </>
        )
      }
    </ActionsMenu>
  );
}
