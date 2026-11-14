import type { ElementType, ComponentPropsWithoutRef } from "react";

type Props<T extends ElementType> = { as?: T; className?: string } & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

/** The signature card. The shape (`.card`) is generated into globals.css from the radius tokens. */
export function Card<T extends ElementType = "div">({ as, className = "", ...rest }: Props<T>) {
  const Tag: ElementType = as ?? "div";
  return <Tag {...rest} className={`card ${className}`} />;
}
