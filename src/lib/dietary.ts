export const DIETARY_CATEGORIES = ["Allergy", "Diet", "Dislike", "Preference"] as const;
export type DietaryCategory = (typeof DIETARY_CATEGORIES)[number];

export type DietaryEntryInput = {
  name: string;
  category: DietaryCategory;
  detail: string | null;
};

export function validateDietaryEntryInput(body: unknown): DietaryEntryInput | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Invalid request body" };
  }
  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) return { error: "Name is required" };

  const category = b.category;
  if (typeof category !== "string" || !DIETARY_CATEGORIES.includes(category as DietaryCategory)) {
    return { error: "Invalid category" };
  }

  const detail = typeof b.detail === "string" && b.detail.trim() ? b.detail.trim() : null;

  return { name, category: category as DietaryCategory, detail };
}
