import type { ReactNode } from "react";

/**
 * A heading with a loose hand-drawn brick underline, like "Ingredients:" in a recipe notebook.
 * `md` is the title of a card (brush script, ink); `lg` is a section heading on a page (Karla medium, brick).
 */
export function SectionHeading({
  children,
  size = "md",
  tone = "ink",
}: {
  children: ReactNode;
  size?: "md" | "lg";
  tone?: "ink" | "brick";
}) {
  const type = size === "lg" ? "text-xl font-medium" : "font-title text-2xl";
  return (
    <h2 className={`relative w-fit pb-[7px] ${type} ${tone === "brick" ? "text-brick" : "text-ink"}`}>
      <span className="flex items-center gap-2">{children}</span>
      <svg
        viewBox="0 0 200 8"
        preserveAspectRatio="none"
        aria-hidden
        className="absolute bottom-0 left-0 block h-[7px] w-full text-brick"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      >
        <path d="M2 5.2C24 2.4 50 6.4 84 3.8S150 5.8 198 2.6" vectorEffect="non-scaling-stroke" />
      </svg>
    </h2>
  );
}
