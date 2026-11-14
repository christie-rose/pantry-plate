import type { ReactNode } from "react";
import { RiAddLine } from "@remixicon/react";

export function GroceryList({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col divide-y divide-cocoa/20 rounded-md border border-cocoa/30 bg-white">{children}</ul>;
}

/** One line: checkbox, content (text or an edit field), and an optional aside (the tag). */
export function GroceryRow({
  checked,
  onToggle,
  checkLabel,
  aside,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  checkLabel: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex items-center gap-2 pr-3">
      <div className="flex min-h-[48px] min-w-0 flex-1 items-center gap-3 p-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={checkLabel}
          className="h-5 w-5 shrink-0 cursor-pointer accent-sage"
        />
        {children}
      </div>
      {aside}
    </li>
  );
}

/** Round button above the list that adds a new line. */
export function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add item"
      title="Add item"
      className="flex h-12 w-12 items-center justify-center self-start rounded-full bg-sage text-white shadow-sm"
    >
      <RiAddLine size={24} aria-hidden />
    </button>
  );
}
