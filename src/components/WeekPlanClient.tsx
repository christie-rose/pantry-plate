"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DAYS,
  DAY_TAGS,
  WEEKLY_MEAL_TYPES,
  addDaysToKey,
  formatWeekLabel,
  type Day,
  type DayTag,
  type DayTags,
  type Dinners,
  type MealEntry,
  type WeeklyMealType,
  type WeeklyMeals,
} from "@/lib/weekplan";
import { MealEntryAdder } from "@/components/MealEntryAdder";

type Recipe = { id: string; title: string; servings: number };

type Plan = {
  weekKey: string;
  dayTags: DayTags;
  dinners: Dinners;
  weeklyMeals: WeeklyMeals;
};

const WEEKLY_MEAL_LABELS: Record<WeeklyMealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
};

export function WeekPlanClient({ initialPlan, recipes }: { initialPlan: Plan; recipes: Recipe[] }) {
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [saving, setSaving] = useState(false);

  async function persist(next: Plan) {
    setPlan(next);
    setSaving(true);
    await fetch("/api/weekplan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaving(false);
  }

  function setDayTag(day: Day, tag: DayTag) {
    persist({ ...plan, dayTags: { ...plan.dayTags, [day]: tag } });
  }

  function addDinner(day: Day, entry: MealEntry) {
    persist({ ...plan, dinners: { ...plan.dinners, [day]: [...plan.dinners[day], entry] } });
  }

  function removeDinner(day: Day, id: string) {
    persist({ ...plan, dinners: { ...plan.dinners, [day]: plan.dinners[day].filter((e) => e.id !== id) } });
  }

  function addWeekly(mealType: WeeklyMealType, entry: MealEntry) {
    persist({ ...plan, weeklyMeals: { ...plan.weeklyMeals, [mealType]: [...plan.weeklyMeals[mealType], entry] } });
  }

  function removeWeekly(mealType: WeeklyMealType, id: string) {
    persist({
      ...plan,
      weeklyMeals: { ...plan.weeklyMeals, [mealType]: plan.weeklyMeals[mealType].filter((e) => e.id !== id) },
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-brick">Plan</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/plan?week=${addDaysToKey(plan.weekKey, -7)}`} className="rounded-md border border-cocoa/40 px-2 py-1">
            ← Prev
          </Link>
          <span className="font-medium text-ink">{formatWeekLabel(plan.weekKey)}</span>
          <Link href={`/plan?week=${addDaysToKey(plan.weekKey, 7)}`} className="rounded-md border border-cocoa/40 px-2 py-1">
            Next →
          </Link>
        </div>
      </div>

      {saving && <p className="text-xs text-cocoa">Saving…</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {DAYS.map((day) => (
          <div key={day} className="card flex flex-col gap-2 p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg text-ink">{day}</h3>
            </div>
            <select
              value={plan.dayTags[day]}
              onChange={(e) => setDayTag(day, e.target.value as DayTag)}
              className="rounded-md border border-cocoa/40 bg-white px-1 py-1 text-xs"
            >
              {DAY_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            <ul className="flex flex-col gap-1">
              {plan.dinners[day].map((entry) => (
                <li key={entry.id} className="flex items-center justify-between rounded bg-paper-alt px-2 py-1 text-xs">
                  <span>
                    {entry.label}
                    {entry.type === "recipe" && entry.servings ? ` (${entry.servings})` : ""}
                  </span>
                  <button type="button" onClick={() => removeDinner(day, entry.id)} className="text-brick">
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <MealEntryAdder recipes={recipes} onAdd={(entry) => addDinner(day, entry)} />
          </div>
        ))}
      </div>

      <h2 className="text-2xl text-brick">Breakfast / Lunch / Snack</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {WEEKLY_MEAL_TYPES.map((mealType) => (
          <div key={mealType} className="card flex flex-col gap-2 p-3">
            <h3 className="text-lg text-ink">{WEEKLY_MEAL_LABELS[mealType]}</h3>
            <ul className="flex flex-col gap-1">
              {plan.weeklyMeals[mealType].map((entry) => (
                <li key={entry.id} className="flex items-center justify-between rounded bg-paper-alt px-2 py-1 text-xs">
                  <span>
                    {entry.label}
                    {entry.type === "recipe" && entry.servings ? ` (${entry.servings})` : ""}
                  </span>
                  <button type="button" onClick={() => removeWeekly(mealType, entry.id)} className="text-brick">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <MealEntryAdder recipes={recipes} onAdd={(entry) => addWeekly(mealType, entry)} />
          </div>
        ))}
      </div>
    </div>
  );
}
