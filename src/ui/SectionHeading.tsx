import type { ReactNode } from "react";

/** A section heading with a loose hand-drawn brick underline, like "Ingredients:" in a recipe notebook. */
export function SectionHeading({
  children,
  size = "md",
  tone = "ink",
}: {
  children: ReactNode;
  /** md is for headings inside cards, lg for sections of a page. */
  size?: "md" | "lg";
  tone?: "ink" | "brick";
}) {
  return (
    <h2 className={`w-fit ${size === "lg" ? "text-2xl" : "text-xl"} ${tone === "brick" ? "text-brick" : "text-ink"}`}>
      <span className="flex items-center gap-2">{children}</span>
      <svg
        viewBox="0 0 200 8"
        preserveAspectRatio="none"
        aria-hidden
        className="block h-[7px] w-full text-brick"
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
