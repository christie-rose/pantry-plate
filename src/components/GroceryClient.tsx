"use client";

import { AddButton, Button, FilterChip, GroceryList, GroceryRow, TagChip } from "@/ui";
import { useRef, useState } from "react";
import Link from "next/link";
import type { GroceryItem } from "@/lib/grocery";

const UNTAGGED = "__untagged__";

export function GroceryClient({
  initialItems,
  knownTags,
}: {
  initialItems: GroceryItem[];
  knownTags: string[];
}) {
  const [items, setItems] = useState<GroceryItem[]>(initialItems);
  const [hideChecked, setHideChecked] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const skipBlurRef = useRef(false);
  const [tagHighlight, setTagHighlight] = useState(-1);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const skipItemBlurRef = useRef(false);
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

  // Existing tags that match what's been typed so far (all of them when the box is empty).
  function tagOptions(draft: string): string[] {
    const q = draft.trim().toLowerCase();
    return suggestionTags.filter((t) => t.toLowerCase() !== q && (!q || t.toLowerCase().includes(q)));
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
    // A line you're still typing into (blank) lives only on screen until it has text.
    await fetch("/api/grocery", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: next.filter((i) => i.name.trim()) }),
    });
  }

  // Items are shown as "name — note"; editing that single line and splitting it back keeps both editable.
  function lineFor(item: GroceryItem): string {
    return item.note ? `${item.name} \u2014 ${item.note}` : item.name;
  }

  function parseLine(text: string): { name: string; note: string | null } {
    const idx = text.indexOf(" \u2014 ");
    if (idx === -1) return { name: text.trim(), note: null };
    return { name: text.slice(0, idx).trim(), note: text.slice(idx + 3).trim() || null };
  }

  function startEditingItem(item: GroceryItem) {
    skipItemBlurRef.current = false;
    setEditingItemId(item.id);
    setEditDraft(lineFor(item));
  }

  // Saves the line being edited. With addNext (Enter), also opens a fresh line right below it.
  function finishItemEdit(id: string, addNext: boolean) {
    const item = items.find((i) => i.id === id);
    if (!item) {
      setEditingItemId(null);
      return;
    }
    const text = editDraft.trim();

    if (!text) {
      // Nothing typed: a brand-new blank line is dropped; an existing item just keeps its old text.
      setEditingItemId(null);
      if (!item.name.trim()) persist(items.filter((i) => i.id !== id));
      return;
    }

    const { name, note } = parseLine(text);
    let next = items.map((i) => (i.id === id ? { ...i, name, note } : i));

    if (addNext) {
      // The new line inherits the tag, so it stays visible under an active tag filter.
      const blank: GroceryItem = { id: crypto.randomUUID(), name: "", tag: item.tag ?? null };
      const at = next.findIndex((i) => i.id === id);
      next = [...next.slice(0, at + 1), blank, ...next.slice(at + 1)];
      setEditingItemId(blank.id);
      setEditDraft("");
    } else {
      setEditingItemId(null);
    }
    persist(next);
  }

  function cancelItemEdit(id: string) {
    const item = items.find((i) => i.id === id);
    setEditingItemId(null);
    if (item && !item.name.trim()) persist(items.filter((i) => i.id !== id));
  }

  // Adds a blank line at the top, right under the + button, and starts editing it. It isn't saved
  // until it has text.
  // Under a tag filter it takes that tag so it doesn't vanish from view.
  function addLine() {
    const blank: GroceryItem = {
      id: crypto.randomUUID(),
      name: "",
      tag: activeFilter && activeFilter !== UNTAGGED ? activeFilter : null,
    };
    skipItemBlurRef.current = false;
    setItems([blank, ...items]);
    setEditingItemId(blank.id);
    setEditDraft("");
  }

  function toggleChecked(id: string) {
    persist(items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  }

  function startEditingTag(item: GroceryItem) {
    skipBlurRef.current = false;
    setTagHighlight(-1);
    setEditingTagId(item.id);
    setTagDraft(item.tag ?? "");
  }

  function commitTag(id: string, picked?: string) {
    const tag = canonicalTag(picked ?? tagDraft);
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
      <h1 className="text-3xl text-brick">Grocery List</h1>

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={copyList}>
              {copied ? "Copied!" : filterLabel ? `Copy ${filterLabel} list` : "Copy list"}
            </Button>

            <Button variant="secondary" onClick={() => setHideChecked((h) => !h)} disabled={checkedCount === 0}>
              {hideChecked ? `Show checked (${checkedCount})` : "Hide checked"}
            </Button>

            {confirming === "checked" ? (
              <>
                <Button onClick={deleteChecked}>Yes, delete {checkedCount} checked</Button>
                <Button variant="secondary" onClick={() => setConfirming(null)}>
                  Cancel
                </Button>
              </>
            ) : confirming === "all" ? (
              <>
                <Button onClick={clearList}>
                  Yes, clear {items.length} {items.length === 1 ? "item" : "items"}
                </Button>
                <Button variant="secondary" onClick={() => setConfirming(null)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="danger" onClick={() => setConfirming("checked")} disabled={checkedCount === 0}>
                  Delete checked{checkedCount > 0 ? ` (${checkedCount})` : ""}
                </Button>
                <Button variant="danger" onClick={() => setConfirming("all")}>
                  Clear list
                </Button>
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
            <FilterChip
              key={chip.value ?? "all"}
              onClick={() => setFilterTag(chip.value)}
              selected={activeFilter === chip.value}
            >
              {chip.label}
            </FilterChip>
          ))}
        </div>
      )}

      <AddButton onClick={addLine} />

      {items.length === 0 && (
        <p className="text-sm text-cocoa">
          No items on the list yet. Tap + to add one, or go to{" "}
          <Link href="/plan" className="underline">
            Meal Plan
          </Link>{" "}
          and add a recipe&apos;s ingredients to your list.
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
        <GroceryList>
          {visibleItems.map((item) => (
            <GroceryRow
              key={item.id}
              checked={Boolean(item.checked)}
              onToggle={() => toggleChecked(item.id)}
              checkLabel={`Check off ${item.name || "item"}`}
              aside={
                <>

              {editingTagId === item.id ? (
                <div className="relative shrink-0">
                  <input
                    autoFocus
                    value={tagDraft}
                    onChange={(e) => {
                      setTagDraft(e.target.value);
                      setTagHighlight(-1);
                    }}
                    onKeyDown={(e) => {
                      const options = tagOptions(tagDraft);
                      if (e.key === "ArrowDown" && options.length > 0) {
                        e.preventDefault();
                        setTagHighlight((h) => (h + 1) % options.length);
                      } else if (e.key === "ArrowUp" && options.length > 0) {
                        e.preventDefault();
                        setTagHighlight((h) => (h <= 0 ? options.length - 1 : h - 1));
                      } else if (e.key === "Enter") {
                        // The field unmounting can fire a blur; skip it so Enter/Escape only act once.
                        skipBlurRef.current = true;
                        commitTag(item.id, tagHighlight >= 0 ? options[tagHighlight] : undefined);
                      } else if (e.key === "Escape") {
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
                    autoComplete="off"
                    className="h-9 w-36 rounded-md border border-cocoa/40 bg-white px-2 text-sm text-ink"
                  />
                  {tagOptions(tagDraft).length > 0 && (
                    <div
                      role="listbox"
                      aria-label="Tag suggestions"
                      className="absolute right-0 top-full z-20 mt-1 max-h-48 w-44 overflow-auto rounded-md border border-cocoa/40 bg-white py-1 shadow-md"
                    >
                      {tagOptions(tagDraft).map((t, i) => (
                        <button
                          key={t}
                          type="button"
                          role="option"
                          aria-selected={i === tagHighlight}
                          // mousedown (not click) so it lands before the field loses focus and saves
                          onMouseDown={(e) => {
                            e.preventDefault();
                            skipBlurRef.current = true;
                            commitTag(item.id, t);
                          }}
                          className={`block w-full px-3 py-2 text-left text-sm text-ink ${
                            i === tagHighlight ? "bg-paper-alt" : "hover:bg-paper-alt"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : item.tag ? (
                <TagChip onClick={() => startEditingTag(item)} title="Change tag">
                  {item.tag}
                </TagChip>
              ) : (
                <TagChip add onClick={() => startEditingTag(item)}>
                  + tag
                </TagChip>
              )}
                </>
              }
            >
                {editingItemId === item.id ? (
                  <input
                    autoFocus
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => {
                      // The field unmounting can fire a blur; skip it so Enter/Escape only act once.
                      if (e.key === "Enter") {
                        skipItemBlurRef.current = true;
                        finishItemEdit(item.id, true);
                      }
                      if (e.key === "Escape") {
                        skipItemBlurRef.current = true;
                        cancelItemEdit(item.id);
                      }
                    }}
                    onBlur={() => {
                      if (skipItemBlurRef.current) {
                        skipItemBlurRef.current = false;
                        return;
                      }
                      finishItemEdit(item.id, false);
                    }}
                    placeholder="Add an item…"
                    aria-label="Edit item"
                    className="h-9 min-w-0 flex-1 rounded-md border border-cocoa/40 bg-white px-2 text-sm text-ink"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditingItem(item)}
                    title="Click to edit"
                    className={`min-w-0 flex-1 cursor-text break-words text-left text-base ${
                      item.checked ? "text-cocoa line-through" : "text-ink"
                    }`}
                  >
                    {item.name}
                    {item.note && <span className="text-cocoa"> — {item.note}</span>}
                  </button>
                )}
            </GroceryRow>
          ))}
        </GroceryList>
      )}
    </div>
  );
}
