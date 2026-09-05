export const LOCATIONS = ["Pantry", "Fridge", "Freezer"] as const;
export const STORES = ["Costco", "Albertsons", "WinCo", "Other"] as const;
export const STAPLE_STATUSES = ["In stock", "Low", "Out"] as const;

export type Location = (typeof LOCATIONS)[number];
export type Store = (typeof STORES)[number];
export type StapleStatus = (typeof STAPLE_STATUSES)[number];

export type PantryItemInput = {
  name: string;
  location: Location;
  preferredStore: Store;
  isStaple: boolean;
  stapleStatus: StapleStatus | null;
  quantity: string | null;
};

export function validatePantryItemInput(body: unknown): PantryItemInput | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Invalid request body" };
  }

  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) return { error: "Name is required" };

  const location = b.location;
  if (typeof location !== "string" || !LOCATIONS.includes(location as Location)) {
    return { error: "Invalid location" };
  }

  const preferredStore = b.preferredStore;
  if (typeof preferredStore !== "string" || !STORES.includes(preferredStore as Store)) {
    return { error: "Invalid preferred store" };
  }

  const isStaple = Boolean(b.isStaple);

  let stapleStatus: StapleStatus | null = null;
  let quantity: string | null = null;

  if (isStaple) {
    if (typeof b.stapleStatus !== "string" || !STAPLE_STATUSES.includes(b.stapleStatus as StapleStatus)) {
      return { error: "Invalid staple status" };
    }
    stapleStatus = b.stapleStatus as StapleStatus;
  } else {
    quantity = typeof b.quantity === "string" ? b.quantity.trim() || null : null;
  }

  return {
    name,
    location: location as Location,
    preferredStore: preferredStore as Store,
    isStaple,
    stapleStatus,
    quantity,
  };
}
