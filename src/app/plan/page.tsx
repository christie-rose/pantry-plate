import { prisma } from "@/lib/prisma";
import { WeekPlanClient } from "@/components/WeekPlanClient";
import { defaultDayTags, defaultDinners, defaultWeeklyMeals, mondayKeyFor } from "@/lib/weekplan";
import type { DayTags, Dinners, WeeklyMeals } from "@/lib/weekplan";

export const dynamic = "force-dynamic";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekKey = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : mondayKeyFor(new Date());

  const [existing, recipes] = await Promise.all([
    prisma.weekPlan.findUnique({ where: { weekKey } }),
    prisma.recipe.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, servings: true } }),
  ]);

  const plan = existing
    ? {
        weekKey: existing.weekKey,
        dayTags: existing.dayTags as unknown as DayTags,
        dinners: existing.dinners as unknown as Dinners,
        weeklyMeals: existing.weeklyMeals as unknown as WeeklyMeals,
      }
    : {
        weekKey,
        dayTags: defaultDayTags(),
        dinners: defaultDinners(),
        weeklyMeals: defaultWeeklyMeals(),
      };

  return <WeekPlanClient key={weekKey} initialPlan={plan} recipes={recipes} />;
}
