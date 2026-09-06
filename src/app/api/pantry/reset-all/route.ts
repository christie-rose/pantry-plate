import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Resets every pantry item: non-staples to quantity "0", staples to stapleStatus "In stock". */
export async function POST() {
  await Promise.all([
    prisma.pantryItem.updateMany({ where: { isStaple: false }, data: { quantity: "0" } }),
    prisma.pantryItem.updateMany({ where: { isStaple: true }, data: { stapleStatus: "In stock" } }),
  ]);

  return NextResponse.json({ ok: true });
}
