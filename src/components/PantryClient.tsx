"use client";

import { useEffect, useMemo, useState } from "react";
import { LOCATIONS, STORES, STAPLE_STATUSES, type Location, type Store, type StapleStatus } from "@/lib/pantry";
import { VoiceButton } from "./VoiceButton";

type PantryItem = {
  id: string;
  name: string;
  location: string;
  preferredStore: string;
  isStaple: boolean;
  stapleStatus: string | null;
  quantity: string | null;
};

type FormState = {
  name: string;
  location: Location;
  preferredStore: Store;
  isStaple: boolean;
  stapleStatus: StapleStatus;
  quantity: string;
};

const emptyForm: FormState = {
  name: "",
  location: "Pantry",
  preferredStore: "Costco",
  isStaple: false,
  stapleStatus: "In stock",
  quantity: "",
};

export function PantryClient({ initialItems }: { initialItems: PantryItem[] }) {
  const [items, setItems] = useState<PantryItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [stapleFilter, setStapleFilter] = useState("");
  const [sort, setSort] = useState<"name" | "updatedAt">("name");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (locationFilter) params.set("location", locationFilter);
    if (storeFilter) params.set("store", storeFilter);
    if (stapleFilter) params.set("stapleStatus", stapleFilter);
    params.set("sort", sort);
    return params.toString();
  }, [search, locationFilter, storeFilter, stapleFilter, sort]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/pantry?${queryString}`, { signal: controller.signal })
      .then((res) => res.json())
      .then(setItems)
      .catch(() => {});
    return () => controller.abort();
  }, [queryString]);

  async function refresh() {
    const res = await fetch(`/api/pantry?${queryString}`);
    setItems(await res.json());
  }

  function toInput(f: FormState) {
    return {
      name: f.name,
      location: f.location,
      preferredStore: f.preferredStore,
      isStaple: f.isStaple,
      stapleStatus: f.isStaple ? f.stapleStatus : null,
      quantity: f.isStaple ? null : f.quantity,
    };
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toInput(form)),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add item");
      return;
    }

    setForm(emptyForm);
    await refresh();
  }

  async function handleVoiceTranscript(transcript: string) {
    const res = await fetch("/api/voice/parse-pantry-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    if (!res.ok) return;
    const parsed = await res.json();
    setForm((f) => ({
      ...f,
      name: parsed.name ?? transcript,
      quantity: parsed.quantity ?? f.quantity,
    }));
  }

  function startEdit(item: PantryItem) {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      location: item.location as Location,
      preferredStore: item.preferredStore as Store,
      isStaple: item.isStaple,
      stapleStatus: (item.stapleStatus as StapleStatus) ?? "In stock",
      quantity: item.quantity ?? "",
    });
  }

  async function handleSaveEdit(id: string) {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/pantry/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toInput(editForm)),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save item");
      return;
    }

    setEditingId(null);
    await refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/pantry/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 pb-24">
      <h1 className="text-3xl text-brick">Pantry</h1>

      <form onSubmit={handleAdd} className="card flex flex-col gap-3 p-4">
        <div className="flex gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Add an item…"
            className="min-h-[44px] flex-1 rounded-md border border-cocoa/40 bg-white px-3 py-2 text-ink outline-none focus:border-brick"
          />
          <VoiceButton onTranscript={handleVoiceTranscript} />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value as Location }))}
            className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-2 py-2 text-sm text-ink"
          >
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <select
            value={form.preferredStore}
            onChange={(e) => setForm((f) => ({ ...f, preferredStore: e.target.value as Store }))}
            className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-2 py-2 text-sm text-ink"
          >
            {STORES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <label className="min-h-[44px] flex items-center gap-2 rounded-md border border-cocoa/40 bg-white px-2 py-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.isStaple}
              onChange={(e) => setForm((f) => ({ ...f, isStaple: e.target.checked }))}
            />
            Staple
          </label>

          {form.isStaple ? (
            <select
              value={form.stapleStatus}
              onChange={(e) => setForm((f) => ({ ...f, stapleStatus: e.target.value as StapleStatus }))}
              className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-2 py-2 text-sm text-ink"
            >
              {STAPLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              placeholder="Quantity (e.g. 2 lb)"
              className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-2 py-2 text-sm text-ink"
            />
          )}
        </div>

        {error && <p className="text-sm text-brick">{error}</p>}

        <button
          type="submit"
          disabled={loading || !form.name.trim()}
          className="min-h-[44px] self-start rounded-md bg-brick px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Add item
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pantry…"
          className="min-h-[44px] flex-1 min-w-[140px] rounded-md border border-cocoa/40 bg-white px-3 py-2 text-sm text-ink"
        />
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-2 py-2 text-sm text-ink"
        >
          <option value="">All locations</option>
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-2 py-2 text-sm text-ink"
        >
          <option value="">All stores</option>
          {STORES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={stapleFilter}
          onChange={(e) => setStapleFilter(e.target.value)}
          className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-2 py-2 text-sm text-ink"
        >
          <option value="">Any staple status</option>
          {STAPLE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "name" | "updatedAt")}
          className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-2 py-2 text-sm text-ink"
        >
          <option value="name">Sort: A–Z</option>
          <option value="updatedAt">Sort: Recently updated</option>
        </select>
      </div>

      <ul className="flex flex-col divide-y divide-cocoa/20 rounded-md border border-cocoa/30 bg-white">
        {items.length === 0 && (
          <li className="p-4 text-sm text-cocoa">No pantry items match.</li>
        )}
        {items.map((item) => (
          <li key={item.id} className="p-3">
            {editingId === item.id ? (
              <div className="flex flex-col gap-2">
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded-md border border-cocoa/40 px-2 py-1 text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  <select
                    value={editForm.location}
                    onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value as Location }))}
                    className="rounded-md border border-cocoa/40 px-2 py-1 text-sm"
                  >
                    {LOCATIONS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <select
                    value={editForm.preferredStore}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, preferredStore: e.target.value as Store }))
                    }
                    className="rounded-md border border-cocoa/40 px-2 py-1 text-sm"
                  >
                    {STORES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={editForm.isStaple}
                      onChange={(e) => setEditForm((f) => ({ ...f, isStaple: e.target.checked }))}
                    />
                    Staple
                  </label>
                  {editForm.isStaple ? (
                    <select
                      value={editForm.stapleStatus}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, stapleStatus: e.target.value as StapleStatus }))
                      }
                      className="rounded-md border border-cocoa/40 px-2 py-1 text-sm"
                    >
                      {STAPLE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={editForm.quantity}
                      onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
                      placeholder="Quantity"
                      className="rounded-md border border-cocoa/40 px-2 py-1 text-sm"
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(item.id)}
                    disabled={loading}
                    className="rounded-md bg-sage px-3 py-1 text-sm text-white"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-md border border-cocoa/40 px-3 py-1 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-cocoa">
                    {item.location} · {item.preferredStore} ·{" "}
                    {item.isStaple ? item.stapleStatus : item.quantity || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="min-h-[44px] rounded-md border border-cocoa/40 px-3 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="min-h-[44px] rounded-md border border-brick/50 px-3 text-xs text-brick"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
