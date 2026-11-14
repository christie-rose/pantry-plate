"use client";

import { useState } from "react";
import { RiArrowLeftSLine } from "@remixicon/react";
import { MenuItem } from "@/ui";
import {
  DAYS,
  DAY_NAMES,
  defaultDinners,
  defaultWeeklyMeals,
  formatDayDate,
  mondayKeyFor,
  type Day,
} from "@/lib/weekplan";

/** The day list shown inside a recipe's actions menu: today and the next 7 days. Adds the recipe as a dinner on that day of the plan. */
export function AddToDayMenu({
  recipe,
  onBack,
  onDone,
}: {
  recipe: { id: string; title: string; servings: number };
  onBack: () => void;
  onDone: () => void;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Today and the next 7 days; a run that crosses a Sunday lands in next week's plan.
  const days = Array.from({ length: 8 }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const dayIndex = (date.getDay() + 6) % 7;
    return {
      offset,
      dayIndex,
      day: DAYS[dayIndex],
      weekKey: mondayKeyFor(date),
    };
  });

  async function add(day: Day, dayIndex: number, weekKey: string) {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/weekplan?weekKey=${weekKey}`);
      if (!res.ok) throw new Error();
      const plan = await res.json();
      const dinners = { ...defaultDinners(), ...(plan.dinners ?? {}) };
      dinners[day] = [
        ...dinners[day],
        {
          id: crypto.randomUUID(),
          type: "recipe",
          recipeId: recipe.id,
          label: recipe.title,
          servings: recipe.servings,
        },
      ];
      const save = await fetch("/api/weekplan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekKey,
          dinners,
          weeklyMeals: { ...defaultWeeklyMeals(), ...(plan.weeklyMeals ?? {}) },
        }),
      });
      if (!save.ok) throw new Error();
      setStatus(
        `Added to ${DAY_NAMES[day]} (${formatDayDate(weekKey, dayIndex)})`,
      );
      setTimeout(onDone, 900);
    } catch {
      setStatus("Couldn't add it. Try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 px-1 py-1 text-left text-cocoa"
      >
        <RiArrowLeftSLine size={16} aria-hidden />
        Add to meal plan
      </button>
      {days.map(({ offset, dayIndex, day, weekKey }) => (
        <MenuItem
          key={offset}
          tone="ink"
          disabled={busy}
          onClick={() => add(day, dayIndex, weekKey)}
          className="justify-between"
        >
          <span>
            {offset === 0 ? `Today · ${DAY_NAMES[day]}` : DAY_NAMES[day]}
          </span>
          <span className="text-cocoa">{formatDayDate(weekKey, dayIndex)}</span>
        </MenuItem>
      ))}
      {status && (
        <p role="status" className="px-2 text-cocoa">
          {status}
        </p>
      )}
    </>
  );
}
