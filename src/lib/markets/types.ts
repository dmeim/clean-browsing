// Shared types for market-data widgets (stock, watchlist, crypto…). Lives
// outside any single widget so providers and renderers can be swapped or
// reused across widgets without circular imports.

export type ChartRange = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y";

export type StatField =
  | "change"
  | "changePercent"
  | "dayHigh"
  | "dayLow"
  | "dayRange"
  | "open"
  | "previousClose"
  | "fiftyTwoHigh"
  | "fiftyTwoLow"
  | "volume"
  | "avgVolume"
  | "marketCap"
  | "peRatio"
  | "dividendYield";

export type Quote = {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoHigh: number;
  fiftyTwoLow: number;
  volume: number;
  avgVolume: number | null;
  marketCap: number | null;
  peRatio: number | null;
  dividendYield: number | null;
  assetType: AssetType;
  /** Epoch ms when this quote was fetched from the provider. */
  fetchedAt: number;
  /** Epoch ms of the last price update reported by the provider. */
  lastUpdatedAt: number;
  isDelayed: boolean;
  delayMinutes: number;
};

export type HistoryPoint = {
  /** Epoch seconds (lightweight-charts native unit). */
  t: number;
  price: number;
};

export type SymbolSearchResult = {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
};

export type MarketState = "open" | "closed";

export type AssetType = "equity" | "crypto" | "etf" | "fund" | "other";

export const EQUITY_ONLY_STATS: ReadonlySet<StatField> = new Set(["peRatio", "dividendYield"]);

export function assetTypeFromYahoo(
  instrumentType: string | undefined,
  exchangeName?: string,
): AssetType {
  const t = (instrumentType ?? "").toUpperCase();
  if (t === "CRYPTOCURRENCY") return "crypto";
  if (t === "ETF") return "etf";
  if (t === "MUTUALFUND") return "fund";
  if (t === "EQUITY") return "equity";
  if ((exchangeName ?? "").toUpperCase() === "CCC") return "crypto";
  return t ? "other" : "equity";
}
