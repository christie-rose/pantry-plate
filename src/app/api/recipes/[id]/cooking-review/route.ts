import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parseJsonResponse } from "@/lib/ai-context";
import { COOKING_MODEL, buildRecipeContext, cleanMessages, cleanProgress } from "@/lib/cooking";

const SYSTEM_PROMPT = `You review a cooking session after the cook has finished making a recipe. You are given the recipe, the
conversation the cook had with a cooking helper while cooking, and optionally the cook's own comments on how it
turned out.

Suggest only things that are grounded in what the cook actually said, asked or experienced. Do not invent problems.
If nothing useful came up, return empty lists.

Respond with only a JSON object, no other text, in exactly this shape:
{
  "summary": string,
  "noteSuggestions": [string, ...],
  "changeSuggestions": [{ "title": string, "instruction": string }, ...]
}
- "summary": one or two friendly sentences about how the cook went.
- "noteSuggestions": up to 3 short notes worth saving on the recipe for next time (tips, timings, what worked),
  each written as a plain sentence the cook could keep as is.
- "changeSuggestions": up to 3 changes to the recipe itself. "title" is a short label such as "Less salt".
  "instruction" is a clear one-sentence instruction for an AI recipe editor, such as "Reduce the salt to 1/4 teaspoon."`;

type Review = {
  summary: string;
  noteSuggestions: string[];
  changeSuggestions: { title: string; instruction: string }[];
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Asking AI needs ANTHROPIC_API_KEY to be set on the server." }, { status: 503 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const messages = cleanMessages(body?.messages);
  const feedback = typeof body?.feedback === "string" ? body.feedback.trim().slice(0, 2000) : "";
  if (!messages.length && !feedback) {
    return NextResponse.json({ error: "Ask a question or write a note about how it went first." }, { status: 400 });
  }

  const context = await buildRecipeContext(id, typeof body?.servings === "number" ? body.servings : null, cleanProgress(body?.progress));
  if (!context) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  const transcript = messages.map((m) => `${m.role === "user" ? "Cook" : "Helper"}: ${m.content}`).join("\n");
  const userMessage = `${context.text}
Conversation while cooking:
${transcript || "(none)"}

The cook's comments on how it turned out:
${feedback || "(none)"}`;

  try {
    const anthropic = new Anthropic({ apiKey });
    const result = await anthropic.messages.create({
      model: COOKING_MODEL,
      max_tokens: 900,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    const text = result.content.find((block) => block.type === "text");
    if (!text || text.type !== "text") throw new Error("no text");
    const parsed = parseJsonResponse(text.text) as Partial<Review>;
    const review: Review = {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      noteSuggestions: (Array.isArray(parsed.noteSuggestions) ? parsed.noteSuggestions : [])
        .filter((n): n is string => typeof n === "string" && n.trim() !== "")
        .slice(0, 3),
      changeSuggestions: (Array.isArray(parsed.changeSuggestions) ? parsed.changeSuggestions : [])
        .filter((c) => c && typeof c.title === "string" && typeof c.instruction === "string")
        .slice(0, 3),
    };
    return NextResponse.json(review);
  } catch (error) {
    console.error("Cooking review failed", error);
    return NextResponse.json({ error: "Could not review the session just now. Try again in a moment." }, { status: 502 });
  }
}
