import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parseJsonResponse } from "@/lib/ai-context";

type ParsedItem = {
  name: string;
  quantity: string | null;
};

function naiveParse(transcript: string): ParsedItem {
  const match = transcript.match(/^\s*(\d+(?:\.\d+)?\s*(?:[a-zA-Z]+)?)\s+(?:of\s+)?(.+)$/);
  if (match) {
    return { quantity: match[1].trim(), name: match[2].trim() };
  }
  return { name: transcript.trim(), quantity: null };
}

export async function POST(request: NextRequest) {
  const { transcript } = await request.json().catch(() => ({ transcript: "" }));

  if (typeof transcript !== "string" || !transcript.trim()) {
    return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(naiveParse(transcript));
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      system:
        "Parse a spoken grocery/pantry item into JSON with keys \"name\" (string) and \"quantity\" " +
        '(string or null, e.g. "2 lb", "3 cans"). Respond with only the JSON object, no other text.',
      messages: [{ role: "user", content: transcript }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(naiveParse(transcript));
    }

    const parsed = parseJsonResponse(textBlock.text) as { name?: unknown; quantity?: unknown };
    if (typeof parsed.name === "string") {
      return NextResponse.json({
        name: parsed.name,
        quantity: typeof parsed.quantity === "string" ? parsed.quantity : null,
      });
    }
    return NextResponse.json(naiveParse(transcript));
  } catch {
    return NextResponse.json(naiveParse(transcript));
  }
}
