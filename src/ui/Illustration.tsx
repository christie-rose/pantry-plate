export type IllustrationName = "tomato" | "basil" | "lemon" | "bowl";

const LINE = "fill-none stroke-ink";

/**
 * Small ink-line drawings with a loose color wash laid slightly off the line, like a watercolor notebook.
 * Colors come from the design system tokens (brick, sage, butter).
 */
export function Illustration({ name, size = 96 }: { name: IllustrationName; size?: number }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden
      className="shrink-0"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "tomato" && (
        <>
          <path className="fill-brick/55" d="M24 70c0-24 16-38 40-38s37 14 37 38-17 35-39 35-38-12-38-35z" />
          <path className={LINE} d="M20 64c1-23 18-36 40-36 24 0 40 14 40 37 0 22-17 35-40 35S19 87 20 64z" />
          <path className="fill-sage/60" d="M60 33c-7-1-13 3-20 1 6 5 12 6 20 5 8 1 13 0 19-5-6 2-12-2-19-1z" />
          <path className={LINE} d="M60 30c-6-1-12 3-18 1 6 4 11 5 18 4 7 1 12 0 18-4-6 2-12-2-18-1zM60 30c0-6 1-10 4-14" />
          <path className="fill-none stroke-ink/40" d="M34 54c3-6 8-9 14-10" />
        </>
      )}
      {name === "basil" && (
        <>
          <path className="fill-sage/60" d="M63 66c-14-2-26-12-26-26 14 0 26 8 26 26zM66 66c14-2 26-12 26-26-14 0-26 8-26 26zM63 54c-9-8-10-22 0-34 10 12 9 26 0 34z" />
          <path className={LINE} d="M60 108c0-20 2-38 0-58" />
          <path className={LINE} d="M60 62c-14-2-26-12-26-26 14 0 26 8 26 26zM60 62c14-2 26-12 26-26-14 0-26 8-26 26zM60 50c-9-8-10-22 0-34 10 12 9 26 0 34z" />
          <path className="fill-none stroke-ink/40" d="M60 62c-8-6-14-14-18-22M60 62c8-6 14-14 18-22M60 50c-3-8-3-18 0-28" />
        </>
      )}
      {name === "lemon" && (
        <>
          <path className="fill-butter/75" d="M22 68c6-16 22-24 42-24 22 0 38 10 44 24-6 14-22 22-44 22-20 0-36-8-42-22z" />
          <path className={LINE} d="M18 62c6-16 22-24 42-24 22 0 38 10 44 24-6 14-22 22-44 22-20 0-36-8-42-22zM18 62l-6-2M104 62l6-2" />
          <path className="fill-none stroke-ink/40" d="M34 56c6-6 14-8 22-8" />
          <path className="fill-sage/60" d="M70 38c6-10 16-12 24-8-4 8-14 12-24 8z" />
          <path className={LINE} d="M70 38c6-10 16-12 24-8-4 8-14 12-24 8z" />
        </>
      )}
      {name === "bowl" && (
        <>
          <path className="fill-butter/65" d="M24 64h80c0 22-15 38-40 38S24 86 24 64z" />
          <path className={LINE} d="M20 58h80c0 24-16 40-40 40S20 82 20 58z" />
          <path className={LINE} d="M20 58c10-6 70-6 80 0" />
          <path className={LINE} d="M80 50L104 14" />
          <path className="fill-brick/50 stroke-ink" d="M101 20c3-5 8-6 10-3s-1 8-6 11z" />
          <path className="fill-none stroke-ink/40" d="M44 42c-4-6 4-10 0-16M60 42c-4-6 4-10 0-16" />
        </>
      )}
    </svg>
  );
}
