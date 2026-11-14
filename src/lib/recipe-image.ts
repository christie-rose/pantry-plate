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

// Every photo keeps the app's rustic look and colors, but gets its own setting so the set does not look like it
// was all shot on one table with one dish.
const SURFACES = [
  "a worn, honey-brown wooden table",
  "a weathered whitewashed plank table",
  "a creamy plaster or limestone countertop",
  "a rumpled natural linen tablecloth",
  "a dark slate slab with a little flour dusted around",
  "an old farmhouse table painted a muted sage green and softly chipped",
  "a pale marble pastry slab",
  "a pale oak counter with a faint grain",
  "a cool grey zinc counter warmed by a linen cloth",
];

const PROPS = [
  "a sprig of fresh herbs beside the dish",
  "a folded linen napkin",
  "a small bowl of coarse salt",
  "a few of the raw ingredients scattered nearby",
  "a wooden spoon resting next to it",
  "an old brass spoon",
  "a small jug of olive oil or cream",
  "a simple fork and a cloth napkin",
  "nothing else on the table, a clean minimal composition",
  "a halved lemon or a few peppercorns for color",
];

const ANGLES = [
  "shot from directly overhead",
  "shot from a 45 degree angle",
  "shot from a low angle, almost level with the table",
  "a close, three-quarter view",
];

const LIGHTS = [
  "soft diffused window light from the left",
  "warm late-afternoon sunlight with gentle long shadows",
  "bright, airy morning light",
  "moody warm side light with soft shadows",
];

const GLAZES = [
  "creamy white",
  "oatmeal speckled",
  "soft sage green",
  "warm grey-beige",
  "butter yellow",
  "muted brick red",
  "pale blue-grey",
  "natural unglazed clay",
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Serving ware that suits the dish, with several choices so it varies, and a glaze color for ceramics. */
function servingWareFor(recipe: RecipeForPrompt): string {
  const ware = baseServingWare(recipe);
  return /ceramic|stoneware|earthenware|clay|ramekin|plate|platter|bowl|mug/.test(ware) ? `${ware} in a ${pick(GLAZES)} glaze` : ware;
}

function baseServingWare(recipe: RecipeForPrompt): string {
  const text = `${recipe.title} ${recipe.categories.join(" ")}`.toLowerCase();
  if (/drink|smoothie|lemonade|cocktail|tea|latte/.test(text)) return pick(["a simple glass", "a handmade ceramic mug", "a glass tumbler on a small cloth"]);
  if (/soup|stew|chili|chowder|curry|broth|ramen/.test(text)) return pick(["a deep handmade stoneware bowl", "a speckled ceramic bowl", "a cast-iron pot with a ladle"]);
  if (/sauce|dressing|dip|marinade|salsa|jam/.test(text)) return pick(["a small glass jar", "a little ceramic ramekin", "a rustic stoneware bowl with a spoon"]);
  if (/salad|slaw/.test(text)) return pick(["a wide handmade ceramic bowl", "a shallow wooden serving bowl", "a pale stoneware platter"]);
  if (/pie|casserole|lasagna|bake|gratin|cobbler/.test(text)) return pick(["a ceramic baking dish", "a stoneware pie dish", "a cast-iron skillet", "a rustic earthenware baking dish"]);
  if (/cookie|cake|bar|brownie|muffin|dessert|bread|scone/.test(text)) return pick(["a wooden board", "a simple cream plate", "a wire cooling rack on parchment", "a cake stand", "a stoneware plate"]);
  if (/breakfast|pancake|waffle|egg|oat|toast/.test(text)) return pick(["a stoneware plate", "a cast-iron skillet", "a rustic wooden board", "a speckled ceramic bowl"]);
  return pick([
    "a handmade stoneware plate",
    "a speckled ceramic platter",
    "a cast-iron skillet",
    "a shallow ceramic bowl",
    "a wooden serving board",
    "a hand-thrown clay plate",
    "a pale glazed plate",
  ]);
}

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
    `Served in ${servingWareFor(recipe)}, on ${pick(SURFACES)}, with ${pick(PROPS)}. Do not use dark-rimmed enamel dishes.`,
    `${pick(ANGLES)}, with ${pick(LIGHTS)}.`,
    // The look of the app, kept consistent across every photo: cream, brick red, sage green, butter yellow, cocoa brown.
    "Rustic, homemade, farmhouse feel with a warm, earthy, slightly muted color palette of cream, brick red, soft sage green, butter yellow and cocoa brown; avoid bright blues and harsh whites.",
    "A calm, film-like look with shallow depth of field. Make this image distinct in setting and composition from other food photos.",
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
