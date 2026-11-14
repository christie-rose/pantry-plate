import { RiCheckLine } from "@remixicon/react";

/** Round check used for ingredients and grocery items: sage fill with a check when done, cocoa ring when not. */
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
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
        checked ? "border-sage bg-sage text-white" : "border-cocoa/40"
      }`}
    >
      {checked && <RiCheckLine size={16} aria-hidden />}
    </button>
  );
}
