import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WeekPlanClient } from "@/components/WeekPlanClient";
import {
  MAX_WEEKS_AHEAD,
  addDaysToKey,
  defaultDinners,
  defaultWeeklyMeals,
  mondayKeyFor,
} from "@/lib/weekplan";
import type { Dinners, WeeklyMeals } from "@/lib/weekplan";

export const dynamic = "force-dynamic";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const currentWeekKey = mondayKeyFor(new Date());
  const weekKey = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : currentWeekKey;

  // Keep hand-typed addresses within the allowed range (this week through MAX_WEEKS_AHEAD weeks out).
  const lastAllowedWeekKey = addDaysToKey(currentWeekKey, MAX_WEEKS_AHEAD * 7);
  if (weekKey > lastAllowedWeekKey) {
    redirect(`/plan?week=${lastAllowedWeekKey}`);
  }

  const [existing, recipes] = await Promise.all([
    prisma.weekPlan.findUnique({ where: { weekKey } }),
    prisma.recipe.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        servings: true,
        categories: true,
        cuisine: true,
        ingredients: { select: { name: true } },
      },
    }),
  ]);

  const plan = existing
    ? {
        weekKey: existing.weekKey,
        dinners: existing.dinners as unknown as Dinners,
        // Merge over defaults so plans saved before a new weekly-meal slot was added (e.g. "other")
        // still have every key populated.
        weeklyMeals: { ...defaultWeeklyMeals(), ...(existing.weeklyMeals as unknown as WeeklyMeals) },
      }
    : {
        weekKey,
        dinners: defaultDinners(),
        weeklyMeals: defaultWeeklyMeals(),
      };

  return <WeekPlanClient key={weekKey} initialPlan={plan} recipes={recipes} />;
}
