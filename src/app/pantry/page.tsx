import { prisma } from "@/lib/prisma";
import { PantryClient } from "@/components/PantryClient";

export default async function PantryPage() {
  const items = await prisma.pantryItem.findMany({ orderBy: { name: "asc" } });

  return <PantryClient initialItems={items} />;
}
