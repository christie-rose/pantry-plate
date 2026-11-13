"use client";

import { useState } from "react";
import Link from "next/link";
import { STORES, type Store } from "@/lib/stores";
import { addDaysToKey, formatWeekLabel } from "@/lib/weekplan";
import type { GroceryItem } from "@/lib/grocery";

export function GroceryClient({ weekKey, initialItems }: { weekKey: string; initialItems: GroceryItem[] }) {
  const [items, setItems] = useState<GroceryItem[]>(initialItems);
  const [newName, setNewName] = useState("");
  const [newStore, setNewStore] = useState<Store>("Costco");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyFailedKey, setCopyFailedKey] = useState<string | null>(null);

  function formatItemLine(item: GroceryItem): string {
    return item.note ? `${item.name} (${item.note})` : item.name;
  }

  function showCopied(key: string) {
    setCopyFailedKey(null);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
  }

  function fallbackCopy(text: string, key: string) {
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
      if (ok) {
        showCopied(key);
      } else {
        setCopyFailedKey(key);
      }
    } catch {
      setCopyFailedKey(key);
    }
  }

  function copyText(text: string, key: string) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showCopied(key),
        () => fallbackCopy(text, key),
      );
    } else {
      fallbackCopy(text, key);
    }
  }

  function copyStoreList(store: string, storeItems: GroceryItem[]) {
    copyText(storeItems.map(formatItemLine).join("\n"), store);
  }

  function copyAllLists() {
    const text = groups.map(({ store, items: si }) => `${store}\n${si.map(formatItemLine).join("\n")}`).join("\n\n");
    copyText(text, "all");
  }

  async function persist(next: GroceryItem[]) {
    setItems(next);
    await fetch("/api/grocery", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekKey, items: next }),
    });
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    const res = await fetch("/api/grocery/add-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekKey, name: newName.trim(), store: newStore }),
    });
    if (res.ok) {
      const list = await res.json();
      setItems(list.items);
      setNewName("");
    }
  }

  function updateStore(id: string, store: string) {
    persist(items.map((item) => (item.id === id ? { ...item, store } : item)));
  }

  function deleteItem(id: string) {
    persist(items.filter((item) => item.id !== id));
  }

  const groups = STORES.map((store) => ({ store, items: items.filter((i) => i.store === store) })).filter(
    (g) => g.items.length > 0,
  );

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

      {groups.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyAllLists}
            className="min-h-[44px] rounded-md border border-cocoa/40 px-3 text-sm text-ink"
          >
            {copiedKey === "all" ? "Copied!" : "Copy full list"}
          </button>
          <p className="text-xs text-cocoa">
            {copyFailedKey === "all"
              ? "Couldn't copy automatically — select the list text manually."
              : "Paste into Instacart or your store's pickup app to search each item."}
          </p>
        </div>
      )}

      <div className="card flex flex-wrap items-center gap-2 p-3">
        <div className="relative flex-1 min-w-[140px]">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add an item…"
            className="min-h-[44px] w-full rounded-md border border-cocoa/40 bg-white px-2 text-sm"
          />
        </div>
        <select
          value={newStore}
          onChange={(e) => setNewStore(e.target.value as Store)}
          className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-2 text-sm"
        >
          {STORES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="min-h-[44px] rounded-md bg-sage px-3 text-sm font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-cocoa">
          No items on the list yet. Add items above, or go to{" "}
          <Link href="/plan" className="underline">
            Plan
          </Link>{" "}
          and add a recipe&apos;s ingredients to this week&apos;s list.
        </p>
      )}

      {groups.map(({ store, items: storeItems }) => (
        <div key={store} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl text-brick">{store}</h2>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => copyStoreList(store, storeItems)}
                className="min-h-[44px] rounded-md border border-cocoa/40 px-3 text-sm"
              >
                {copiedKey === store ? "Copied!" : "Copy list"}
              </button>
            </div>
          </div>
          {copyFailedKey === store && (
            <p className="text-xs text-brick">Couldn&apos;t copy automatically — select the list text manually.</p>
          )}
          <ul className="flex flex-col divide-y divide-cocoa/20 rounded-md border border-cocoa/30 bg-white">
            {storeItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 p-3">
                <span className="text-ink">
                  {item.name}
                  {item.note && <span className="text-cocoa"> — {item.note}</span>}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={item.store}
                    onChange={(e) => updateStore(item.id, e.target.value)}
                    className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-2 text-xs"
                  >
                    {STORES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="min-h-[44px] rounded-md border border-brick/50 px-2 text-xs text-brick"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
