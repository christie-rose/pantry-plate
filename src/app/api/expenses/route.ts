import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDateOnly, validateExpenseInput } from "@/lib/budget";
import { getOrCreateBudget } from "@/lib/get-budget";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = validateExpenseInput(body);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const budget = await getOrCreateBudget();
  const expense = await prisma.expense.create({
    data: {
      budgetId: budget.id,
      date: parseDateOnly(result.date),
      amount: result.amount,
      store: result.store,
      note: result.note,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
