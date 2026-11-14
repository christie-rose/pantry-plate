import type { ReactNode } from "react";
import { Illustration } from "./Illustration";
import type { IllustrationName } from "./Illustration";

/** What a screen shows when there is nothing to list yet: a small drawing, a brush headline and one line of help. */
export function EmptyState({
  art,
  title,
  children,
  compact,
}: {
  art: IllustrationName;
  title: string;
  children?: ReactNode;
  /** Smaller, for use inside a card, modal or list. */
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "gap-1 p-4" : "gap-2 py-6"}`}>
      <Illustration name={art} size={compact ? 56 : 96} />
      <p className={`font-title text-ink ${compact ? "text-lg" : "text-2xl"}`}>{title}</p>
      {children && <p className="max-w-sm text-sm text-cocoa">{children}</p>}
    </div>
  );
}
