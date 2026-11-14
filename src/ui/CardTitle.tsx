import type { ReactNode } from "react";

/** The title row of a day or meal card: a brush title, and a small note on the right such as the date. */
export function CardTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <h3 className="font-title text-2xl leading-tight text-ink">{children}</h3>
      {aside && <span className="text-xs text-cocoa">{aside}</span>}
    </div>
  );
}
