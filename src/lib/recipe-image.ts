import sharp from "sharp";
import { prisma } from "@/lib/prisma";

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

/** Recipes whose image is being generated right now, so the page can show "Creating your photo…". */
const generating = new Map<string, number>();
/** The last generation error per recipe, shown once and then cleared. */
const lastErrors = new Map<string, string>();

export function isGenerating(recipeId: string) {
  return generating.has(recipeId);
}

export function takeLastError(recipeId: string) {
  const error = lastErrors.get(recipeId) ?? null;
  lastErrors.delete(recipeId);
  return error;
}

/** Turns any uploaded or generated picture into a rotated, 1000px-wide-at-most WebP. */
export async function processImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

export async function saveRecipeImage(recipeId: string, input: Buffer, source: "upload" | "ai") {
  const data = await processImage(input);
  const bytes = new Uint8Array(data);
  await prisma.recipeImage.upsert({
    where: { recipeId },
    create: { recipeId, data: bytes, mimeType: "image/webp", source },
    update: { data: bytes, mimeType: "image/webp", source },
  });
}

type RecipeForPrompt = {
  title: string;
  cuisine: string | null;
  categories: string[];
  ingredients: { name: string }[];
};

export function buildImagePrompt(recipe: RecipeForPrompt): string {
  const ingredients = recipe.ingredients
    .map((i) => i.name)
    .slice(0, 8)
    .join(", ");
  const context = [recipe.cuisine, ...recipe.categories].filter(Boolean).join(", ");
  return [
    `A rustic, appetizing food photograph of "${recipe.title}", homemade and ready to eat.`,
    ingredients ? `Visible ingredients include ${ingredients}.` : "",
    context ? `Style of dish: ${context}.` : "",
    // The look of the app: cream paper, brick red, sage green, butter yellow and cocoa brown.
    "Rustic farmhouse styling on a worn, warm brown wooden table with a handmade stoneware or enamel dish and a natural linen napkin.",
    "Warm, earthy, slightly muted color palette of cream, terracotta brick red, soft sage green herbs, butter yellow and cocoa brown; avoid bright blues and harsh whites.",
    "Soft natural window light, shallow depth of field, shot from a 45 degree angle, a calm film-like look.",
    "No text, no labels, no hands, no people.",
  ]
    .filter(Boolean)
    .join(" ");
}

export class ImageGenerationError extends Error {}

async function requestOpenAiImage(prompt: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ImageGenerationError("AI photos are not set up yet. The server needs an OPENAI_API_KEY.");
  }
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/v1/images/generations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5",
      prompt,
      size: "1024x1024",
      quality: "medium",
      n: 1,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("OpenAI image request failed", response.status, detail.slice(0, 300));
    if (response.status === 401) {
      throw new ImageGenerationError("The OpenAI key was not accepted. Check OPENAI_API_KEY on the server.");
    }
    if (response.status === 429 && detail.includes("insufficient_quota")) {
      throw new ImageGenerationError("The OpenAI account has no credit left. Add credit in OpenAI billing, then try again.");
    }
    throw new ImageGenerationError("The image service could not make a picture just now. Try again in a moment.");
  }
  const json = (await response.json()) as { data?: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new ImageGenerationError("The image service did not return a picture.");
  return Buffer.from(b64, "base64");
}

/** Generates a photo from the recipe's content and saves it, replacing any existing image. */
export async function generateImageForRecipe(recipeId: string): Promise<void> {
  if (generating.has(recipeId)) return;
  generating.set(recipeId, Date.now());
  lastErrors.delete(recipeId);
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { title: true, cuisine: true, categories: true, ingredients: { select: { name: true } } },
    });
    if (!recipe) return;
    const image = await requestOpenAiImage(buildImagePrompt(recipe));
    await saveRecipeImage(recipeId, image, "ai");
  } catch (error) {
    const message = error instanceof ImageGenerationError ? error.message : "Something went wrong making the picture.";
    lastErrors.set(recipeId, message);
    if (!(error instanceof ImageGenerationError)) console.error("Image generation failed", error);
    throw error;
  } finally {
    generating.delete(recipeId);
  }
}
