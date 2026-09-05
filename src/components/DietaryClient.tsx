"use client";

import { useState } from "react";
import { DIETARY_CATEGORIES, type DietaryCategory } from "@/lib/dietary";

type DietaryEntry = {
  id: string;
  name: string;
  category: string;
  detail: string | null;
};

export function DietaryClient({ initialEntries }: { initialEntries: DietaryEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DietaryCategory>("Allergy");
  const [detail, setDetail] = useState("");

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    const res = await fetch("/api/dietary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, detail: detail || null }),
    });

    if (res.ok) {
      const created = await res.json();
      setEntries((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setDetail("");
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/dietary/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 pb-24">
      <h1 className="text-3xl text-brick">Household dietary profile</h1>
      <p className="text-sm text-cocoa">
        Allergies, diets, dislikes, and preferences here inform AI recipe and meal-plan generation
        when you choose to respect household restrictions.
      </p>

      <form onSubmit={handleAdd} className="card flex flex-wrap items-end gap-2 p-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-cocoa">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Peanuts, Vegetarian"
            className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-cocoa">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DietaryCategory)}
            className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-2 py-1.5 text-sm"
          >
            {DIETARY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm text-cocoa">Detail (optional)</label>
          <input
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="e.g. severe, avoid entirely"
            className="min-h-[44px] w-full rounded-md border border-cocoa/40 bg-white px-2 py-1.5 text-sm"
          />
        </div>
        <button type="submit" className="min-h-[44px] rounded-md bg-brick px-3 py-1.5 text-sm font-medium text-white">
          Add
        </button>
      </form>

      <ul className="flex flex-col divide-y divide-cocoa/20 rounded-md border border-cocoa/30 bg-white">
        {entries.length === 0 && <li className="p-4 text-sm text-cocoa">No dietary entries yet.</li>}
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium text-ink">{entry.name}</p>
              <p className="text-xs text-cocoa">
                {entry.category}
                {entry.detail ? ` · ${entry.detail}` : ""}
              </p>
            </div>
            <button
              onClick={() => handleDelete(entry.id)}
              className="min-h-[44px] rounded-md border border-brick/50 px-3 py-1 text-xs text-brick"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
