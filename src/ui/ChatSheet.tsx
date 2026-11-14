import type { ReactNode } from "react";
import { RiCloseLine, RiQuestionAnswerLine } from "@remixicon/react";

/** The floating "Ask AI" button that opens the cooking helper. */
export function AskButton({ onClick, inline }: { onClick?: () => void; inline?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${inline ? "" : "fixed bottom-4 right-4 z-40"} flex min-h-[48px] items-center gap-2 rounded-full bg-brick px-5 text-sm font-medium text-white shadow-[var(--shadow-card)]`}
    >
      <RiQuestionAnswerLine size={20} aria-hidden />
      Ask AI
    </button>
  );
}

/**
 * The chat panel: a bottom sheet on phones, a panel in the bottom-right corner on larger screens.
 * `headerAction` sits beside the close button; `footer` holds the message box.
 */
export function ChatSheet({
  title,
  onClose,
  headerAction,
  children,
  footer,
  inline,
}: {
  title: string;
  onClose: () => void;
  headerAction?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Render in place instead of fixed to the screen (used for the design system preview). */
  inline?: boolean;
}) {
  return (
    <section
      role="dialog"
      aria-label={title}
      className={`${
        inline
          ? "relative h-[440px] w-full max-w-md"
          : "fixed inset-x-0 bottom-0 z-50 h-[78vh] md:inset-x-auto md:bottom-4 md:right-4 md:h-[36rem] md:w-[26rem]"
      } flex flex-col bg-white shadow-[var(--shadow-card)]`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-cocoa/20 px-4 py-2">
        <h2 className="font-title text-xl leading-none text-brick">{title}</h2>
        <div className="flex items-center gap-1">
          {headerAction}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-md text-cocoa hover:bg-paper-alt"
          >
            <RiCloseLine size={20} aria-hidden />
          </button>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">{children}</div>
      {footer && <footer className="border-t border-cocoa/20 p-3">{footer}</footer>}
    </section>
  );
}

/** One message in the chat. The cook's are brick on the right; the helper's are paper-alt on the left. */
export function ChatBubble({ role, children }: { role: "user" | "assistant"; children: ReactNode }) {
  return (
    <div
      className={`max-w-[88%] whitespace-pre-wrap rounded-md px-3 py-2 text-sm leading-relaxed ${
        role === "user" ? "ml-auto bg-brick text-white" : "bg-paper-alt text-ink"
      }`}
    >
      {children}
    </div>
  );
}

/** A suggestion from the helper, with actions the cook can choose. Nothing is applied until they choose. */
export function SuggestionCard({ title, children, actions }: { title: string; children: ReactNode; actions: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border border-cocoa/30 bg-white p-3">
      <p className="font-medium text-sm text-ink">{title}</p>
      <p className="text-sm text-ink">{children}</p>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}
