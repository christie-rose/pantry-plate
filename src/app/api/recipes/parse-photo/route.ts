import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parseJsonResponse } from "@/lib/ai-context";

const SYSTEM_PROMPT = `You are extracting a recipe from a photo of a handwritten or printed recipe card.
Respond with only a JSON object, no other text, in this exact shape:
{
  "title": string,
  "servings": number,
  "ingredients": [{ "name": string, "amount": number | null, "unit": string | null }],
  "instructions": [string, ...],
  "notes": string | null
}
If servings isn't stated, make a reasonable guess (e.g. 4). Keep ingredient names simple (e.g. "chicken breast", not "2 boneless chicken breasts").`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Photo parsing requires ANTHROPIC_API_KEY to be set on the server" },
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
            { type: "text", text: "Extract the recipe from this photo." },
          ],
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Could not read a recipe from that photo" }, { status: 422 });
    }

    const parsed = parseJsonResponse(textBlock.text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Could not read a recipe from that photo" }, { status: 422 });
  }
}
