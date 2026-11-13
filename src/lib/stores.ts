export const STORES = ["Costco", "Albertsons", "WinCo", "Other"] as const;
export type Store = (typeof STORES)[number];
