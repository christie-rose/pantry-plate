import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parseJsonResponse } from "@/lib/ai-context";

const SYSTEM_PROMPT = `You are reading a store receipt, either a photo or a digital receipt (an image or PDF
of an emailed/downloaded receipt). Find the final total the customer paid (after tax, after any
discounts) — not a subtotal. Also try to identify the store name if it's legible.
Respond with only a JSON object, no other text, in this exact shape:
{ "total": number, "store": string | null }`;

const IMAGE_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Receipt reading requires ANTHROPIC_API_KEY to be set on the server" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.imageBase64 !== "string" || typeof body.mediaType !== "string") {
    return NextResponse.json({ error: "imageBase64 and mediaType are required" }, { status: 400 });
  }

  const isPdf = body.mediaType === "application/pdf";
  if (!isPdf && !IMAGE_MEDIA_TYPES.has(body.mediaType)) {
    return NextResponse.json({ error: "Unsupported file type — use an image or a PDF" }, { status: 400 });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            isPdf
              ? {
                  type: "document",
                  source: { type: "base64", media_type: "application/pdf", data: body.imageBase64 },
                }
              : {
                  type: "image",
                  source: { type: "base64", media_type: body.mediaType, data: body.imageBase64 },
                },
            { type: "text", text: "What's the total on this receipt?" },
          ],
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Could not read that receipt" }, { status: 422 });
    }

    const parsed = parseJsonResponse(textBlock.text) as { total?: unknown; store?: unknown };
    const total = Number(parsed.total);
    if (!Number.isFinite(total)) {
      return NextResponse.json({ error: "Could not read a total on that receipt" }, { status: 422 });
    }

    return NextResponse.json({ total, store: typeof parsed.store === "string" ? parsed.store : null });
  } catch {
    return NextResponse.json({ error: "Could not read that receipt" }, { status: 422 });
  }
}
