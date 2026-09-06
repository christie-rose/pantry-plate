"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STORES, type Store } from "@/lib/pantry";
import { addDaysToKey, formatWeekLabel } from "@/lib/weekplan";
import type { GroceryItem } from "@/lib/grocery";

type PantryMatch = { id: string; name: string; preferredStore: string };

export function GroceryClient({ weekKey, initialItems }: { weekKey: string; initialItems: GroceryItem[] }) {
  const [items, setItems] = useState<GroceryItem[]>(initialItems);
  const [newName, setNewName] = useState("");
  const [newStore, setNewStore] = useState<Store>("Costco");
  const [matches, setMatches] = useState<PantryMatch[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const query = newName.trim();
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      if (!query) {
        setMatches([]);
        return;
      }
      fetch(`/api/pantry?search=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((results: PantryMatch[]) => setMatches(results.slice(0, 6)))
        .catch(() => {});
    }, 150);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [newName]);

  async function persist(next: GroceryItem[]) {
    setItems(next);
    await fetch("/api/grocery", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekKey, items: next }),
    });
  }

  function selectMatch(match: PantryMatch) {
    setNewName(match.name);
    setNewStore(match.preferredStore as Store);
    setMatches([]);
    setShowSuggestions(false);
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
      setMatches([]);
      setShowSuggestions(false);
    }
  }

  function updateStore(id: string, store: string) {
    persist(items.map((item) => (item.id === id ? { ...item, store } : item)));
  }

  function markShopped(id: string) {
    persist(items.filter((item) => item.id !== id));
  }

  function deleteItem(id: string) {
    persist(items.filter((item) => item.id !== id));
  }

  function markStoreShopped(store: string) {
    persist(items.filter((item) => item.store !== store));
  }

  const groups = STORES.map((store) => ({ store, items: items.filter((i) => i.store === store) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 pb-24">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl text-brick">Grocery</h1>
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

      <div className="card flex flex-wrap items-center gap-2 p-3">
        <div className="relative flex-1 min-w-[140px]">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Add an item…"
            className="min-h-[44px] w-full rounded-md border border-cocoa/40 bg-white px-2 text-sm"
          />
          {showSuggestions && matches.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded-md border border-cocoa/40 bg-white text-sm shadow-md">
              {matches.map((match) => (
                <li key={match.id}>
                  <button
                    type="button"
                    onMouseDown={() => selectMatch(match)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-paper-alt"
                  >
                    <span className="text-ink">{match.name}</span>
                    <span className="text-xs text-cocoa">In pantry · {match.preferredStore}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
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
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-brick">{store}</h2>
            <button
              type="button"
              onClick={() => markStoreShopped(store)}
              className="min-h-[44px] rounded-md border border-cocoa/40 px-3 text-sm"
            >
              Mark all shopped
            </button>
          </div>
          <ul className="flex flex-col divide-y divide-cocoa/20 rounded-md border border-cocoa/30 bg-white">
            {storeItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 p-3">
                <span className="text-ink">{item.name}</span>
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
                    onClick={() => markShopped(item.id)}
                    className="min-h-[44px] rounded-md bg-sage px-2 text-xs text-white"
                  >
                    Shopped
                  </button>
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
