"use client";

import { useState } from "react";
import Link from "next/link";
import { RiCheckLine, RiCloseLine, RiDraggable, RiShoppingCartLine, RiSparklingLine } from "@remixicon/react";
import {
  DAYS,
  DAY_TAGS,
  WEEKLY_MEAL_TYPES,
  addDaysToKey,
  formatDayDate,
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

export type PlanRecipeOption = {
  id: string;
  title: string;
  servings: number;
  prepAhead: string[];
  categories: string[];
  cuisine: string | null;
  ingredients: { name: string }[];
};
type Recipe = PlanRecipeOption;

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

type Location = { kind: "day"; day: Day } | { kind: "weekly"; mealType: WeeklyMealType };

function locationValue(loc: Location): string {
  return loc.kind === "day" ? `day:${loc.day}` : `weekly:${loc.mealType}`;
}

function parseLocationValue(value: string): Location | null {
  const [kind, key] = value.split(":");
  if (kind === "day") return { kind: "day", day: key as Day };
  if (kind === "weekly") return { kind: "weekly", mealType: key as WeeklyMealType };
  return null;
}

function sameLocation(a: Location, b: Location): boolean {
  return locationValue(a) === locationValue(b);
}

const ALL_LOCATIONS: Location[] = [
  ...DAYS.map((day): Location => ({ kind: "day", day })),
  ...WEEKLY_MEAL_TYPES.map((mealType): Location => ({ kind: "weekly", mealType })),
];

function locationLabel(loc: Location): string {
  return loc.kind === "day" ? loc.day : WEEKLY_MEAL_LABELS[loc.mealType];
}

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
  const [draggedFrom, setDraggedFrom] = useState<{ location: Location; entryId: string } | null>(null);
  const [dragOverLocation, setDragOverLocation] = useState<Location | null>(null);
  const [checkedPrepSteps, setCheckedPrepSteps] = useState<Set<string>>(new Set());

  function togglePrepStep(key: string) {
    setCheckedPrepSteps((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

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

  function getEntries(loc: Location): MealEntry[] {
    return loc.kind === "day" ? plan.dinners[loc.day] : plan.weeklyMeals[loc.mealType];
  }

  function moveEntry(from: Location, to: Location, entryId: string) {
    if (sameLocation(from, to)) return;
    const entry = getEntries(from).find((e) => e.id === entryId);
    if (!entry) return;

    const nextDinners = { ...plan.dinners };
    const nextWeekly = { ...plan.weeklyMeals };

    if (from.kind === "day") nextDinners[from.day] = nextDinners[from.day].filter((e) => e.id !== entryId);
    else nextWeekly[from.mealType] = nextWeekly[from.mealType].filter((e) => e.id !== entryId);

    if (to.kind === "day") nextDinners[to.day] = [...nextDinners[to.day], entry];
    else nextWeekly[to.mealType] = [...nextWeekly[to.mealType], entry];

    persist({ ...plan, dinners: nextDinners, weeklyMeals: nextWeekly });
  }

  function handleDragStart(location: Location, entryId: string) {
    setDraggedFrom({ location, entryId });
  }

  function handleDragEnd() {
    setDraggedFrom(null);
    setDragOverLocation(null);
  }

  function handleDropOnLocation(location: Location) {
    if (draggedFrom) moveEntry(draggedFrom.location, location, draggedFrom.entryId);
    setDraggedFrom(null);
    setDragOverLocation(null);
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

  const recipeById = new Map(recipeOptions.map((r) => [r.id, r]));
  const usageByRecipeId = new Map<string, Set<string>>();
  for (const day of DAYS) {
    for (const entry of plan.dinners[day]) {
      if (entry.type === "recipe" && entry.recipeId) {
        if (!usageByRecipeId.has(entry.recipeId)) usageByRecipeId.set(entry.recipeId, new Set());
        usageByRecipeId.get(entry.recipeId)!.add(day);
      }
    }
  }
  for (const mealType of WEEKLY_MEAL_TYPES) {
    for (const entry of plan.weeklyMeals[mealType]) {
      if (entry.type === "recipe" && entry.recipeId) {
        if (!usageByRecipeId.has(entry.recipeId)) usageByRecipeId.set(entry.recipeId, new Set());
        usageByRecipeId.get(entry.recipeId)!.add(WEEKLY_MEAL_LABELS[mealType]);
      }
    }
  }
  const prepRecipes = Array.from(usageByRecipeId.keys())
    .map((id) => recipeById.get(id))
    .filter((r): r is Recipe => Boolean(r && r.prepAhead.length > 0));

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
        {DAYS.map((day, dayIndex) => {
          const location: Location = { kind: "day", day };
          return (
          <div
            key={day}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverLocation(location);
            }}
            onDragLeave={() => setDragOverLocation((prev) => (prev && sameLocation(prev, location) ? null : prev))}
            onDrop={(e) => {
              e.preventDefault();
              handleDropOnLocation(location);
            }}
            className={`card flex flex-col gap-2 p-3 ${dragOverLocation && sameLocation(dragOverLocation, location) ? "ring-2 ring-sage" : ""}`}
          >
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg text-ink">{day}</h3>
              <span className="text-xs text-cocoa">{formatDayDate(plan.weekKey, dayIndex)}</span>
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
                <li
                  key={entry.id}
                  className={`flex flex-col gap-1.5 rounded-md bg-paper-alt p-2 text-xs ${
                    draggedFrom?.entryId === entry.id ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex items-start gap-1">
                    <span
                      draggable
                      onDragStart={() => handleDragStart(location, entry.id)}
                      onDragEnd={handleDragEnd}
                      className="flex h-6 w-6 shrink-0 cursor-grab items-center justify-center text-cocoa active:cursor-grabbing"
                      aria-label="Drag to move"
                      title="Drag to move"
                    >
                      <RiDraggable size={16} aria-hidden />
                    </span>
                    {entry.type === "recipe" && entry.recipeId ? (
                      <Link
                        href={`/recipes/${entry.recipeId}${entry.servings ? `?servings=${entry.servings}` : ""}`}
                        className="leading-snug underline"
                      >
                        {entry.label}
                      </Link>
                    ) : (
                      <span className="leading-snug">{entry.label}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    {entry.type === "recipe" && entry.recipeId ? (
                      <input
                        type="number"
                        min={1}
                        value={entry.servings ?? ""}
                        onChange={(e) => updateDinnerServings(day, entry.id, Number(e.target.value))}
                        aria-label="Servings"
                        className="h-8 w-12 rounded-md border border-cocoa/40 bg-white px-1 text-center text-sm"
                      />
                    ) : (
                      <span />
                    )}
                    <div className="flex shrink-0 items-center gap-0.5">
                      <select
                        value=""
                        onChange={(e) => {
                          const target = parseLocationValue(e.target.value);
                          if (target) moveEntry(location, target, entry.id);
                        }}
                        aria-label="Move to"
                        title="Move to"
                        className="h-8 rounded-md border border-cocoa/40 bg-white px-1 text-xs"
                      >
                        <option value="">Move…</option>
                        {ALL_LOCATIONS.filter((l) => !sameLocation(l, location)).map((l) => (
                          <option key={locationValue(l)} value={locationValue(l)}>
                            {locationLabel(l)}
                          </option>
                        ))}
                      </select>
                      {entry.type === "recipe" && entry.recipeId && (
                        <button
                          type="button"
                          onClick={() => handleAddToGrocery(entry)}
                          disabled={addingToGrocery === entry.id}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-sage hover:bg-sage/10 disabled:opacity-50"
                          aria-label="Add to grocery list"
                          title="Add to grocery list"
                        >
                          <RiShoppingCartLine size={18} aria-hidden />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeDinner(day, entry.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-brick hover:bg-brick/10"
                        aria-label="Remove entry"
                      >
                        <RiCloseLine size={18} aria-hidden />
                      </button>
                    </div>
                  </div>
                  {groceryStatus[entry.id] && <span className="text-cocoa">{groceryStatus[entry.id]}</span>}
                </li>
              ))}
            </ul>

            <MealEntryAdder recipes={recipeOptions} onAdd={(entry) => addDinner(day, entry)} />
          </div>
          );
        })}
      </div>

      <h2 className="text-2xl text-brick">Breakfast / Lunch / Snack</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {WEEKLY_MEAL_TYPES.map((mealType) => {
          const location: Location = { kind: "weekly", mealType };
          return (
          <div
            key={mealType}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverLocation(location);
            }}
            onDragLeave={() => setDragOverLocation((prev) => (prev && sameLocation(prev, location) ? null : prev))}
            onDrop={(e) => {
              e.preventDefault();
              handleDropOnLocation(location);
            }}
            className={`card flex flex-col gap-2 p-3 ${dragOverLocation && sameLocation(dragOverLocation, location) ? "ring-2 ring-sage" : ""}`}
          >
            <h3 className="text-lg text-ink">{WEEKLY_MEAL_LABELS[mealType]}</h3>
            <ul className="flex flex-col gap-1">
              {plan.weeklyMeals[mealType].map((entry) => (
                <li key={entry.id} className="flex flex-col gap-1.5 rounded-md bg-paper-alt p-2 text-xs">
                  <div className="flex items-start gap-1">
                    <span
                      draggable
                      onDragStart={() => handleDragStart(location, entry.id)}
                      onDragEnd={handleDragEnd}
                      className="flex h-6 w-6 shrink-0 cursor-grab items-center justify-center text-cocoa active:cursor-grabbing"
                      aria-label="Drag to move"
                      title="Drag to move"
                    >
                      <RiDraggable size={16} aria-hidden />
                    </span>
                    {entry.type === "recipe" && entry.recipeId ? (
                      <Link
                        href={`/recipes/${entry.recipeId}${entry.servings ? `?servings=${entry.servings}` : ""}`}
                        className="leading-snug underline"
                      >
                        {entry.label}
                      </Link>
                    ) : (
                      <span className="leading-snug">{entry.label}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    {entry.type === "recipe" && entry.recipeId ? (
                      <input
                        type="number"
                        min={1}
                        value={entry.servings ?? ""}
                        onChange={(e) => updateWeeklyServings(mealType, entry.id, Number(e.target.value))}
                        aria-label="Servings"
                        className="h-8 w-12 rounded-md border border-cocoa/40 bg-white px-1 text-center text-sm"
                      />
                    ) : (
                      <span />
                    )}
                    <div className="flex shrink-0 items-center gap-0.5">
                      <select
                        value=""
                        onChange={(e) => {
                          const target = parseLocationValue(e.target.value);
                          if (target) moveEntry(location, target, entry.id);
                        }}
                        aria-label="Move to"
                        title="Move to"
                        className="h-8 rounded-md border border-cocoa/40 bg-white px-1 text-xs"
                      >
                        <option value="">Move…</option>
                        {ALL_LOCATIONS.filter((l) => !sameLocation(l, location)).map((l) => (
                          <option key={locationValue(l)} value={locationValue(l)}>
                            {locationLabel(l)}
                          </option>
                        ))}
                      </select>
                      {entry.type === "recipe" && entry.recipeId && (
                        <button
                          type="button"
                          onClick={() => handleAddToGrocery(entry)}
                          disabled={addingToGrocery === entry.id}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-sage hover:bg-sage/10 disabled:opacity-50"
                          aria-label="Add to grocery list"
                          title="Add to grocery list"
                        >
                          <RiShoppingCartLine size={18} aria-hidden />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeWeekly(mealType, entry.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-brick hover:bg-brick/10"
                        aria-label="Remove entry"
                      >
                        <RiCloseLine size={18} aria-hidden />
                      </button>
                    </div>
                  </div>
                  {groceryStatus[entry.id] && <span className="text-cocoa">{groceryStatus[entry.id]}</span>}
                </li>
              ))}
            </ul>
            <MealEntryAdder recipes={recipeOptions} onAdd={(entry) => addWeekly(mealType, entry)} />
          </div>
          );
        })}
      </div>

      {prepRecipes.length > 0 && (
        <>
          <h2 className="text-2xl text-brick">Prep</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {prepRecipes.map((recipe) => {
              const locations = Array.from(usageByRecipeId.get(recipe.id) ?? []);
              return (
                <div key={recipe.id} className="card flex flex-col gap-2 p-3">
                  <div>
                    <Link href={`/recipes/${recipe.id}`} className="text-sm font-medium text-ink underline">
                      {recipe.title}
                    </Link>
                    {locations.length > 0 && <p className="text-xs text-cocoa">{locations.join(", ")}</p>}
                  </div>
                  <ol className="flex flex-col divide-y divide-cocoa/20">
                    {recipe.prepAhead.map((step, index) => {
                      const key = `${recipe.id}:${index}`;
                      const checked = checkedPrepSteps.has(key);
                      return (
                        <li key={key}>
                          <button
                            type="button"
                            onClick={() => togglePrepStep(key)}
                            className="flex w-full items-start gap-2 py-2 text-left"
                          >
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                                checked ? "border-sage bg-sage text-white" : "border-cocoa/40 text-cocoa"
                              }`}
                              aria-hidden
                            >
                              {checked ? <RiCheckLine size={13} aria-hidden /> : index + 1}
                            </span>
                            <span className={`text-xs leading-relaxed ${checked ? "text-cocoa line-through" : "text-ink"}`}>
                              {step}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
