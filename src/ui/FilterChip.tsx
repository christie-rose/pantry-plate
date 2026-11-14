import type { ButtonHTMLAttributes } from "react";

/** Pill toggle used for filtering (grocery tags). */
export function FilterChip({
  selected,
  className = "",
  ...rest
}: { selected: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      {...rest}
      className={`min-h-[36px] rounded-full border px-3 text-sm ${
        selected ? "border-brick bg-paper-alt font-medium text-brick" : "border-cocoa/40 text-ink"
      } ${className}`}
    />
  );
}
