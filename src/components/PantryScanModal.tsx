"use client";

import { useRef, useState } from "react";
import { RiCameraLine, RiCloseLine, RiUpload2Line } from "@remixicon/react";
import { LOCATIONS, STORES, type Location, type Store } from "@/lib/pantry";

type PantryItem = {
  id: string;
  name: string;
  location: string;
  preferredStore: string;
  isStaple: boolean;
  stapleStatus: string | null;
  quantity: string | null;
};

type ScanRow = {
  id: string;
  detectedName: string;
  detectedQuantity: string;
  matchedId: string; // "" means "add as new"
  quantity: string;
  name: string;
  location: Location;
  preferredStore: Store;
  isStaple: boolean;
};

function findMatch(name: string, items: PantryItem[]): PantryItem | undefined {
  const lower = name.toLowerCase();
  return items.find(
    (item) =>
      item.name.toLowerCase() === lower ||
      lower.includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(lower),
  );
}

export function PantryScanModal({ pantryItems, onDone, onClose }: { pantryItems: PantryItem[]; onDone: () => void; onClose: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ScanRow[] | null>(null);
  const [saving, setSaving] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setScanning(true);
    setError(null);

    const reader = new FileReader();
    const dataUrl: string = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const [, base64] = dataUrl.split(",");
    const mediaType = file.type || "image/jpeg";

    const res = await fetch("/api/pantry/scan-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64, mediaType }),
    });

    setScanning(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not read that photo");
      return;
    }

    const { items } = (await res.json()) as { items: { name: string; quantity: string }[] };
    if (items.length === 0) {
      setError("Didn't spot any items in that photo — try another one.");
      return;
    }

    setRows(
      items.map((item) => {
        const match = findMatch(item.name, pantryItems);
        return {
          id: crypto.randomUUID(),
          detectedName: item.name,
          detectedQuantity: item.quantity,
          matchedId: match?.id ?? "",
          quantity: item.quantity,
          name: item.name,
          location: (match?.location as Location) ?? "Pantry",
          preferredStore: (match?.preferredStore as Store) ?? "Costco",
          isStaple: match?.isStaple ?? false,
        };
      }),
    );
  }

  function updateRow(id: string, patch: Partial<ScanRow>) {
    setRows((prev) => prev && prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev && prev.filter((r) => r.id !== id));
  }

  async function handleSaveAll() {
    if (!rows) return;
    setSaving(true);

    for (const row of rows) {
      if (row.matchedId) {
        const matched = pantryItems.find((p) => p.id === row.matchedId);
        if (!matched) continue;
        await fetch(`/api/pantry/${matched.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: matched.name,
            location: matched.location,
            preferredStore: matched.preferredStore,
            isStaple: matched.isStaple,
            stapleStatus: matched.isStaple ? "In stock" : null,
            quantity: matched.isStaple ? null : row.quantity || null,
          }),
        });
      } else {
        if (!row.name.trim()) continue;
        await fetch("/api/pantry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.name.trim(),
            location: row.location,
            preferredStore: row.preferredStore,
            isStaple: row.isStaple,
            stapleStatus: row.isStaple ? "In stock" : null,
            quantity: row.isStaple ? null : row.quantity || null,
          }),
        });
      }
    }

    setSaving(false);
    onDone();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col gap-3 rounded-lg bg-white p-4 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-brick">Scan pantry photo</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-md text-cocoa hover:bg-paper-alt">
            <RiCloseLine size={20} aria-hidden />
          </button>
        </div>

        {!rows && (
          <>
            <p className="text-sm text-cocoa">
              Take or upload a photo of your fridge, freezer, or pantry shelf, and we&apos;ll pick out the
              items and quantities.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={scanning}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md border border-cocoa/40 px-3 py-2 text-sm disabled:opacity-50"
              >
                <RiCameraLine size={18} aria-hidden />
                Take photo
              </button>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                disabled={scanning}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md border border-cocoa/40 px-3 py-2 text-sm disabled:opacity-50"
              >
                <RiUpload2Line size={18} aria-hidden />
                Upload photo
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
            </div>
            {scanning && <p className="text-sm text-cocoa">Reading photo…</p>}
            {error && <p className="text-sm text-brick">{error}</p>}
          </>
        )}

        {rows && (
          <>
            <p className="text-sm text-cocoa">
              Review what we found, then save. Items that matched your pantry will be updated; anything
              new can be added.
            </p>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
              {rows.map((row) => {
                const matched = row.matchedId ? pantryItems.find((p) => p.id === row.matchedId) : undefined;
                return (
                  <div key={row.id} className="flex flex-col gap-2 rounded-md border border-cocoa/20 p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-ink">{row.detectedName}</p>
                        <p className="text-xs text-cocoa">Photo: {row.detectedQuantity || "—"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        aria-label="Skip this item"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-brick hover:bg-brick/10"
                      >
                        <RiCloseLine size={16} aria-hidden />
                      </button>
                    </div>

                    <select
                      value={row.matchedId}
                      onChange={(e) => {
                        const matchedItem = pantryItems.find((p) => p.id === e.target.value);
                        updateRow(row.id, {
                          matchedId: e.target.value,
                          isStaple: matchedItem?.isStaple ?? row.isStaple,
                        });
                      }}
                      className="min-h-[40px] rounded-md border border-cocoa/40 bg-white px-2 text-sm text-ink"
                    >
                      <option value="">Add as new item</option>
                      {pantryItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>

                    {matched ? (
                      matched.isStaple ? (
                        <p className="text-xs text-cocoa">Will mark &quot;{matched.name}&quot; as In stock.</p>
                      ) : (
                        <input
                          value={row.quantity}
                          onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                          placeholder="Quantity"
                          className="min-h-[40px] rounded-md border border-cocoa/40 bg-white px-2 text-sm text-ink"
                        />
                      )
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <input
                          value={row.name}
                          onChange={(e) => updateRow(row.id, { name: e.target.value })}
                          placeholder="Item name"
                          className="min-h-[40px] flex-1 rounded-md border border-cocoa/40 bg-white px-2 text-sm text-ink"
                        />
                        <select
                          value={row.location}
                          onChange={(e) => updateRow(row.id, { location: e.target.value as Location })}
                          className="min-h-[40px] rounded-md border border-cocoa/40 bg-white px-2 text-sm text-ink"
                        >
                          {LOCATIONS.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                        <select
                          value={row.preferredStore}
                          onChange={(e) => updateRow(row.id, { preferredStore: e.target.value as Store })}
                          className="min-h-[40px] rounded-md border border-cocoa/40 bg-white px-2 text-sm text-ink"
                        >
                          {STORES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <label className="flex min-h-[40px] items-center gap-2 rounded-md border border-cocoa/40 px-2 text-sm text-ink">
                          <input
                            type="checkbox"
                            checked={row.isStaple}
                            onChange={(e) => updateRow(row.id, { isStaple: e.target.checked })}
                          />
                          Staple
                        </label>
                        {!row.isStaple && (
                          <input
                            value={row.quantity}
                            onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                            placeholder="Quantity"
                            className="min-h-[40px] flex-1 rounded-md border border-cocoa/40 bg-white px-2 text-sm text-ink"
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {rows.length === 0 && <p className="text-sm text-cocoa">No items left to save.</p>}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving || rows.length === 0}
                className="min-h-[44px] rounded-md bg-brick px-4 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save to pantry"}
              </button>
              <button
                type="button"
                onClick={() => setRows(null)}
                className="min-h-[44px] rounded-md border border-cocoa/40 px-4 text-sm"
              >
                Scan another photo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
