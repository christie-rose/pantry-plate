import type { ReactNode } from "react";

/** The page title: brush script (the `title` font token), 36px, brick. One per screen. */
export function PageTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h1 className={`text-4xl leading-tight text-brick ${className}`}>{children}</h1>;
}
