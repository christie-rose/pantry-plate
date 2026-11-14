"use client";

import { useEffect, useState } from "react";
import { RiAddLine, RiArrowLeftSLine } from "@remixicon/react";
import { MenuItem } from "@/ui";

type MenuOption = { id: string; title: string; startDate: string | null };

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

/** The list shown inside a recipe's actions menu: pick a menu to add the recipe to, or start a new one. */
export function AddToMenuMenu({
  recipe,
  onBack,
  onDone,
}: {
  recipe: { id: string; title: string; servings: number };
  onBack: () => void;
  onDone: () => void;
}) {
  const [menus, setMenus] = useState<MenuOption[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/menus")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((list: MenuOption[]) => !cancelled && setMenus(list))
      .catch(() => !cancelled && setStatus("Couldn't load your menus."));
    return () => {
      cancelled = true;
    };
  }, []);

  async function addTo(menuId: string, name: string) {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/menus/${menuId}/add-recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe.id, servings: recipe.servings }),
      });
      if (!res.ok) throw new Error();
      setStatus(`Added to ${name}`);
      setTimeout(onDone, 900);
    } catch {
      setStatus("Couldn't add it. Try again.");
      setBusy(false);
    }
  }

  async function addToNew() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      const menu = await res.json();
      await addTo(menu.id, menu.title);
    } catch {
      setStatus("Couldn't create a menu. Try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={onBack} className="flex items-center gap-1 px-1 py-1 text-left text-cocoa">
        <RiArrowLeftSLine size={16} aria-hidden />
        Add to a menu
      </button>
      <MenuItem tone="ink" icon={<RiAddLine size={16} aria-hidden />} disabled={busy} onClick={addToNew}>
        New menu
      </MenuItem>
      <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
        {menus === null && !status && <p className="px-2 text-cocoa">Loading…</p>}
        {menus?.length === 0 && <p className="px-2 text-cocoa">No menus yet.</p>}
        {menus?.map((menu) => (
          <MenuItem key={menu.id} tone="ink" disabled={busy} onClick={() => addTo(menu.id, menu.title)} className="justify-between">
            <span className="truncate">{menu.title}</span>
            {menu.startDate && <span className="shrink-0 text-cocoa">{shortDate(menu.startDate)}</span>}
          </MenuItem>
        ))}
      </div>
      {status && (
        <p role="status" className="px-2 text-cocoa">
          {status}
        </p>
      )}
    </>
  );
}
