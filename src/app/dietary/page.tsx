import { prisma } from "@/lib/prisma";
import { DietaryClient } from "@/components/DietaryClient";

export const dynamic = "force-dynamic";

export default async function DietaryPage() {
  const entries = await prisma.dietaryEntry.findMany({ orderBy: { name: "asc" } });
  return <DietaryClient initialEntries={entries} />;
}
