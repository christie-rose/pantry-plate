import { prisma } from "@/lib/prisma";

/** Claude sometimes wraps JSON responses in markdown code fences despite instructions not to; strip them before parsing. */
export function parseJsonResponse(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return JSON.parse(fenced ? fenced[1] : text);
}

export async function buildDietarySummary(respectDietary: boolean): Promise<string> {
  if (!respectDietary) return "No dietary restrictions need to be respected for this request.";
  const entries = await prisma.dietaryEntry.findMany();
  if (entries.length === 0) return "No dietary restrictions are on file.";
  return entries
    .map((entry) => `- [${entry.category}] ${entry.name}${entry.detail ? `: ${entry.detail}` : ""}`)
    .join("\n");
}
