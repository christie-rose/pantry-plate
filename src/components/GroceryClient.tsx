"use client";

import { useState } from "react";
import Link from "next/link";
import { STORES, type Store } from "@/lib/pantry";
import { addDaysToKey, formatWeekLabel } from "@/lib/weekplan";
import type { GroceryItem } from "@/lib/grocery";

export function GroceryClient({ weekKey, initialItems }: { weekKey: string; initialItems: GroceryItem[] }) {
  const [items, setItems] = useState<GroceryItem[]>(initialItems);
  const [generating, setGenerating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStore, setNewStore] = useState<Store>("Costco");

  async function persist(next: GroceryItem[]) {
    setItems(next);
    await fetch("/api/grocery", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekKey, items: next }),
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch("/api/grocery/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekKey }),
    });
    setGenerating(false);
    if (res.ok) {
      const list = await res.json();
      setItems(list.items);
    }
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

  function markShopped(id: string) {
    persist(items.filter((item) => item.id !== id));
  }

  function deleteItem(id: string) {
    persist(items.filter((item) => item.id !== id));
  }

  function markAllShopped() {
    persist([]);
  }

  const groups = STORES.map((store) => ({ store, items: items.filter((i) => i.store === store) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-brick">Grocery</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/grocery?week=${addDaysToKey(weekKey, -7)}`} className="rounded-md border border-cocoa/40 px-2 py-1">
            ← Prev
          </Link>
          <span className="font-medium text-ink">{formatWeekLabel(weekKey)}</span>
          <Link href={`/grocery?week=${addDaysToKey(weekKey, 7)}`} className="rounded-md border border-cocoa/40 px-2 py-1">
            Next →
          </Link>
        </div>
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-md bg-brick px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate from this week's plan"}
        </button>
        {items.length > 0 && (
          <button
            type="button"
            onClick={markAllShopped}
            className="rounded-md border border-cocoa/40 px-3 py-1.5 text-sm"
          >
            Mark all shopped
          </button>
        )}
      </div>

      <div className="card flex flex-wrap items-center gap-2 p-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add an item…"
          className="flex-1 rounded-md border border-cocoa/40 bg-white px-2 py-1.5 text-sm"
        />
        <select
          value={newStore}
          onChange={(e) => setNewStore(e.target.value as Store)}
          className="rounded-md border border-cocoa/40 bg-white px-2 py-1.5 text-sm"
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
          className="rounded-md bg-sage px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {groups.length === 0 && <p className="text-sm text-cocoa">No items on the list yet.</p>}

      {groups.map(({ store, items: storeItems }) => (
        <div key={store} className="flex flex-col gap-2">
          <h2 className="text-xl text-brick">{store}</h2>
          <ul className="flex flex-col divide-y divide-cocoa/20 rounded-md border border-cocoa/30 bg-white">
            {storeItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 p-3">
                <span className="text-ink">{item.name}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={item.store}
                    onChange={(e) => updateStore(item.id, e.target.value)}
                    className="rounded-md border border-cocoa/40 bg-white px-2 py-1 text-xs"
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
                    className="rounded-md bg-sage px-2 py-1 text-xs text-white"
                  >
                    Shopped
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="rounded-md border border-brick/50 px-2 py-1 text-xs text-brick"
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
