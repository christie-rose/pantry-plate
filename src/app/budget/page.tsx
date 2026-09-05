import { prisma } from "@/lib/prisma";
import { getOrCreateBudget } from "@/lib/get-budget";
import { BudgetClient } from "@/components/BudgetClient";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const budget = await getOrCreateBudget();
  const expenses = await prisma.expense.findMany({
    where: { budgetId: budget.id },
    orderBy: { date: "desc" },
  });

  return (
    <BudgetClient
      budget={{ id: budget.id, monthlyBudget: budget.monthlyBudget }}
      initialExpenses={expenses.map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        amount: e.amount,
        store: e.store,
        note: e.note,
      }))}
    />
  );
}
