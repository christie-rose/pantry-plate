import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultDinners, defaultWeeklyMeals } from "@/lib/weekplan";

export async function GET(request: NextRequest) {
  const weekKey = request.nextUrl.searchParams.get("weekKey");
  if (!weekKey) {
    return NextResponse.json({ error: "weekKey is required" }, { status: 400 });
  }

  const plan = await prisma.weekPlan.findUnique({ where: { weekKey } });

  if (!plan) {
    return NextResponse.json({
      weekKey,
      dinners: defaultDinners(),
      weeklyMeals: defaultWeeklyMeals(),
    });
  }

  return NextResponse.json(plan);
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (
    typeof body !== "object" ||
    body === null ||
    typeof body.weekKey !== "string" ||
    typeof body.dinners !== "object" ||
    typeof body.weeklyMeals !== "object"
  ) {
    return NextResponse.json({ error: "Invalid week plan payload" }, { status: 400 });
  }

  const plan = await prisma.weekPlan.upsert({
    where: { weekKey: body.weekKey },
    create: {
      weekKey: body.weekKey,
      dinners: body.dinners,
      weeklyMeals: body.weeklyMeals,
    },
    update: {
      dinners: body.dinners,
      weeklyMeals: body.weeklyMeals,
    },
  });

  return NextResponse.json(plan);
}
