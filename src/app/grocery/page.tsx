import { prisma } from "@/lib/prisma";
import { GroceryClient } from "@/components/GroceryClient";
import { loadGroceryItems, type GroceryItem } from "@/lib/grocery";

export const dynamic = "force-dynamic";

export default async function GroceryPage() {
  const items = await loadGroceryItems();

  // Every tag ever used on any list, so suggestions include tags from before the lists were merged.
  const allLists = await prisma.groceryList.findMany({ select: { items: true } });
  const knownTags = Array.from(
    new Set(
      allLists
        .flatMap((l) => (l.items as unknown as GroceryItem[]) ?? [])
        .map((i) => i.tag?.trim())
        .filter((t): t is string => Boolean(t)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return <GroceryClient initialItems={items} knownTags={knownTags} />;
}
