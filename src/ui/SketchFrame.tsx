import type { ReactNode } from "react";

/**
 * A loose pencil outline drawn just outside a card, following its shape but a little off and a little imperfect,
 * like it was traced by hand. In the app it marks today in the Meal Plan. Use it for the one thing to notice on a
 * screen, never on every card. The card inside keeps its own border.
 */
export function SketchFrame({
  children,
  className = "",
  active = true,
}: {
  children: ReactNode;
  className?: string;
  /** Draw the outline only when true, so a list can wrap every card and outline just one. */
  active?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      {active && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-[5px] translate-x-px translate-y-[2px] -rotate-[0.4deg] rounded-[5px_17px_7px_15px/16px_6px_15px_7px] border-[1.6px] border-brick/80"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-[3px] -translate-x-px rotate-[0.3deg] rounded-[6px_15px_5px_18px/14px_7px_16px_6px] border border-brick/35"
          />
        </>
      )}
      {children}
    </div>
  );
}
