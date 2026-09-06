"use client";

import { useState } from "react";
import Link from "next/link";
import { RiCloseLine, RiShoppingCartLine, RiSparklingLine } from "@remixicon/react";
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
  const [savedPlan, setSavedPlan] = useState<Plan>(initialPlan);
  const [isDraft, setIsDraft] = useState(false);
  const [recipeOptions, setRecipeOptions] = useState(recipes);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [respectDietary, setRespectDietary] = useState(true);
  const [includePrepAhead, setIncludePrepAhead] = useState(false);
  const [groceryStatus, setGroceryStatus] = useState<Record<string, string>>({});
  const [addingToGrocery, setAddingToGrocery] = useState<string | null>(null);

  async function persist(next: Plan) {
    setPlan(next);
    if (isDraft) return; // draft edits stay local until explicitly saved
    setSaving(true);
    await fetch("/api/weekplan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSavedPlan(next);
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

  function updateDinnerServings(day: Day, id: string, servings: number) {
    persist({
      ...plan,
      dinners: {
        ...plan.dinners,
        [day]: plan.dinners[day].map((e) => (e.id === id ? { ...e, servings } : e)),
      },
    });
  }

  function updateWeeklyServings(mealType: WeeklyMealType, id: string, servings: number) {
    persist({
      ...plan,
      weeklyMeals: {
        ...plan.weeklyMeals,
        [mealType]: plan.weeklyMeals[mealType].map((e) => (e.id === id ? { ...e, servings } : e)),
      },
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);

    const res = await fetch("/api/weekplan/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayTags: plan.dayTags, respectDietary, includePrepAhead }),
    });

    setGenerating(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setGenerateError(data.error ?? "Could not generate a weekly plan");
      return;
    }

    const { dinners } = await res.json();
    setPlan({ ...plan, dinners });
    setIsDraft(true);

    const recipesRes = await fetch("/api/recipes");
    if (recipesRes.ok) setRecipeOptions(await recipesRes.json());
  }

  async function handleSaveDraft() {
    setSaving(true);
    await fetch("/api/weekplan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    });
    setSavedPlan(plan);
    setIsDraft(false);
    setSaving(false);
  }

  function handleDiscardDraft() {
    setPlan(savedPlan);
    setIsDraft(false);
  }

  async function handleAddToGrocery(entry: MealEntry) {
    if (entry.type !== "recipe" || !entry.recipeId) return;

    setAddingToGrocery(entry.id);
    setGroceryStatus((prev) => ({ ...prev, [entry.id]: "" }));

    const res = await fetch("/api/grocery/add-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekKey: plan.weekKey, recipeId: entry.recipeId, servings: entry.servings }),
    });

    setAddingToGrocery(null);

    if (!res.ok) {
      setGroceryStatus((prev) => ({ ...prev, [entry.id]: "Could not add to grocery list" }));
      return;
    }

    const { added } = await res.json();
    const message: string =
      added.length > 0 ? `Added ${added.length} item${added.length === 1 ? "" : "s"}` : "Already have everything";
    setGroceryStatus((prev) => ({ ...prev, [entry.id]: message }));
    setTimeout(() => {
      setGroceryStatus((prev) => {
        const next = { ...prev };
        delete next[entry.id];
        return next;
      });
    }, 4000);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 pb-24">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl text-brick">Plan</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/plan?week=${addDaysToKey(plan.weekKey, -7)}`} className="flex min-h-[44px] items-center rounded-md border border-cocoa/40 px-2">
            ← Prev
          </Link>
          <span className="font-medium text-ink">{formatWeekLabel(plan.weekKey)}</span>
          <Link href={`/plan?week=${addDaysToKey(plan.weekKey, 7)}`} className="flex min-h-[44px] items-center rounded-md border border-cocoa/40 px-2">
            Next →
          </Link>
        </div>
      </div>

      {!isDraft && (
        <div className="card flex flex-wrap items-center gap-3 p-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 rounded-md bg-brick px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {generating ? (
              "Planning…"
            ) : (
              <>
                <RiSparklingLine size={16} aria-hidden />
                Plan my week (AI)
              </>
            )}
          </button>
          <label className="flex items-center gap-1 text-xs text-cocoa">
            <input
              type="checkbox"
              checked={respectDietary}
              onChange={(e) => setRespectDietary(e.target.checked)}
            />
            Respect household restrictions
          </label>
          <label className="flex items-center gap-1 text-xs text-cocoa">
            <input
              type="checkbox"
              checked={includePrepAhead}
              onChange={(e) => setIncludePrepAhead(e.target.checked)}
            />
            Include prep-ahead steps
          </label>
          <span className="text-xs text-cocoa">Uses each day&apos;s tag below to plan dinners.</span>
        </div>
      )}
      {generateError && <p className="text-sm text-brick">{generateError}</p>}

      {isDraft && (
        <div className="card flex flex-wrap items-center gap-3 border-2 border-brick p-3">
          <span className="text-sm font-medium text-brick">AI draft — review and edit before saving</span>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="rounded-md bg-sage px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Save week plan
          </button>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="rounded-md border border-cocoa/40 px-3 py-1.5 text-sm"
          >
            Discard draft
          </button>
        </div>
      )}

      {saving && !isDraft && <p className="text-xs text-cocoa">Saving…</p>}

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
                <li key={entry.id} className="flex flex-col gap-0.5 rounded bg-paper-alt px-2 py-1 text-xs">
                  <div className="flex items-center justify-between">
                    {entry.type === "recipe" && entry.recipeId ? (
                      <Link
                        href={`/recipes/${entry.recipeId}${entry.servings ? `?servings=${entry.servings}` : ""}`}
                        className="underline"
                      >
                        {entry.label}
                      </Link>
                    ) : (
                      <span>{entry.label}</span>
                    )}
                    <div className="flex shrink-0 items-center gap-1.5">
                      {entry.type === "recipe" && entry.recipeId && (
                        <>
                          <input
                            type="number"
                            min={1}
                            value={entry.servings ?? ""}
                            onChange={(e) => updateDinnerServings(day, entry.id, Number(e.target.value))}
                            aria-label="Servings"
                            className="w-10 rounded border border-cocoa/40 bg-white px-1 py-0.5 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddToGrocery(entry)}
                            disabled={addingToGrocery === entry.id}
                            className="flex items-center text-sage disabled:opacity-50"
                            aria-label="Add to grocery list"
                            title="Add to grocery list"
                          >
                            <RiShoppingCartLine size={14} aria-hidden />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => removeDinner(day, entry.id)}
                        className="flex items-center text-brick"
                        aria-label="Remove entry"
                      >
                        <RiCloseLine size={14} aria-hidden />
                      </button>
                    </div>
                  </div>
                  {groceryStatus[entry.id] && <span className="text-cocoa">{groceryStatus[entry.id]}</span>}
                </li>
              ))}
            </ul>

            <MealEntryAdder recipes={recipeOptions} onAdd={(entry) => addDinner(day, entry)} />
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
                <li key={entry.id} className="flex flex-col gap-0.5 rounded bg-paper-alt px-2 py-1 text-xs">
                  <div className="flex items-center justify-between">
                    {entry.type === "recipe" && entry.recipeId ? (
                      <Link
                        href={`/recipes/${entry.recipeId}${entry.servings ? `?servings=${entry.servings}` : ""}`}
                        className="underline"
                      >
                        {entry.label}
                      </Link>
                    ) : (
                      <span>{entry.label}</span>
                    )}
                    <div className="flex shrink-0 items-center gap-1.5">
                      {entry.type === "recipe" && entry.recipeId && (
                        <>
                          <input
                            type="number"
                            min={1}
                            value={entry.servings ?? ""}
                            onChange={(e) => updateWeeklyServings(mealType, entry.id, Number(e.target.value))}
                            aria-label="Servings"
                            className="w-10 rounded border border-cocoa/40 bg-white px-1 py-0.5 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddToGrocery(entry)}
                            disabled={addingToGrocery === entry.id}
                            className="flex items-center text-sage disabled:opacity-50"
                            aria-label="Add to grocery list"
                            title="Add to grocery list"
                          >
                            <RiShoppingCartLine size={14} aria-hidden />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => removeWeekly(mealType, entry.id)}
                        className="flex items-center text-brick"
                        aria-label="Remove entry"
                      >
                        <RiCloseLine size={14} aria-hidden />
                      </button>
                    </div>
                  </div>
                  {groceryStatus[entry.id] && <span className="text-cocoa">{groceryStatus[entry.id]}</span>}
                </li>
              ))}
            </ul>
            <MealEntryAdder recipes={recipeOptions} onAdd={(entry) => addWeekly(mealType, entry)} />
          </div>
        ))}
      </div>
    </div>
  );
}
