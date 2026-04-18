// Number / currency / percent formatting helpers for market-data widgets.
// All formatters lean on Intl.* so they pick up the user's locale.

export function formatPrice(value: number, currency: string): string {
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

export function formatPriceCompact(value: number, currency: string): string {
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatVolume(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, withSign = true): string {
  if (!Number.isFinite(value)) return "—";
  const sign = withSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatChange(value: number, withSign = true): string {
  if (!Number.isFinite(value)) return "—";
  const sign = withSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

export type ChangeColor = "up" | "down" | "neutral";

export function changeColor(value: number): ChangeColor {
  if (!Number.isFinite(value) || value === 0) return "neutral";
  return value > 0 ? "up" : "down";
}

export function formatPriceSmart(value: number, currency: string): string {
  if (!Number.isFinite(value)) return "—";
  let decimals = 2;
  if (value !== 0 && Math.abs(value) < 1) {
    decimals = Math.min(8, Math.max(2, -Math.floor(Math.log10(Math.abs(value))) + 3));
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: Math.min(decimals, 2),
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return value.toFixed(decimals);
  }
}

/** Maps a ChangeColor to the matching CSS variable used in app.css. */
export function colorVarForChange(c: ChangeColor): string {
  switch (c) {
    case "up":
      return "var(--ui-success)";
    case "down":
      return "var(--ui-error)";
    default:
      return "var(--ui-muted-fg)";
  }
}
