import { prisma } from "@/lib/prisma";
import { buildDietarySummary } from "@/lib/ai-context";
import { formatAmountAsFraction, scaleAmount } from "@/lib/recipes";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type CookingProgress = { ingredients: string[]; steps: number[]; prep: number[] };

export const COOKING_MODEL = process.env.COOKING_MODEL || "claude-haiku-4-5";

/** Keeps only well-formed, reasonably sized messages, ending on the cook's latest message. */
export function cleanMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  const cleaned = input
    .filter(
      (m): m is ChatMessage =>
        m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim() !== "",
    )
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 2000) }))
    .slice(-20);
  // The conversation sent to the model must start with the cook speaking.
  while (cleaned.length && cleaned[0].role !== "user") cleaned.shift();
  return cleaned;
}

export function cleanProgress(input: unknown): CookingProgress {
  const p = (input ?? {}) as Partial<CookingProgress>;
  const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 100) : []);
  const numbers = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is number => typeof x === "number").slice(0, 100) : []);
  return { ingredients: strings(p.ingredients), steps: numbers(p.steps), prep: numbers(p.prep) };
}

/** A plain-text description of the recipe as the cook sees it right now, at their chosen servings. */
export async function buildRecipeContext(recipeId: string, servings: number | null, progress: CookingProgress) {
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, include: { ingredients: true } });
  if (!recipe) return null;
  const targetServings = servings && servings > 0 ? servings : recipe.servings;
  const factor = targetServings / recipe.servings;
  const checkedIngredients = new Set(progress.ingredients);

  const ingredientLines = recipe.ingredients.map((i) => {
    const amount =
      i.amount != null ? [formatAmountAsFraction(scaleAmount(i.amount, factor)), i.unit].filter(Boolean).join(" ") : (i.unit ?? "");
    const done = checkedIngredients.has(i.id) ? " [ready]" : "";
    return `- ${[amount, i.name].filter(Boolean).join(" ")}${done}`;
  });
  const stepLines = recipe.instructions.map((s, i) => `${i + 1}. ${s}${progress.steps.includes(i) ? " [done]" : ""}`);
  const prepLines = recipe.prepAhead.map((s, i) => `${i + 1}. ${s}${progress.prep.includes(i) ? " [done]" : ""}`);

  const text = `Recipe: ${recipe.title}
Cooking for: ${targetServings} servings${targetServings !== recipe.servings ? ` (the recipe is written for ${recipe.servings}; amounts below are already scaled)` : ""}
${recipe.cuisine ? `Cuisine: ${recipe.cuisine}\n` : ""}
Ingredients (marked [ready] once the cook has gathered them):
${ingredientLines.join("\n")}

Instructions (marked [done] once the cook has finished them):
${stepLines.join("\n")}
${prepLines.length ? `\nPrep-ahead steps:\n${prepLines.join("\n")}\n` : ""}${recipe.notes ? `\nThe cook's saved notes on this recipe:\n${recipe.notes}\n` : ""}`;

  return { title: recipe.title, text, dietary: await buildDietarySummary(true) };
}
