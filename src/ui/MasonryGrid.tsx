import { Children, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

const WIDE = "(min-width: 640px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * A masonry layout: cards sit in columns and each is only as tall as its content, so a short card never leaves a gap
 * beside a tall one. Each card goes in whichever column is currently shortest, so a sorted list still reads roughly
 * left to right. `weights` gives a rough relative height for each card (a card with a photo might be 3, one without
 * 1); without it every card counts the same. One column on phones; `columns` columns from 640px up.
 */
export function MasonryGrid({
  children,
  columns = 2,
  weights,
}: {
  children: ReactNode;
  columns?: number;
  weights?: number[];
}) {
  const wide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
  const count = wide ? Math.max(1, columns) : 1;
  const items = Children.toArray(children);
  const lanes: ReactNode[][] = Array.from({ length: count }, () => []);
  const heights: number[] = Array.from({ length: count }, () => 0);
  items.forEach((item, i) => {
    let shortest = 0;
    for (let lane = 1; lane < count; lane++) if (heights[lane] < heights[shortest]) shortest = lane;
    lanes[shortest].push(item);
    heights[shortest] += weights?.[i] ?? 1;
  });

  return (
    <div className="flex items-start gap-4">
      {lanes.map((lane, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col gap-4">
          {lane}
        </div>
      ))}
    </div>
  );
}
