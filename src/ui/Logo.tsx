/**
 * The A Tavola wordmark: a big brush "A" in brick with "Tavola" beside it in ink. `size` is the height of the word
 * "Tavola" in pixels; the "A" is half as large again. Text only, set in the title font token.
 */
export function Logo({ size = 24, tone = "color" }: { size?: number; tone?: "color" | "light" }) {
  const a = tone === "light" ? "text-white" : "text-brick";
  const t = tone === "light" ? "text-white" : "text-ink";
  return (
    <span
      className="inline-flex items-baseline whitespace-nowrap font-title leading-none"
      style={{ fontSize: size, gap: size * 0.1 }}
      aria-label="A Tavola"
    >
      <span className={a} style={{ fontSize: "1.5em" }} aria-hidden>
        A
      </span>
      <span className={t} aria-hidden>
        Tavola
      </span>
    </span>
  );
}
