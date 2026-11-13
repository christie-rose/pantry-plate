import { prisma } from "@/lib/prisma";
import { GroceryClient } from "@/components/GroceryClient";
import { mondayKeyFor } from "@/lib/weekplan";
import type { GroceryItem } from "@/lib/grocery";

export const dynamic = "force-dynamic";

export default async function GroceryPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekKey = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : mondayKeyFor(new Date());

  const [list, allLists] = await Promise.all([
    prisma.groceryList.findUnique({ where: { weekKey } }),
    prisma.groceryList.findMany({ select: { items: true } }),
  ]);
  const items = (list?.items as unknown as GroceryItem[]) ?? [];

  // Every tag ever used on any week's list, so suggestions carry over between weeks.
  const knownTags = Array.from(
    new Set(
      allLists
        .flatMap((l) => (l.items as unknown as GroceryItem[]) ?? [])
        .map((i) => i.tag?.trim())
        .filter((t): t is string => Boolean(t)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return <GroceryClient key={weekKey} weekKey={weekKey} initialItems={items} knownTags={knownTags} />;
}
