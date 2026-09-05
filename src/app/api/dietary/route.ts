import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateDietaryEntryInput } from "@/lib/dietary";

export async function GET() {
  const entries = await prisma.dietaryEntry.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = validateDietaryEntryInput(body);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const entry = await prisma.dietaryEntry.create({ data: result });
  return NextResponse.json(entry, { status: 201 });
}
