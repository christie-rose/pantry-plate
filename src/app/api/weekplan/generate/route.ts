import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import {
  buildDietarySummary,
  buildPantrySummary,
  buildRecipeLibrarySummary,
  parseJsonResponse,
} from "@/lib/ai-context";
import { matchIngredientToPantry } from "@/lib/recipes";
import { DAYS, defaultDinners, type Day, type DayTags, type MealEntry } from "@/lib/weekplan";

const SYSTEM_PROMPT = `You are planning a week of dinners for a household meal-planning app.

Rules:
- Prefer recipes already in the household's recipe library. Only propose a brand-new recipe for a day
  when nothing in the library reasonably fits that day's tag and constraints.
- Match each day's tag: "Busy or quick" days get fast, low-effort meals; "Have extra time" days can be
  more involved; "Eating out" days should still get a light placeholder entry (e.g. a simple existing
  recipe or "Leftovers") since the household may change plans.
- Vary things across the whole week, not just consecutive days: do not use the same primary protein
  (e.g. chicken, beef, pork, fish, tofu) more than twice across all seven dinners, and avoid repeating
  the same cuisine back-to-back.
- Prefer recipes and new ideas that use ingredients already on hand in the pantry, but variety across
  the week matters more than pantry use — don't default to the same on-hand protein every night just
  because it's available.
- Respect the household's dietary restrictions exactly as given.

Respond with only a JSON object, no other text, in this exact shape (all seven keys required):
{
  "Mon": { "source": "existing", "recipeTitle": "<exact title from the library>", "servings": number } |
         { "source": "new", "title": string, "servings": number, "ingredients": [{ "name": string, "amount": number | null, "unit": string | null }], "instructions": [string, ...] },
  "Tue": ... (same shape),
  "Wed": ...,
  "Thu": ...,
  "Fri": ...,
  "Sat": ...,
  "Sun": ...
}`;

type ExistingChoice = { source: "existing"; recipeTitle: string; servings: number };
type NewChoice = {
  source: "new";
  title: string;
  servings: number;
  ingredients: { name: string; amount: number | null; unit: string | null }[];
  instructions: string[];
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Weekly plan generation requires ANTHROPIC_API_KEY to be set on the server" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.dayTags !== "object" || body.dayTags === null) {
    return NextResponse.json({ error: "dayTags is required" }, { status: 400 });
  }
  const dayTags = body.dayTags as DayTags;
  const respectDietary = Boolean(body.respectDietary);

  const [pantrySummary, dietarySummary, librarySummary] = await Promise.all([
    buildPantrySummary(),
    buildDietarySummary(respectDietary),
    buildRecipeLibrarySummary(),
  ]);

  const userMessage = `Day tags for this week:
${DAYS.map((day) => `- ${day}: ${dayTags[day]}`).join("\n")}

Recipe library:
${librarySummary}

Household pantry:
${pantrySummary}

Household dietary restrictions to respect:
${dietarySummary}`;

  let choices: Record<Day, ExistingChoice | NewChoice>;
  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Could not generate a weekly plan" }, { status: 422 });
    }
    choices = parseJsonResponse(textBlock.text) as Record<Day, ExistingChoice | NewChoice>;
  } catch {
    return NextResponse.json({ error: "Could not generate a weekly plan" }, { status: 422 });
  }

  const dinners = defaultDinners();
  const library = await prisma.recipe.findMany();

  for (const day of DAYS) {
    const choice = choices[day];
    if (!choice) continue;

    let entry: MealEntry;

    if (choice.source === "existing") {
      const match = library.find((r) => r.title.toLowerCase() === choice.recipeTitle.toLowerCase());
      if (match) {
        entry = {
          id: crypto.randomUUID(),
          type: "recipe",
          recipeId: match.id,
          label: match.title,
          servings: choice.servings || match.servings,
        };
      } else {
        // Model referenced a title that doesn't exist in the library; fall back to a plain text entry.
        entry = { id: crypto.randomUUID(), type: "text", label: choice.recipeTitle };
      }
    } else {
      const created = await prisma.recipe.create({
        data: {
          title: choice.title,
          tags: [],
          servings: choice.servings || 4,
          instructions: choice.instructions?.length ? choice.instructions : ["No instructions provided."],
          source: "ai",
          ingredients: {
            create: await Promise.all(
              (choice.ingredients ?? []).map(async (ingredient) => {
                const match = await matchIngredientToPantry(ingredient.name);
                return {
                  name: ingredient.name,
                  amount: ingredient.amount,
                  unit: ingredient.unit,
                  pantryItemId: match?.id ?? null,
                  reviewed: Boolean(match),
                };
              }),
            ),
          },
        },
      });
      library.push(created);
      entry = {
        id: crypto.randomUUID(),
        type: "recipe",
        recipeId: created.id,
        label: created.title,
        servings: choice.servings || created.servings,
      };
    }

    dinners[day] = [entry];
  }

  return NextResponse.json({ dinners });
}
