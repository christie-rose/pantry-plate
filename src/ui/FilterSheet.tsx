import { useEffect } from "react";
import type { ReactNode } from "react";
import { RiCloseLine, RiFilter3Line } from "@remixicon/react";
import { Button } from "./Button";

/** The button that opens the filters. `count` is how many filters are on; it shows as a brick badge. */
export function FilterButton({ count = 0, onClick }: { count?: number; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-cocoa/40 px-3 text-sm text-ink"
    >
      <RiFilter3Line size={18} aria-hidden />
      Filters
      {count > 0 && (
        <span className="rounded-full bg-brick px-2 py-0.5 text-xs font-medium leading-none text-white">{count}</span>
      )}
    </button>
  );
}

/**
 * The filters flyover: a panel that slides in from the right on larger screens and rises from the bottom on phones,
 * over a 40% ink scrim. Filters apply as you choose them; "Clear all" resets them and the main button closes it.
 */
export function FilterSheet({
  title = "Filters",
  onClose,
  onClear,
  doneLabel = "Done",
  children,
  inline,
}: {
  title?: string;
  onClose: () => void;
  onClear: () => void;
  /** The text of the main button, such as "Show 12 recipes". */
  doneLabel?: string;
  children: ReactNode;
  /** Render in place instead of covering the screen (used for the design system preview). */
  inline?: boolean;
}) {
  useEffect(() => {
    if (inline) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inline, onClose]);

  return (
    <div
      className={`${inline ? "relative" : "fixed inset-0 z-50"} flex items-end bg-ink/40 md:items-stretch md:justify-end`}
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85dvh] w-full flex-col bg-white shadow-[var(--shadow-card)] md:max-h-none md:w-96"
      >
        <header className="flex items-center justify-between border-b border-cocoa/20 px-4 py-2">
          <h2 className="text-lg font-medium text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-10 w-10 items-center justify-center rounded-md text-cocoa hover:bg-paper-alt"
          >
            <RiCloseLine size={20} aria-hidden />
          </button>
        </header>
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">{children}</div>
        <footer className="flex gap-2 border-t border-cocoa/20 p-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-3">
          <Button variant="secondary" onClick={onClear}>
            Clear all
          </Button>
          <Button className="flex-1" onClick={onClose}>
            {doneLabel}
          </Button>
        </footer>
      </section>
    </div>
  );
}

/** A labelled set of choices inside the flyover, usually filter chips. */
export function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-cocoa">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/** An on/off choice inside the flyover, such as showing checked items. */
export function FilterToggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 cursor-pointer accent-sage"
      />
      {children}
    </label>
  );
}
