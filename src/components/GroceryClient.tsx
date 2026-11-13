"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { addDaysToKey, formatWeekLabel } from "@/lib/weekplan";
import type { GroceryItem } from "@/lib/grocery";

const UNTAGGED = "__untagged__";

export function GroceryClient({
  weekKey,
  initialItems,
  knownTags,
}: {
  weekKey: string;
  initialItems: GroceryItem[];
  knownTags: string[];
}) {
  const [items, setItems] = useState<GroceryItem[]>(initialItems);
  const [newName, setNewName] = useState("");
  const [hideChecked, setHideChecked] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const skipBlurRef = useRef(false);
  const [tagDraft, setTagDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [confirming, setConfirming] = useState<"checked" | "all" | null>(null);

  // Tags on this week's items, plus any used on other weeks (for suggestions).
  const listTags = Array.from(new Set(items.map((i) => i.tag).filter((t): t is string => Boolean(t)))).sort((a, b) =>
    a.localeCompare(b),
  );
  const suggestionTags = Array.from(new Set([...listTags, ...knownTags])).sort((a, b) => a.localeCompare(b));
  const hasUntagged = items.some((i) => !i.tag);

  // If the tag being filtered on no longer exists on any item, fall back to showing everything.
  const activeFilter =
    filterTag === null || (filterTag === UNTAGGED ? hasUntagged : listTags.includes(filterTag)) ? filterTag : null;

  const inFilter = (item: GroceryItem) =>
    activeFilter === null ? true : activeFilter === UNTAGGED ? !item.tag : item.tag === activeFilter;
  const scopeItems = items.filter(inFilter);
  const checkedCount = scopeItems.filter((i) => i.checked).length;
  const visibleItems = hideChecked ? scopeItems.filter((i) => !i.checked) : scopeItems;
  const filterLabel = activeFilter === null ? null : activeFilter === UNTAGGED ? "untagged" : activeFilter;

  function countFor(tag: string): number {
    return items.filter((i) => !i.checked && (tag === UNTAGGED ? !i.tag : i.tag === tag)).length;
  }

  // Reuse an existing tag's spelling when the typed one matches it ignoring case.
  function canonicalTag(input: string): string | undefined {
    const trimmed = input.trim();
    if (!trimmed) return undefined;
    const existing = suggestionTags.find((t) => t.toLowerCase() === trimmed.toLowerCase());
    return existing ?? trimmed;
  }

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

  // Copies what's still needed (unchecked) within the current filter.
  function copyList() {
    const text = scopeItems
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

  function startEditingTag(item: GroceryItem) {
    skipBlurRef.current = false;
    setEditingTagId(item.id);
    setTagDraft(item.tag ?? "");
  }

  function commitTag(id: string) {
    const tag = canonicalTag(tagDraft);
    setEditingTagId(null);
    persist(items.map((item) => (item.id === id ? { ...item, tag: tag ?? null } : item)));
  }

  // Deletes ticked items within the current filter, so hidden/other-tag items are never touched.
  function deleteChecked() {
    persist(items.filter((item) => !(inFilter(item) && item.checked)));
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

      <datalist id="grocery-tag-options">
        {suggestionTags.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copyList}
              className="min-h-[44px] rounded-md border border-cocoa/40 px-3 text-sm text-ink"
            >
              {copied ? "Copied!" : filterLabel ? `Copy ${filterLabel} list` : "Copy list"}
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
              : "Copy list skips checked items and follows the tag filter. Paste it into Instacart or your store's pickup app."}
          </p>
        </div>
      )}

      {listTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by tag">
          {[
            { value: null as string | null, label: "All" },
            ...listTags.map((t) => ({ value: t as string | null, label: `${t} (${countFor(t)})` })),
            ...(hasUntagged ? [{ value: UNTAGGED as string | null, label: `Untagged (${countFor(UNTAGGED)})` }] : []),
          ].map((chip) => (
            <button
              key={chip.value ?? "all"}
              type="button"
              onClick={() => setFilterTag(chip.value)}
              aria-pressed={activeFilter === chip.value}
              className={`min-h-[36px] rounded-full border px-3 text-sm ${
                activeFilter === chip.value
                  ? "border-brick bg-paper-alt font-medium text-brick"
                  : "border-cocoa/40 text-ink"
              }`}
            >
              {chip.label}
            </button>
          ))}
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
        <p className="text-sm text-cocoa">
          {scopeItems.length === 0
            ? "Nothing here."
            : "All of these are checked off. Use “Show checked” to see them."}
        </p>
      )}

      {visibleItems.length > 0 && (
        <ul className="flex flex-col divide-y divide-cocoa/20 rounded-md border border-cocoa/30 bg-white">
          {visibleItems.map((item) => (
            <li key={item.id} className="flex items-center gap-2 pr-3">
              <label className="flex min-h-[48px] min-w-0 flex-1 cursor-pointer items-center gap-3 p-3">
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

              {editingTagId === item.id ? (
                <input
                  autoFocus
                  list="grocery-tag-options"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    // The field unmounting can fire a blur; skip it so Enter/Escape only act once.
                    if (e.key === "Enter") {
                      skipBlurRef.current = true;
                      commitTag(item.id);
                    }
                    if (e.key === "Escape") {
                      skipBlurRef.current = true;
                      setEditingTagId(null);
                    }
                  }}
                  onBlur={() => {
                    if (skipBlurRef.current) {
                      skipBlurRef.current = false;
                      return;
                    }
                    commitTag(item.id);
                  }}
                  placeholder="Tag (e.g. store)"
                  aria-label="Tag"
                  className="h-9 w-36 shrink-0 rounded-md border border-cocoa/40 bg-white px-2 text-sm text-ink"
                />
              ) : item.tag ? (
                <button
                  type="button"
                  onClick={() => startEditingTag(item)}
                  title="Change tag"
                  className="shrink-0 rounded-full bg-sage/20 px-3 py-1 text-xs text-ink"
                >
                  {item.tag}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => startEditingTag(item)}
                  className="shrink-0 rounded-full border border-dashed border-cocoa/40 px-3 py-1 text-xs text-cocoa"
                >
                  + tag
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
