import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parseJsonResponse } from "@/lib/ai-context";

const SYSTEM_PROMPT = `You are helping a household track their pantry inventory from a photo of food or
household items they physically have on hand (a fridge, freezer, pantry shelf, or counter).

Identify each distinct item visible and estimate how much of it there is, in short free text
(e.g. "3", "1 bag", "2 cans", "1/2 gallon", "1 box"). Use simple, generic names the way you would when
listing recipe ingredients (e.g. "chicken breast", not a brand name). Only include real, clearly
identifiable food or household items — skip anything you can't confidently identify.

Respond with only a JSON object, no other text, in this exact shape:
{ "items": [{ "name": string, "quantity": string }, ...] }`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Photo scanning requires ANTHROPIC_API_KEY to be set on the server" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.imageBase64 !== "string" || typeof body.mediaType !== "string") {
    return NextResponse.json({ error: "imageBase64 and mediaType are required" }, { status: 400 });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: body.mediaType,
                data: body.imageBase64,
              },
            },
            { type: "text", text: "List the items you can see and how much of each there is." },
          ],
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Could not read items from that photo" }, { status: 422 });
    }

    const parsed = parseJsonResponse(textBlock.text) as { items?: { name: string; quantity: string }[] };
    if (!Array.isArray(parsed.items)) {
      return NextResponse.json({ error: "Could not read items from that photo" }, { status: 422 });
    }

    return NextResponse.json({ items: parsed.items });
  } catch {
    return NextResponse.json({ error: "Could not read items from that photo" }, { status: 422 });
  }
}
