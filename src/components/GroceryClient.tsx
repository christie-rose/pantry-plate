"use client";

import { useState } from "react";
import Link from "next/link";
import { addDaysToKey, formatWeekLabel } from "@/lib/weekplan";
import type { GroceryItem } from "@/lib/grocery";

export function GroceryClient({ weekKey, initialItems }: { weekKey: string; initialItems: GroceryItem[] }) {
  const [items, setItems] = useState<GroceryItem[]>(initialItems);
  const [newName, setNewName] = useState("");
  const [hideChecked, setHideChecked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [confirming, setConfirming] = useState<"checked" | "all" | null>(null);

  const checkedCount = items.filter((i) => i.checked).length;
  const visibleItems = hideChecked ? items.filter((i) => !i.checked) : items;

  function formatItemLine(item: GroceryItem): string {
    return item.note ? `${item.name} (${item.note})` : item.name;
  }

  function showCopied() {
    setCopyFailed(false);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function fallbackCopy(text: string) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) showCopied();
      else setCopyFailed(true);
    } catch {
      setCopyFailed(true);
    }
  }

  // Copies only what's still needed (unchecked items).
  function copyList() {
    const text = items
      .filter((i) => !i.checked)
      .map(formatItemLine)
      .join("\n");
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(showCopied, () => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  async function persist(next: GroceryItem[]) {
    setItems(next);
    await fetch("/api/grocery", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekKey, items: next }),
    });
  }

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    persist([...items, { id: crypto.randomUUID(), name }]);
    setNewName("");
  }

  function toggleChecked(id: string) {
    persist(items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  }

  function deleteChecked() {
    persist(items.filter((item) => !item.checked));
    setConfirming(null);
  }

  function clearList() {
    persist([]);
    setConfirming(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 pb-24">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl text-brick">Grocery List</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/grocery?week=${addDaysToKey(weekKey, -7)}`} className="flex min-h-[44px] items-center rounded-md border border-cocoa/40 px-2">
            ← Prev
          </Link>
          <span className="font-medium text-ink">{formatWeekLabel(weekKey)}</span>
          <Link href={`/grocery?week=${addDaysToKey(weekKey, 7)}`} className="flex min-h-[44px] items-center rounded-md border border-cocoa/40 px-2">
            Next →
          </Link>
        </div>
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copyList}
              className="min-h-[44px] rounded-md border border-cocoa/40 px-3 text-sm text-ink"
            >
              {copied ? "Copied!" : "Copy list"}
            </button>

            <button
              type="button"
              onClick={() => setHideChecked((h) => !h)}
              disabled={checkedCount === 0 && !hideChecked}
              className="min-h-[44px] rounded-md border border-cocoa/40 px-3 text-sm text-ink disabled:opacity-40"
            >
              {hideChecked ? `Show checked (${checkedCount})` : "Hide checked"}
            </button>

            {confirming === "checked" ? (
              <>
                <button
                  type="button"
                  onClick={deleteChecked}
                  className="min-h-[44px] rounded-md bg-brick px-3 text-sm font-medium text-white"
                >
                  Yes, delete {checkedCount} checked
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="min-h-[44px] rounded-md border border-cocoa/40 px-3 text-sm text-ink"
                >
                  Cancel
                </button>
              </>
            ) : confirming === "all" ? (
              <>
                <button
                  type="button"
                  onClick={clearList}
                  className="min-h-[44px] rounded-md bg-brick px-3 text-sm font-medium text-white"
                >
                  Yes, clear {items.length} {items.length === 1 ? "item" : "items"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="min-h-[44px] rounded-md border border-cocoa/40 px-3 text-sm text-ink"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setConfirming("checked")}
                  disabled={checkedCount === 0}
                  className="min-h-[44px] rounded-md border border-brick/50 px-3 text-sm text-brick disabled:opacity-40"
                >
                  Delete checked{checkedCount > 0 ? ` (${checkedCount})` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming("all")}
                  className="min-h-[44px] rounded-md border border-brick/50 px-3 text-sm text-brick"
                >
                  Clear list
                </button>
              </>
            )}
          </div>
          <p className="text-xs text-cocoa">
            {copyFailed
              ? "Couldn't copy automatically — select the list text manually."
              : "Copy list skips checked items. Paste it into Instacart or your store's pickup app."}
          </p>
        </div>
      )}

      <div className="card flex flex-wrap items-center gap-2 p-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="Add an item…"
          className="min-h-[44px] min-w-[140px] flex-1 rounded-md border border-cocoa/40 bg-white px-2 text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="min-h-[44px] rounded-md bg-sage px-3 text-sm font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-cocoa">
          No items on the list yet. Add items above, or go to{" "}
          <Link href="/plan" className="underline">
            Plan
          </Link>{" "}
          and add a recipe&apos;s ingredients to this week&apos;s list.
        </p>
      )}

      {items.length > 0 && visibleItems.length === 0 && (
        <p className="text-sm text-cocoa">All items are checked off. Use &ldquo;Show checked&rdquo; to see them.</p>
      )}

      {visibleItems.length > 0 && (
        <ul className="flex flex-col divide-y divide-cocoa/20 rounded-md border border-cocoa/30 bg-white">
          {visibleItems.map((item) => (
            <li key={item.id}>
              <label className="flex min-h-[48px] cursor-pointer items-center gap-3 p-3">
                <input
                  type="checkbox"
                  checked={Boolean(item.checked)}
                  onChange={() => toggleChecked(item.id)}
                  className="h-5 w-5 shrink-0 accent-sage"
                />
                <span className={item.checked ? "text-cocoa line-through" : "text-ink"}>
                  {item.name}
                  {item.note && <span className="text-cocoa"> — {item.note}</span>}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
