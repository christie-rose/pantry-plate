import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildDietarySummary, buildPantrySummary, parseJsonResponse } from "@/lib/ai-context";

const SYSTEM_PROMPT = `You are a home-cooking recipe writer for a household meal-planning app.
Respond with only a JSON object, no other text, in this exact shape:
{
  "title": string,
  "servings": number,
  "ingredients": [{ "name": string, "amount": number | null, "unit": string | null }],
  "instructions": [string, ...],
  "notes": string | null
}
Write clear, approachable, weeknight-friendly instructions. Keep ingredient names simple and generic
(e.g. "chicken breast", not "2 lb boneless skinless chicken breast").`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Recipe generation requires ANTHROPIC_API_KEY to be set on the server" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.prompt !== "string" || !body.prompt.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }
  const respectDietary = Boolean(body.respectDietary);

  const [pantrySummary, dietarySummary] = await Promise.all([
    buildPantrySummary(),
    buildDietarySummary(respectDietary),
  ]);

  const userMessage = `Request: ${body.prompt.trim()}

Household pantry (prefer using what's already on hand when it fits the request):
${pantrySummary}

Household dietary restrictions to respect:
${dietarySummary}`;

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Could not generate a recipe" }, { status: 422 });
    }

    const parsed = parseJsonResponse(textBlock.text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Could not generate a recipe" }, { status: 422 });
  }
}
