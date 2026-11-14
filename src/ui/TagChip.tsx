import type { ButtonHTMLAttributes } from "react";

/** A free-form tag on a grocery item. `add` is the dashed "+ tag" placeholder. */
export function TagChip({
  add,
  className = "",
  ...rest
}: { add?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={`shrink-0 rounded-full px-3 py-1 text-xs ${
        add ? "border border-dashed border-cocoa/40 text-cocoa" : "bg-sage/20 text-ink"
      } ${className}`}
    />
  );
}
