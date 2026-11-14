import type { ButtonHTMLAttributes } from "react";

/** The "Add" control at the bottom of a card: a small hand-drawn dashed circle with a plus and a brush label. */
export function AddLink({ children = "Add", className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex min-h-[36px] items-center gap-1.5 self-start rounded-md pr-2 text-brick ${className}`}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path strokeDasharray="3.2 2.6" d="M12 2.8c5.2-.3 9.4 3.6 9.2 9.1-.2 5.3-4.4 9.2-9.6 9.2-5 0-9-4-8.8-9.2C3 6.5 7 3 12 2.8z" />
        <path d="M12 8v8M8 12h8" />
      </svg>
      <span className="font-title text-lg leading-none">{children}</span>
    </button>
  );
}
