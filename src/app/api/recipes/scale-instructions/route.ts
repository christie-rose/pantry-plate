import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parseJsonResponse } from "@/lib/ai-context";

const SYSTEM_PROMPT = `You help a household meal-planning app rescale a recipe's written steps when the
number of servings changes.
Respond with only a JSON object, no other text, in this exact shape:
{ "instructions": [string, ...], "prepAhead": [string, ...] }
Rules:
- Keep the same number of steps in each list, in the same order, with the same overall wording and style.
- Only adjust numeric quantities mentioned directly in a step (e.g. "add 2 cups rice" -> "add 3 cups rice"),
  scaling them proportionally from the old serving count to the new one. Round to sane cooking amounts.
- Do not change cooking times, oven temperatures, or pan/dish sizes — those don't scale with servings.
- If a step has no quantities to adjust, return it unchanged.
- If the input prepAhead list is empty, return an empty prepAhead list.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Scaling instructions requires ANTHROPIC_API_KEY to be set on the server" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    !Array.isArray(body.instructions) ||
    typeof body.oldServings !== "number" ||
    typeof body.newServings !== "number"
  ) {
    return NextResponse.json(
      { error: "instructions, oldServings, and newServings are required" },
      { status: 400 },
    );
  }
  const prepAhead: string[] = Array.isArray(body.prepAhead) ? body.prepAhead : [];

  const userMessage = `Old servings: ${body.oldServings}
New servings: ${body.newServings}

Instructions:
${body.instructions.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}

Prep-ahead steps:
${prepAhead.length ? prepAhead.map((s, i) => `${i + 1}. ${s}`).join("\n") : "(none)"}`;

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
      return NextResponse.json({ error: "Could not scale instructions" }, { status: 422 });
    }

    const parsed = parseJsonResponse(textBlock.text) as { instructions?: string[]; prepAhead?: string[] };
    if (!Array.isArray(parsed.instructions)) {
      return NextResponse.json({ error: "Could not scale instructions" }, { status: 422 });
    }

    return NextResponse.json({
      instructions: parsed.instructions,
      prepAhead: Array.isArray(parsed.prepAhead) ? parsed.prepAhead : [],
    });
  } catch {
    return NextResponse.json({ error: "Could not scale instructions" }, { status: 422 });
  }
}
