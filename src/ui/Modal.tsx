import type { ReactNode } from "react";
import { RiCloseLine } from "@remixicon/react";

/** Centered panel over a 40% ink scrim. Clicking the scrim closes it. */
export function Modal({
  title,
  onClose,
  children,
  inline,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Render in place instead of covering the screen (used for the design system preview). */
  inline?: boolean;
}) {
  return (
    <div
      className={`${inline ? "relative" : "fixed inset-0 z-50"} flex items-center justify-center bg-ink/40 p-4`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-md flex-col gap-3 rounded-lg bg-white p-4 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-brick">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md text-cocoa hover:bg-paper-alt"
          >
            <RiCloseLine size={20} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
