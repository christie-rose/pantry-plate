import type { ReactNode } from "react";
import { RiCloseLine, RiMenuLine } from "@remixicon/react";

/** Desktop side rail: wordmark and links on top, footer links pinned to the bottom. */
export function SideRail({ brand, children, footer, preview }: { brand: ReactNode; children: ReactNode; footer: ReactNode; preview?: boolean }) {
  return (
    <nav
      className={`flex w-56 shrink-0 flex-col border-r border-cocoa/20 bg-white ${
        preview ? "min-h-[380px]" : "hidden md:sticky md:top-0 md:flex md:h-screen"
      }`}
    >
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        <div className="mb-4 text-xl text-brick">{brand}</div>
        {children}
      </div>
      <div className="flex shrink-0 flex-col gap-1 border-t border-cocoa/20 bg-white p-4 pt-2">{footer}</div>
    </nav>
  );
}

/** Mobile top bar: wordmark and a round hamburger. */
export function MobileBar({ brand, open, onToggle, preview }: { brand: ReactNode; open: boolean; onToggle: () => void; preview?: boolean }) {
  return (
    <header
      className={`z-30 flex min-h-[56px] items-center justify-between border-b border-cocoa/20 bg-white px-4 ${
        preview ? "" : "sticky top-0 md:hidden"
      }`}
    >
      <div className="text-lg text-brick">{brand}</div>
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full text-ink"
      >
        {open ? <RiCloseLine size={24} aria-hidden /> : <RiMenuLine size={24} aria-hidden />}
      </button>
    </header>
  );
}

/** Mobile menu: links dropping below the bar over a 40% ink scrim. */
export function MobileMenu({ onClose, children, footer, preview }: { onClose: () => void; children: ReactNode; footer: ReactNode; preview?: boolean }) {
  return (
    <div className={preview ? "relative" : "fixed inset-0 z-20 md:hidden"}>
      <div className={preview ? "hidden" : "absolute inset-0 bg-ink/40"} onClick={onClose} />
      <nav
        className={`flex flex-col gap-1 border-b border-cocoa/20 bg-white p-4 shadow-lg ${
          preview ? "" : "absolute inset-x-0 top-[56px]"
        }`}
      >
        {children}
        <div className="mt-2 flex flex-col gap-1 border-t border-cocoa/20 pt-2">{footer}</div>
      </nav>
    </div>
  );
}
