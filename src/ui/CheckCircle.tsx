import type { ReactNode } from "react";
import { RiCheckLine } from "@remixicon/react";

/**
 * The round mark: sage fill with a check when done, cocoa ring when not.
 * `children` (such as a step number) shows inside the ring while not done.
 * Use it inside a row that is already a button; use CheckCircle when the circle itself is the control.
 */
export function CheckMark({
  checked,
  children,
  className = "",
}: {
  checked: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium ${
        checked ? "border-sage bg-sage text-white" : "border-cocoa/40 text-cocoa"
      } ${className}`}
    >
      {checked ? <RiCheckLine size={16} aria-hidden /> : children}
    </span>
  );
}

/** The round check as its own control (grocery list): a button with role checkbox. */
export function CheckCircle({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className="shrink-0 rounded-full"
    >
      <CheckMark checked={checked} />
    </button>
  );
}
