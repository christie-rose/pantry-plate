import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";
import { CheckCircle } from "./CheckCircle";

export function GroceryList({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col divide-y-2 divide-dotted divide-cocoa/30 rounded-md border border-cocoa/30 bg-white">{children}</ul>;
}

/**
 * One line: round check, content (text or an edit field), and an optional aside (the tag).
 * With `onSwipeDelete`, a touch swipe to the left past 40% of the row reveals a brick trash panel and deletes the line.
 */
export function GroceryRow({
  checked,
  onToggle,
  checkLabel,
  aside,
  onSwipeDelete,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  checkLabel: string;
  aside?: ReactNode;
  onSwipeDelete?: () => void;
  children: ReactNode;
}) {
  const [dx, setDx] = useState(0);
  const [settling, setSettling] = useState(false);
  const start = useRef<{ x: number; y: number; width: number } | null>(null);
  const swiping = useRef(false);

  function onPointerDown(e: React.PointerEvent<HTMLLIElement>) {
    if (!onSwipeDelete || e.pointerType !== "touch") return;
    start.current = { x: e.clientX, y: e.clientY, width: e.currentTarget.offsetWidth };
    swiping.current = false;
    setSettling(false);
  }
  function onPointerMove(e: React.PointerEvent<HTMLLIElement>) {
    const s = start.current;
    if (!s) return;
    const moveX = e.clientX - s.x;
    const moveY = e.clientY - s.y;
    if (!swiping.current) {
      if (Math.abs(moveX) < 10 || Math.abs(moveX) < Math.abs(moveY)) return;
      swiping.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }
    setDx(Math.min(0, moveX));
  }
  function end() {
    const s = start.current;
    start.current = null;
    if (!s || !swiping.current) return;
    swiping.current = false;
    setSettling(true);
    if (-dx > s.width * 0.4) {
      setDx(-s.width);
      setTimeout(() => onSwipeDelete?.(), 180);
    } else {
      setDx(0);
    }
  }

  return (
    <li
      className="relative touch-pan-y overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {dx < 0 && (
        <div aria-hidden className="absolute inset-0 flex items-center justify-end bg-brick pr-6 text-white">
          <RiDeleteBinLine size={22} />
        </div>
      )}
      <div
        className="relative flex items-center gap-2 bg-white pr-3"
        style={{ transform: `translateX(${dx}px)`, transition: settling ? "transform 180ms ease-out" : "none" }}
      >
        <div className="flex min-h-[48px] min-w-0 flex-1 items-center gap-3 p-3">
          <CheckCircle checked={checked} onToggle={onToggle} label={checkLabel} />
          {children}
        </div>
        {aside}
      </div>
    </li>
  );
}

/** Round button above the list that adds a new line. */
export function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add item"
      title="Add item"
      className="flex h-12 w-12 items-center justify-center self-start rounded-full bg-sage text-white shadow-sm"
    >
      <RiAddLine size={24} aria-hidden />
    </button>
  );
}
