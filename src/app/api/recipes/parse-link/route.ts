import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parseJsonResponse } from "@/lib/ai-context";

const SYSTEM_PROMPT = `You are extracting a recipe from the text of a recipe web page.
Respond with only a JSON object, no other text, in this exact shape:
{
  "title": string,
  "servings": number,
  "ingredients": [{ "name": string, "amount": number | null, "unit": string | null }],
  "instructions": [string, ...],
  "notes": string | null
}
If servings isn't stated, make a reasonable guess (e.g. 4). Keep ingredient names simple (e.g. "chicken breast", not "2 boneless chicken breasts"). Ignore ads, comments, and unrelated site navigation text.`;

type JsonLdRecipe = {
  name?: string;
  recipeYield?: string | number | string[];
  recipeIngredient?: string[];
  recipeInstructions?: unknown;
  description?: string;
};

function findRecipeJsonLd(html: string): JsonLdRecipe | null {
  const scriptMatches = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const match of scriptMatches) {
    try {
      const json = JSON.parse(match[1]);
      const candidates = Array.isArray(json) ? json : [json];
      for (const candidate of candidates) {
        const graph = candidate["@graph"] ? candidate["@graph"] : [candidate];
        for (const node of graph) {
          const type = node["@type"];
          const types = Array.isArray(type) ? type : [type];
          if (types.includes("Recipe")) return node as JsonLdRecipe;
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

function instructionsToSteps(instructions: unknown): string[] {
  if (typeof instructions === "string") {
    return instructions.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  if (Array.isArray(instructions)) {
    return instructions.map((step) => {
      if (typeof step === "string") return step;
      if (typeof step === "object" && step !== null && "text" in step) {
        return String((step as { text: unknown }).text);
      }
      return "";
    }).filter(Boolean);
  }
  return [];
}

function parseServings(value: JsonLdRecipe["recipeYield"]): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const num = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
  return Number.isFinite(num) && num > 0 ? num : 4;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(body.url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Only http/https URLs are supported" }, { status: 400 });
  }

  let html: string;
  try {
    const pageResponse = await fetch(parsedUrl.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PantryAndPlate/1.0)" },
    });
    if (!pageResponse.ok) {
      return NextResponse.json({ error: `Could not fetch that page (${pageResponse.status})` }, { status: 422 });
    }
    html = await pageResponse.text();
  } catch {
    return NextResponse.json({ error: "Could not fetch that page" }, { status: 422 });
  }

  const jsonLd = findRecipeJsonLd(html);
  if (jsonLd && jsonLd.recipeIngredient?.length) {
    return NextResponse.json({
      title: jsonLd.name ?? "Untitled recipe",
      servings: parseServings(jsonLd.recipeYield),
      ingredients: jsonLd.recipeIngredient.map((line) => ({ name: line, amount: null, unit: null })),
      instructions: instructionsToSteps(jsonLd.recipeInstructions),
      notes: jsonLd.description ?? null,
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "This page doesn't have structured recipe data, and reading it with AI requires ANTHROPIC_API_KEY to be set" },
      { status: 503 },
    );
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const pageText = stripHtml(html).slice(0, 15000);
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: pageText }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Could not find a recipe on that page" }, { status: 422 });
    }

    const parsed = parseJsonResponse(textBlock.text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Could not find a recipe on that page" }, { status: 422 });
  }
}
