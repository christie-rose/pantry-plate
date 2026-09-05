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

  const list = await prisma.groceryList.findUnique({ where: { weekKey } });
  const items = (list?.items as unknown as GroceryItem[]) ?? [];

  return <GroceryClient key={weekKey} weekKey={weekKey} initialItems={items} />;
}
