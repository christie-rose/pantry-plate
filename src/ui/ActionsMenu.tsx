import { useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { RiMore2Fill } from "@remixicon/react";

/** A kebab button that opens a small panel. Children receive `close` to dismiss it after an action. */
export function ActionsMenu({
  children,
  defaultOpen = false,
  size = "sm",
  label = "Actions",
}: {
  children: (close: () => void) => ReactNode;
  defaultOpen?: boolean;
  /** sm is the 32px button inside cards; lg is a 44px bordered button for a page header. */
  size?: "sm" | "lg";
  /** Accessible name of the button, such as "Recipe actions". */
  label?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          size === "lg"
            ? "flex h-11 w-11 items-center justify-center rounded-md border border-cocoa/40 text-ink hover:bg-cocoa/10"
            : "flex h-8 w-8 items-center justify-center rounded-md text-cocoa hover:bg-cocoa/10"
        }
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <RiMore2Fill size={size === "lg" ? 22 : 18} aria-hidden />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 flex w-52 flex-col gap-2 rounded-md border border-cocoa/30 bg-white p-2 text-xs shadow-lg">
            {children(() => setOpen(false))}
          </div>
        </>
      )}
    </div>
  );
}

/** One action in an ActionsMenu. `tone` colors it: ink for everyday actions, sage for adding to a list, brick for removing. */
export function MenuItem({
  tone,
  icon,
  className = "",
  children,
  ...rest
}: { tone: "sage" | "ink" | "danger"; icon?: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const tones = {
    sage: "text-sage hover:bg-sage/10 disabled:opacity-50",
    ink: "text-ink hover:bg-paper-alt disabled:opacity-50",
    danger: "text-brick hover:bg-brick/10",
  };
  return (
    <button
      type="button"
      role="menuitem"
      {...rest}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left ${tones[tone]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
