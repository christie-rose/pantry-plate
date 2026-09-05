import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateBudget } from "@/lib/get-budget";

export async function GET() {
  const budget = await getOrCreateBudget();
  const expenses = await prisma.expense.findMany({
    where: { budgetId: budget.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ ...budget, expenses });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const monthlyBudget = Number(body?.monthlyBudget);

  if (!Number.isFinite(monthlyBudget) || monthlyBudget < 0) {
    return NextResponse.json({ error: "monthlyBudget must be a non-negative number" }, { status: 400 });
  }

  const budget = await getOrCreateBudget();
  const updated = await prisma.budget.update({
    where: { id: budget.id },
    data: { monthlyBudget },
  });

  return NextResponse.json(updated);
}
