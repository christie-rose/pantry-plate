"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiDeleteBinLine, RiEdit2Line, RiFileCopyLine } from "@remixicon/react";
import { ActionsMenu, EmptyState, MenuItem, PageTitle } from "@/ui";

type MenuRow = { id: string; title: string; date: string | null; recipeCount: number };

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function MenusClient({ initialMenus }: { initialMenus: MenuRow[] }) {
  const router = useRouter();
  const [menus, setMenus] = useState(initialMenus);
  const [creating, setCreating] = useState(false);

  async function createMenu() {
    setCreating(true);
    const res = await fetch("/api/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => null);
    if (!res?.ok) return setCreating(false);
    const menu = await res.json();
    router.push(`/menus/${menu.id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 pb-24">
      <div className="flex items-center justify-between">
        <PageTitle>Menus</PageTitle>
        <button
          type="button"
          onClick={createMenu}
          disabled={creating}
          className="flex min-h-[44px] items-center rounded-md bg-brick px-4 text-sm font-medium text-white disabled:opacity-50"
        >
          {creating ? "Creating…" : "New menu"}
        </button>
      </div>

      {menus.length === 0 ? (
        <EmptyState art="bowl" title="No menus yet">
          Create one for a week, a dinner party, or a holiday, then add headings, notes and recipes.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-4">
          {menus.map((menu) => (
            <li key={menu.id} className="card relative">
              <Link href={`/menus/${menu.id}`} className="flex flex-col gap-1 p-4 pr-14">
                <h2 className="font-title text-2xl leading-tight text-ink">{menu.title}</h2>
                <p className="text-xs text-cocoa">
                  {menu.date ? formatDate(menu.date) : "No date"} · {menu.recipeCount}{" "}
                  {menu.recipeCount === 1 ? "recipe" : "recipes"}
                </p>
              </Link>
              <div className="absolute right-3 top-3">
                <MenuRowActions
                  menu={menu}
                  onDeleted={(id) => setMenus((list) => list.filter((m) => m.id !== id))}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MenuRowActions({ menu, onDeleted }: { menu: MenuRow; onDeleted: (id: string) => void }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function duplicate() {
    setBusy(true);
    const res = await fetch(`/api/menus/${menu.id}/duplicate`, { method: "POST" }).catch(() => null);
    if (!res?.ok) return setBusy(false);
    const copy = await res.json();
    router.push(`/menus/${copy.id}`);
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/menus/${menu.id}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) onDeleted(menu.id);
    else setBusy(false);
  }

  return (
    <ActionsMenu label={`Actions for ${menu.title}`}>
      {(close) =>
        confirming ? (
          <div className="flex flex-col gap-2 p-1">
            <p className="text-sm text-ink">Delete “{menu.title}” for good? This can’t be undone.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  close();
                }}
                className="min-h-[40px] flex-1 rounded-md border border-cocoa/40 px-2 text-sm text-ink"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="min-h-[40px] flex-1 rounded-md bg-brick px-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {busy ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <MenuItem tone="ink" icon={<RiEdit2Line size={16} aria-hidden />} onClick={() => router.push(`/menus/${menu.id}`)}>
              Open
            </MenuItem>
            <MenuItem tone="ink" icon={<RiFileCopyLine size={16} aria-hidden />} onClick={duplicate} disabled={busy}>
              {busy ? "Duplicating…" : "Duplicate"}
            </MenuItem>
            <MenuItem tone="danger" icon={<RiDeleteBinLine size={16} aria-hidden />} onClick={() => setConfirming(true)}>
              Delete menu
            </MenuItem>
          </>
        )
      }
    </ActionsMenu>
  );
}
