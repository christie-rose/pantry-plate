export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof DAYS)[number];

export const DAY_TAGS = ["Normal", "Busy or quick", "Eating out", "Have extra time"] as const;
export type DayTag = (typeof DAY_TAGS)[number];

export const WEEKLY_MEAL_TYPES = ["breakfast", "lunch", "snack"] as const;
export type WeeklyMealType = (typeof WEEKLY_MEAL_TYPES)[number];

export type MealEntry = {
  id: string;
  type: "recipe" | "text";
  recipeId?: string;
  label: string;
  servings?: number;
};

export type DayTags = Record<Day, DayTag>;
export type Dinners = Record<Day, MealEntry[]>;
export type WeeklyMeals = Record<WeeklyMealType, MealEntry[]>;

export function defaultDayTags(): DayTags {
  return { Mon: "Normal", Tue: "Normal", Wed: "Normal", Thu: "Normal", Fri: "Normal", Sat: "Normal", Sun: "Normal" };
}

export function defaultDinners(): Dinners {
  return { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] };
}

export function defaultWeeklyMeals(): WeeklyMeals {
  return { breakfast: [], lunch: [], snack: [] };
}

/** Returns the ISO date (YYYY-MM-DD) of the Monday of the week containing `date`, in local time. */
export function mondayKeyFor(date: Date): string {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysToKey(weekKey: string, days: number): string {
  const date = new Date(`${weekKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return mondayKeyFor(date);
}

export function formatWeekLabel(weekKey: string): string {
  const monday = new Date(`${weekKey}T00:00:00`);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}
