import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parseJsonResponse } from "@/lib/ai-context";

const SYSTEM_PROMPT = `You help edit an existing recipe in a household meal-planning app based on a
plain-language instruction from the user (e.g. "make it vegetarian", "add a side of rice",
"make it spicier", "swap the chicken for shrimp").

You will be given the recipe's current title, servings, ingredients, instructions, and prep-ahead
steps, plus the user's instruction. Apply the requested change and respond with only a JSON object,
no other text, representing the FULL updated recipe in this exact shape:
{
  "title": string,
  "servings": number,
  "ingredients": [{ "name": string, "amount": number | null, "unit": string | null }],
  "instructions": [string, ...],
  "prepAhead": [string, ...]
}
Keep everything from the original recipe unchanged except what the instruction asks you to change.
Keep ingredient names simple and generic. If the instruction doesn't affect prep-ahead steps, return
the original prepAhead list unchanged (or an empty list if there were none).`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Editing with AI requires ANTHROPIC_API_KEY to be set on the server" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.instruction !== "string" || !body.instruction.trim() || typeof body.recipe !== "object") {
    return NextResponse.json({ error: "recipe and instruction are required" }, { status: 400 });
  }

  const { recipe, instruction } = body as {
    recipe: {
      title: string;
      servings: number;
      ingredients: { name: string; amount: number | null; unit: string | null }[];
      instructions: string[];
      prepAhead: string[];
    };
    instruction: string;
  };

  const userMessage = `Current recipe:
Title: ${recipe.title}
Servings: ${recipe.servings}

Ingredients:
${recipe.ingredients.map((i) => `- ${[i.amount, i.unit, i.name].filter(Boolean).join(" ")}`).join("\n")}

Instructions:
${recipe.instructions.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Prep-ahead steps:
${recipe.prepAhead.length ? recipe.prepAhead.map((s, i) => `${i + 1}. ${s}`).join("\n") : "(none)"}

Requested change: ${instruction.trim()}`;

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Could not edit the recipe" }, { status: 422 });
    }

    const parsed = parseJsonResponse(textBlock.text) as {
      title?: string;
      servings?: number;
      ingredients?: { name: string; amount: number | null; unit: string | null }[];
      instructions?: string[];
      prepAhead?: string[];
    };

    if (!parsed.title || !Array.isArray(parsed.instructions) || parsed.instructions.length === 0) {
      return NextResponse.json({ error: "Could not edit the recipe" }, { status: 422 });
    }

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Could not edit the recipe" }, { status: 422 });
  }
}
