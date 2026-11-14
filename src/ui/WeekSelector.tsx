import type { ElementType } from "react";
import { Button, DisabledButton } from "./Button";

/** Meal Plan header controls. Pass `as={Link}` (or any link component) and hrefs; null means unavailable. */
export function WeekSelector({
  label,
  as,
  thisWeekHref,
  prevHref,
  nextHref,
  nextDisabledTitle,
}: {
  label: string;
  as?: ElementType;
  /** Shown only when not already on the current week. */
  thisWeekHref?: string | null;
  prevHref: string | null;
  nextHref: string | null;
  nextDisabledTitle?: string;
}) {
  const B = Button as ElementType;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {thisWeekHref && (
        <B as={as ?? "a"} variant="secondary" compact href={thisWeekHref} className="font-medium text-brick">
          This week
        </B>
      )}
      {prevHref ? (
        <B as={as ?? "a"} variant="secondary" compact href={prevHref}>
          ← Prev
        </B>
      ) : (
        <DisabledButton>← Prev</DisabledButton>
      )}
      <span className="font-medium text-ink">{label}</span>
      {nextHref ? (
        <B as={as ?? "a"} variant="secondary" compact href={nextHref}>
          Next →
        </B>
      ) : (
        <DisabledButton title={nextDisabledTitle}>Next →</DisabledButton>
      )}
    </div>
  );
}
