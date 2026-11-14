import type { ReactNode } from "react";

// A closed rectangle whose edges ripple, drawn once in a 400 x 200 box and stretched to fit.
function wavyRectPath(nx = 9, ny = 3, amp = 3, inset = 3): string {
  const w = 400 - inset * 2;
  const h = 200 - inset * 2;
  const pts: string[] = [`M${inset} ${inset}`];
  const wave = (x0: number, y0: number, dx: number, dy: number, n: number, nx2: number, ny2: number) => {
    const sx = dx / n;
    const sy = dy / n;
    for (let i = 0; i < n; i++) {
      const dir = i % 2 === 0 ? -1 : 1;
      pts.push(`q${sx / 2 + nx2 * dir * amp} ${sy / 2 + ny2 * dir * amp} ${sx} ${sy}`);
    }
  };
  wave(inset, inset, w, 0, nx, 0, 1); // top, left to right
  wave(inset + w, inset, 0, h, ny, 1, 0); // right, top to bottom
  wave(inset + w, inset + h, -w, 0, nx, 0, -1); // bottom, right to left
  wave(inset, inset + h, 0, -h, ny, -1, 0); // left, bottom to top
  return pts.join(" ") + "Z";
}

const PATH = wavyRectPath();

/** Wraps content in a loose, hand-drawn wavy brick frame, like the Caprese page. Use for the one thing to notice, such as today. */
export function WavyFrame({
  children,
  className = "",
  active = true,
}: {
  children: ReactNode;
  className?: string;
  /** Draw the frame only when true, so a list can wrap every card and frame just one. */
  active?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      {active && (
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full text-brick"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={PATH} vectorEffect="non-scaling-stroke" />
      </svg>
      )}
      {children}
    </div>
  );
}
