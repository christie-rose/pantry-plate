"use client";

import { CardTitle, DividedList, PageTitle, SectionHeading, WeekSelector } from "@/ui";
import { useState } from "react";
import Link from "next/link";
import { RiCheckLine, RiDraggable } from "@remixicon/react";
import { EntryActionsMenu } from "@/components/EntryActionsMenu";
import {
  DAYS,
  DAY_NAMES,
  WEEKLY_MEAL_TYPES,
  addDaysToKey,
  formatDayDate,
  formatWeekLabel,
  MAX_WEEKS_AHEAD,
  mondayKeyFor,
  type Day,
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
  dinners: Dinners;
  weeklyMeals: WeeklyMeals;
};

const WEEKLY_MEAL_LABELS: Record<WeeklyMealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
  other: "Other",
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
  return loc.kind === "day" ? DAY_NAMES[loc.day] : WEEKLY_MEAL_LABELS[loc.mealType];
}

export function WeekPlanClient({ initialPlan, recipes }: { initialPlan: Plan; recipes: Recipe[] }) {
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const recipeOptions = recipes;
  const [saving, setSaving] = useState(false);
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
    setSaving(true);
    await fetch("/api/weekplan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaving(false);
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

  async function handleAddToGrocery(entry: MealEntry) {
    if (entry.type !== "recipe" || !entry.recipeId) return;

    setAddingToGrocery(entry.id);
    setGroceryStatus((prev) => ({ ...prev, [entry.id]: "" }));

    const res = await fetch("/api/grocery/add-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: entry.recipeId, servings: entry.servings }),
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

  const currentWeekKey = mondayKeyFor(new Date());
  const canGoToPrevWeek = plan.weekKey > currentWeekKey;
  const maxWeekKey = addDaysToKey(currentWeekKey, MAX_WEEKS_AHEAD * 7);
  const canGoToNextWeek = plan.weekKey < maxWeekKey;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 pb-24">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle>Meal Plan</PageTitle>
        <WeekSelector
          as={Link}
          label={formatWeekLabel(plan.weekKey)}
          thisWeekHref={plan.weekKey !== currentWeekKey ? `/plan?week=${currentWeekKey}` : null}
          prevHref={canGoToPrevWeek ? `/plan?week=${addDaysToKey(plan.weekKey, -7)}` : null}
          nextHref={canGoToNextWeek ? `/plan?week=${addDaysToKey(plan.weekKey, 7)}` : null}
          nextDisabledTitle={`You can plan up to ${MAX_WEEKS_AHEAD} weeks ahead`}
        />
      </div>

      {saving && <p className="text-xs text-cocoa">Saving…</p>}

      <div className="flex flex-col gap-3">
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
            <CardTitle aside={formatDayDate(plan.weekKey, dayIndex)}>{DAY_NAMES[day]}</CardTitle>
            <ul className="flex flex-col gap-1">
              {plan.dinners[day].map((entry) => (
                <li
                  key={entry.id}
                  className={`flex flex-col gap-1.5 rounded-md bg-paper-alt p-2 text-xs ${
                    draggedFrom?.entryId === entry.id ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
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
                          className="text-base leading-snug underline"
                        >
                          {entry.label}
                        </Link>
                      ) : (
                        <span className="text-base leading-snug">{entry.label}</span>
                      )}
                    </div>
                    <EntryActionsMenu
                      isRecipe={entry.type === "recipe" && Boolean(entry.recipeId)}
                      servings={entry.servings}
                      onServingsChange={(servings) => updateDinnerServings(day, entry.id, servings)}
                      addingToGrocery={addingToGrocery === entry.id}
                      onAddToGrocery={() => handleAddToGrocery(entry)}
                      onRemove={() => removeDinner(day, entry.id)}
                      moveOptions={ALL_LOCATIONS.filter((l) => !sameLocation(l, location)).map((l) => ({
                        value: locationValue(l),
                        label: locationLabel(l),
                      }))}
                      onMove={(value) => {
                        const target = parseLocationValue(value);
                        if (target) moveEntry(location, target, entry.id);
                      }}
                    />
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

      <SectionHeading size="lg" tone="brick">Breakfast / Lunch / Snack / Other</SectionHeading>
      <div className="flex flex-col gap-3">
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
            <CardTitle>{WEEKLY_MEAL_LABELS[mealType]}</CardTitle>
            <ul className="flex flex-col gap-1">
              {plan.weeklyMeals[mealType].map((entry) => (
                <li key={entry.id} className="flex flex-col gap-1.5 rounded-md bg-paper-alt p-2 text-xs">
                  <div className="flex items-start justify-between gap-1">
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
                          className="text-base leading-snug underline"
                        >
                          {entry.label}
                        </Link>
                      ) : (
                        <span className="text-base leading-snug">{entry.label}</span>
                      )}
                    </div>
                    <EntryActionsMenu
                      isRecipe={entry.type === "recipe" && Boolean(entry.recipeId)}
                      servings={entry.servings}
                      onServingsChange={(servings) => updateWeeklyServings(mealType, entry.id, servings)}
                      addingToGrocery={addingToGrocery === entry.id}
                      onAddToGrocery={() => handleAddToGrocery(entry)}
                      onRemove={() => removeWeekly(mealType, entry.id)}
                      moveOptions={ALL_LOCATIONS.filter((l) => !sameLocation(l, location)).map((l) => ({
                        value: locationValue(l),
                        label: locationLabel(l),
                      }))}
                      onMove={(value) => {
                        const target = parseLocationValue(value);
                        if (target) moveEntry(location, target, entry.id);
                      }}
                    />
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
          <SectionHeading size="lg" tone="brick">Prep</SectionHeading>
          <div className="flex flex-col gap-3">
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
                  <DividedList as="ol">
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
                  </DividedList>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
