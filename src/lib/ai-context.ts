import { prisma } from "@/lib/prisma";

/** Claude sometimes wraps JSON responses in markdown code fences despite instructions not to; strip them before parsing. */
export function parseJsonResponse(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return JSON.parse(fenced ? fenced[1] : text);
}

export async function buildPantrySummary(): Promise<string> {
  const items = await prisma.pantryItem.findMany();
  if (items.length === 0) return "The pantry is currently empty.";
  return items
    .map((item) => {
      const status = item.isStaple ? item.stapleStatus : item.quantity || "some on hand";
      return `- ${item.name} (${item.location}, ${status})`;
    })
    .join("\n");
}

export async function buildDietarySummary(respectDietary: boolean): Promise<string> {
  if (!respectDietary) return "No dietary restrictions need to be respected for this request.";
  const entries = await prisma.dietaryEntry.findMany();
  if (entries.length === 0) return "No dietary restrictions are on file.";
  return entries
    .map((entry) => `- [${entry.category}] ${entry.name}${entry.detail ? `: ${entry.detail}` : ""}`)
    .join("\n");
}

export async function buildRecipeLibrarySummary(): Promise<string> {
  const recipes = await prisma.recipe.findMany({
    include: { ingredients: true },
    orderBy: { title: "asc" },
  });
  if (recipes.length === 0) return "The recipe library is currently empty.";
  return recipes
    .map(
      (r) =>
        `- "${r.title}" (serves ${r.servings}, tags: ${r.tags.join(", ") || "none"}, ingredients: ${r.ingredients
          .map((i) => i.name)
          .join(", ")})`,
    )
    .join("\n");
}
