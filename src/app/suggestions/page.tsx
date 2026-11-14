import { prisma } from "@/lib/prisma";
import { SuggestionsClient } from "@/components/SuggestionsClient";

export const dynamic = "force-dynamic";

export default async function SuggestionsPage() {
  const items = await prisma.suggestion.findMany({ orderBy: { createdAt: "desc" } });
  return <SuggestionsClient initialItems={items.map((i) => ({ id: i.id, text: i.text, done: i.done }))} />;
}
