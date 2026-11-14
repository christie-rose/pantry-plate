import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { COOKING_MODEL, buildRecipeContext, cleanMessages, cleanProgress } from "@/lib/cooking";

const SYSTEM_PROMPT = `You are a calm, practical cooking helper. The person you are talking to is in the middle of
cooking the recipe below right now, so their hands may be busy and they want quick, clear answers.

How to answer:
- Keep answers short: usually one to four sentences, in plain text. No headings. Use a short list only when
  giving steps. Give concrete amounts, times and temperatures when relevant.
- Use the recipe and the cook's progress (steps marked [done], ingredients marked [ready]) to answer in
  context, for example what to do next or whether something can still be fixed at this point.
- Be accurate about food safety. If you are not sure, say so.
- Respect the household's dietary restrictions when suggesting swaps.
- You cannot change the recipe, and you must never say or imply that you did. If the cook wants a change
  (a swap, less salt, a different time), tell them what to do right now for this cook. You may mention that
  you can suggest saving the change when they finish cooking, but do not make a point of it every time.`;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Asking AI needs ANTHROPIC_API_KEY to be set on the server." }, { status: 503 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const messages = cleanMessages(body?.messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Type a question first." }, { status: 400 });
  }

  const context = await buildRecipeContext(id, typeof body?.servings === "number" ? body.servings : null, cleanProgress(body?.progress));
  if (!context) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  try {
    const anthropic = new Anthropic({ apiKey });
    const result = await anthropic.messages.create({
      model: COOKING_MODEL,
      max_tokens: 600,
      system: `${SYSTEM_PROMPT}\n\nHousehold dietary restrictions:\n${context.dietary}\n\n${context.text}`,
      messages,
    });
    const text = result.content.find((block) => block.type === "text");
    if (!text || text.type !== "text") throw new Error("no text");
    return NextResponse.json({ reply: text.text.trim() });
  } catch (error) {
    console.error("Cooking question failed", error);
    return NextResponse.json({ error: "Could not get an answer just now. Try again in a moment." }, { status: 502 });
  }
}
