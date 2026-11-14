import type { ElementType, ComponentPropsWithoutRef } from "react";

type Props<T extends ElementType> = {
  as?: T;
  active?: boolean;
  /** Quieter cocoa text, used for Log out. */
  muted?: boolean;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "active" | "muted" | "className">;

/** One row of the side rail or mobile menu. */
export function NavLink<T extends ElementType = "a">({ as, active, muted, className = "", ...rest }: Props<T>) {
  const Tag: ElementType = as ?? "a";
  return (
    <Tag
      aria-current={active ? "page" : undefined}
      {...rest}
      className={`flex min-h-[44px] items-center gap-3 rounded-md px-3 text-left text-sm ${
        active ? "bg-paper-alt font-medium text-brick" : muted ? "text-cocoa" : "text-ink"
      } ${className}`}
    />
  );
}
