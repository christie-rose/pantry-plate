import type { ReactNode } from "react";
import { Illustration } from "./Illustration";

/**
 * A recipe's photo, or a calm placeholder when it has none. `hero` is the large image on a recipe page; `thumb` is
 * the smaller one on a list card. Every photo, uploaded or AI-made, gets a very light warm tone so the set sits well together. `busy` shows the placeholder as "being made". `action` is placed top right, for
 * the change-image menu.
 */
export function RecipeImage({
  src,
  alt,
  busy,
  size = "hero",
  action,
}: {
  src?: string | null;
  alt: string;
  busy?: boolean;
  size?: "hero" | "thumb";
  action?: ReactNode;
}) {
  const hero = size === "hero";
  return (
    <div
      className={`relative w-full overflow-hidden shadow-[var(--shadow-card)] bg-paper-alt ${
        hero ? "aspect-[3/2]" : "aspect-[4/3]"
      }`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover [filter:sepia(0.14)_saturate(0.92)]" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
          <Illustration name="bowl" size={hero ? 72 : 44} />
          <p className={`font-title text-ink ${hero ? "text-xl" : "text-sm"}`}>
            {busy ? "Creating your photo…" : hero ? "No photo yet" : ""}
          </p>
        </div>
      )}
      {action && <div className="absolute right-2 top-2 rounded-md bg-white/90 shadow-sm">{action}</div>}
    </div>
  );
}
