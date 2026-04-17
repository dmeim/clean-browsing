/**
 * Duration parsing and formatting for human-friendly text inputs.
 *
 * Supported units: ms (milliseconds), s (seconds), m (minutes), h (hours).
 * Bare numbers are interpreted as milliseconds.
 */

const UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
};

/**
 * Parse a duration string like "5s", "2000ms", "1h", "30m", "1.5s".
 * Returns milliseconds, or null if the input is invalid or negative.
 *
 * - Case-insensitive.
 * - Optional whitespace between number and unit.
 * - Bare numbers (no unit) are treated as ms.
 * - Fractional values are rounded to the nearest ms.
 */
export function parseDuration(input: string): number | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h)?$/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (!isFinite(value) || value < 0) return null;
  const unit = match[2] ?? "ms";
  const multiplier = UNIT_MS[unit];
  return Math.round(value * multiplier);
}

/**
 * Format milliseconds into a single-unit string. Picks the largest unit that
 * divides evenly so the round-trip reads naturally.
 *
 * 3_600_000 → "1h", 1_800_000 → "30m", 5_000 → "5s", 1_500 → "1500ms".
 * Sub-second values always display as ms.
 */
export function formatDuration(ms: number): string {
  if (!isFinite(ms) || ms < 0) return "0ms";
  const rounded = Math.round(ms);
  if (rounded === 0) return "0ms";
  if (rounded < 1000 || rounded % 1000 !== 0) return `${rounded}ms`;
  const s = rounded / 1000;
  if (s % 3600 === 0) return `${s / 3600}h`;
  if (s % 60 === 0) return `${s / 60}m`;
  return `${s}s`;
}
