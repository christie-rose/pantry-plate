import type { ElementType, ComponentPropsWithoutRef } from "react";

/** Shared button. Mirrored in the Plenty of Thyme design system; see scripts/build-design-system.mjs. */
export type ButtonVariant = "primary" | "secondary" | "danger";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brick font-medium text-white",
  secondary: "border border-cocoa/40 text-ink",
  danger: "border border-brick/50 text-brick",
};

type Props<T extends ElementType> = {
  as?: T;
  variant?: ButtonVariant;
  /** px-2 instead of px-3, used in the week selector. */
  compact?: boolean;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "variant" | "compact" | "className">;

export function Button<T extends ElementType = "button">({
  as,
  variant = "primary",
  compact,
  className = "",
  ...rest
}: Props<T>) {
  const Tag: ElementType = as ?? "button";
  const extra = Tag === "button" ? { type: (rest as { type?: string }).type ?? "button" } : {};
  return (
    <Tag
      {...extra}
      {...rest}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md text-sm disabled:opacity-40 ${
        compact ? "px-2" : "px-3"
      } ${VARIANTS[variant]} ${className}`}
    />
  );
}

/** A week-selector control that cannot be used: faded text and border. */
export function DisabledButton({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="flex min-h-[44px] items-center rounded-md border border-cocoa/20 px-2 text-sm text-cocoa/40"
    >
      {children}
    </span>
  );
}
