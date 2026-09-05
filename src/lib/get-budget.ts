import { prisma } from "@/lib/prisma";

/** The app uses a single household budget row; create it on first access. */
export async function getOrCreateBudget() {
  const existing = await prisma.budget.findFirst();
  if (existing) return existing;
  return prisma.budget.create({ data: { monthlyBudget: 0 } });
}
