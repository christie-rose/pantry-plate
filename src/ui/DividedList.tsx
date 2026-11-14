import type { ReactNode } from "react";

/** A list whose rows are separated by dotted lines, as on the notebook pages. */
export function DividedList({
  as = "ul",
  className = "",
  children,
}: {
  as?: "ul" | "ol";
  className?: string;
  children: ReactNode;
}) {
  const Tag = as;
  return <Tag className={`flex flex-col divide-y-2 divide-dotted divide-cocoa/30 ${className}`}>{children}</Tag>;
}
