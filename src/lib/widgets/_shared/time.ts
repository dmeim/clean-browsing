/**
 * Shared timing helpers for Timer and Stopwatch widgets.
 *
 * Design note: neither widget runs a millisecond counter. The source of
 * truth is `Date.now()` (epoch ms, UTC-based) stored on state transitions,
 * and the elapsed/remaining value is computed by subtraction on every
 * read. A RAF loop inside each component only bumps a repaint trigger so
 * Svelte's `$derived` recomputes the display — it does not accumulate time.
 */

export type ElapsedPrecision = "ms" | "cs" | "s" | "hms";

/**
 * Format a non-negative millisecond duration for display.
 *
 * - `ms`  → `M:SS.mmm`  (three-digit milliseconds)
 * - `cs`  → `M:SS.cc`   (two-digit centiseconds)
 * - `s`   → `M:SS`      (whole seconds)
 * - `hms` → `H:MM:SS`   (hours always shown)
 *
 * Hours are shown automatically in `ms`/`cs`/`s` when the duration is at
 * least one hour, so `formatElapsed(3_661_000, "s")` returns `1:01:01`.
 */
export function formatElapsed(ms: number, precision: ElapsedPrecision): string {
  const safe = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (precision === "hms") {
    return `${hours}:${mm}:${ss}`;
  }

  const base = hours > 0 ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`;

  if (precision === "s") return base;
  if (precision === "cs") {
    const cs = Math.floor((safe % 1000) / 10);
    return `${base}.${String(cs).padStart(2, "0")}`;
  }
  // precision === "ms"
  const msFrac = safe % 1000;
  return `${base}.${String(msFrac).padStart(3, "0")}`;
}

/**
 * Split a millisecond duration into h/m/s fields for UI inputs.
 */
export function msToHms(ms: number): { hours: number; minutes: number; seconds: number } {
  const safe = Math.max(0, Math.floor(ms / 1000));
  return {
    hours: Math.floor(safe / 3600),
    minutes: Math.floor((safe % 3600) / 60),
    seconds: safe % 60,
  };
}

/**
 * Compose h/m/s fields back into milliseconds. Negative or non-finite
 * inputs are clamped to zero.
 */
export function hmsToMs(hours: number, minutes: number, seconds: number): number {
  const h = Number.isFinite(hours) ? Math.max(0, Math.floor(hours)) : 0;
  const m = Number.isFinite(minutes) ? Math.max(0, Math.floor(minutes)) : 0;
  const s = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return (h * 3600 + m * 60 + s) * 1000;
}
