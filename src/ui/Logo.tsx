/**
 * The Plenty of Thyme wordmark: the whole name in Elsie Swash Caps, one weight and one color. `size` is the font
 * size in pixels. `tone="light"` is white, for a brick or dark background. Text only.
 */
export function Logo({ size = 24, tone = "ink" }: { size?: number; tone?: "ink" | "light" }) {
  return (
    <span
      className={`inline-block whitespace-nowrap font-logo leading-none ${tone === "light" ? "text-white" : "text-ink"}`}
      style={{ fontSize: size }}
      aria-label="Plenty of Thyme"
    >
      <span aria-hidden>Plenty of Thyme</span>
    </span>
  );
}
