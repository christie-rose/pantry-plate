"use client";

import { useRef, useState } from "react";
import { RiCloseLine, RiDeleteBinLine } from "@remixicon/react";
import { ActionsMenu, AddButton, EmptyState, GroceryList, GroceryRow, MenuItem, PageTitle } from "@/ui";

type Suggestion = { id: string; text: string; done: boolean };

const json = { "Content-Type": "application/json" };

export function SuggestionsClient({ initialItems }: { initialItems: Suggestion[] }) {
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirming, setConfirming] = useState(false);
  // Which line is being edited, readable from event handlers right away. A field that has already been
  // handled (Enter/Escape) and then loses focus as it goes away is ignored by comparing against this.
  const editingRef = useRef<string | null>(null);

  const doneCount = items.filter((i) => i.done).length;

  // A new line starts blank at the top and is only saved once it has text.
  function addLine() {
    const blank = { id: crypto.randomUUID(), text: "", done: false };
    editingRef.current = blank.id;
    setItems((list) => [blank, ...list]);
    setEditingId(blank.id);
    setDraft("");
  }

  function startEditing(item: Suggestion) {
    editingRef.current = item.id;
    setEditingId(item.id);
    setDraft(item.text);
  }

  function finishEdit(id: string, addNext: boolean) {
    const item = items.find((i) => i.id === id);
    const text = draft.trim();
    editingRef.current = null;
    setEditingId(null);
    if (!item) return;

    if (!text) {
      // Nothing typed: a brand-new blank line goes away; an existing one keeps its old text.
      if (!item.text) setItems((list) => list.filter((i) => i.id !== id));
      return;
    }

    if (!item.text) {
      setItems((list) => list.map((i) => (i.id === id ? { ...i, text } : i)));
      void fetch("/api/suggestions", { method: "POST", headers: json, body: JSON.stringify({ id, text }) });
    } else if (text !== item.text) {
      setItems((list) => list.map((i) => (i.id === id ? { ...i, text } : i)));
      void fetch(`/api/suggestions/${id}`, { method: "PATCH", headers: json, body: JSON.stringify({ text }) });
    }
    if (addNext) addLine();
  }

  function cancelEdit(id: string) {
    const item = items.find((i) => i.id === id);
    editingRef.current = null;
    setEditingId(null);
    if (item && !item.text) setItems((list) => list.filter((i) => i.id !== id));
  }

  function toggle(item: Suggestion) {
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)));
    void fetch(`/api/suggestions/${item.id}`, { method: "PATCH", headers: json, body: JSON.stringify({ done: !item.done }) });
  }

  function remove(id: string) {
    setItems((list) => list.filter((i) => i.id !== id));
    void fetch(`/api/suggestions/${id}`, { method: "DELETE" });
  }

  function deleteChecked() {
    setItems((list) => list.filter((i) => !i.done));
    void fetch("/api/suggestions", { method: "DELETE" });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 pb-24">
      <div>
        <PageTitle>Suggestions</PageTitle>
        <p className="mt-1 text-sm text-cocoa">Ideas from the family for making the app better.</p>
      </div>

      <div className="flex items-center gap-2">
        {doneCount > 0 && (
          <ActionsMenu size="lg" label="Suggestion actions">
            {(close) =>
              confirming ? (
                <div className="flex flex-col gap-2 p-1">
                  <p className="text-sm text-ink">
                    Delete {doneCount} checked {doneCount === 1 ? "suggestion" : "suggestions"}?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirming(false);
                        close();
                      }}
                      className="min-h-[40px] flex-1 rounded-md border border-cocoa/40 px-2 text-sm text-ink"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteChecked();
                        setConfirming(false);
                        close();
                      }}
                      className="min-h-[40px] flex-1 rounded-md bg-brick px-2 text-sm font-medium text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <MenuItem tone="danger" icon={<RiDeleteBinLine size={16} aria-hidden />} onClick={() => setConfirming(true)}>
                  Delete checked ({doneCount})
                </MenuItem>
              )
            }
          </ActionsMenu>
        )}
        <div className="ml-auto">
          <AddButton onClick={addLine} />
        </div>
      </div>

      {items.length === 0 && (
        <EmptyState art="lemon" title="No suggestions yet">
          Tap + to add one.
        </EmptyState>
      )}

      {items.length > 0 && (
        <GroceryList>
          {items.map((item) => (
            <GroceryRow
              key={item.id}
              checked={item.done}
              onToggle={() => toggle(item)}
              checkLabel={`Mark ${item.text || "suggestion"} as done`}
              onSwipeDelete={() => remove(item.id)}
              aside={
                item.text ? (
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label={`Delete ${item.text}`}
                    title="Delete"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-cocoa hover:bg-cocoa/10"
                  >
                    <RiCloseLine size={18} aria-hidden />
                  </button>
                ) : null
              }
            >
              {editingId === item.id ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") finishEdit(item.id, true);
                    if (e.key === "Escape") cancelEdit(item.id);
                  }}
                  onBlur={() => {
                    if (editingRef.current === item.id) finishEdit(item.id, false);
                  }}
                  placeholder="Add a suggestion…"
                  aria-label="Edit suggestion"
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-ink outline-none! ring-0 placeholder:text-cocoa/50"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => startEditing(item)}
                  title="Click to edit"
                  className={`min-w-0 flex-1 cursor-text break-words text-left text-base ${
                    item.done ? "text-cocoa line-through" : "text-ink"
                  }`}
                >
                  {item.text}
                </button>
              )}
            </GroceryRow>
          ))}
        </GroceryList>
      )}
    </div>
  );
}
