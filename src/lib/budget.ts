export type ExpenseInput = {
  date: string; // ISO date, e.g. "2026-09-05"
  amount: number;
  store: string;
  note: string | null;
};

export function validateExpenseInput(body: unknown): ExpenseInput | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Invalid request body" };
  }
  const b = body as Record<string, unknown>;

  const date = typeof b.date === "string" ? b.date : "";
  if (!date || Number.isNaN(new Date(date).getTime())) {
    return { error: "A valid date is required" };
  }

  const amount = Number(b.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number" };
  }

  const store = typeof b.store === "string" ? b.store.trim() : "";
  if (!store) return { error: "Store is required" };

  const note = typeof b.note === "string" && b.note.trim() ? b.note.trim() : null;

  return { date, amount, store, note };
}

/** "2026-09" for the given date, in local time. */
export function monthKeyFor(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function isInMonth(date: Date, monthKey: string): boolean {
  return monthKeyFor(date) === monthKey;
}

/**
 * Parses a "YYYY-MM-DD" date-only string as UTC noon, so the calendar date it represents
 * survives being stored/retrieved regardless of the server's or viewer's timezone offset.
 */
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

/** Formats a date-only value (stored via parseDateOnly) back using its UTC calendar date. */
export function formatDateOnly(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, { timeZone: "UTC" });
}
