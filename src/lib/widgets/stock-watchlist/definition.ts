import type { WidgetDefinition } from "$lib/widgets/types.js";
import type { Quote } from "$lib/markets/index.js";
import { registerWidget } from "$lib/widgets/registry.js";
import StockWatchlist from "./StockWatchlist.svelte";
import SymbolsTab from "./tabs/SymbolsTab.svelte";
import DisplayTab from "./tabs/DisplayTab.svelte";
import WidgetAppearanceTab from "$lib/ui/settings/WidgetAppearanceTab.svelte";

export type WatchlistColumn =
  | "price"
  | "change"
  | "changePercent"
  | "sparkline"
  | "dayRange"
  | "volume"
  | "marketCap";

export type WatchlistSort = "manual" | "alpha" | "changePercentDesc" | "priceDesc";

export type WatchlistRefreshSec = 60 | 120 | 300 | 900;

export type SparklineRange = "1D" | "5D" | "1M";

export type StockWatchlistSettings = {
  symbols: string[];
  customTitle: string;
  columns: WatchlistColumn[];
  sortBy: WatchlistSort;
  sparklineRange: SparklineRange;
  refreshIntervalSec: WatchlistRefreshSec;
  pauseWhenMarketClosed: boolean;
  cachedQuotes: Record<string, Quote>;
  cachedSparklines: Record<string, number[]>;
  paddingV: number;
  paddingH: number;
};

export const WATCHLIST_COLUMN_OPTIONS: ReadonlyArray<{
  value: WatchlistColumn;
  label: string;
}> = [
  { value: "price", label: "Price" },
  { value: "change", label: "Change" },
  { value: "changePercent", label: "Change %" },
  { value: "sparkline", label: "Sparkline" },
  { value: "dayRange", label: "Day range" },
  { value: "volume", label: "Volume" },
  { value: "marketCap", label: "Market cap" },
];

export const WATCHLIST_SORT_OPTIONS: ReadonlyArray<{
  value: WatchlistSort;
  label: string;
}> = [
  { value: "manual", label: "Manual order" },
  { value: "alpha", label: "A\u2013Z" },
  { value: "changePercentDesc", label: "Change % (desc)" },
  { value: "priceDesc", label: "Price (desc)" },
];

export const WATCHLIST_SPARKLINE_RANGE_OPTIONS: ReadonlyArray<{
  value: SparklineRange;
  label: string;
}> = [
  { value: "1D", label: "1D" },
  { value: "5D", label: "5D" },
  { value: "1M", label: "1M" },
];

export const WATCHLIST_REFRESH_OPTIONS: ReadonlyArray<{
  value: WatchlistRefreshSec;
  label: string;
}> = [
  { value: 60, label: "Every minute" },
  { value: 120, label: "Every 2 minutes" },
  { value: 300, label: "Every 5 minutes" },
  { value: 900, label: "Every 15 minutes" },
];

export const DEFAULT_WATCHLIST_COLUMNS: WatchlistColumn[] = ["price", "changePercent", "sparkline"];

export const stockWatchlistDefinition: WidgetDefinition<StockWatchlistSettings> = {
  id: "stock-watchlist",
  name: "Stock Watchlist",
  description: "Track multiple tickers at a glance with prices, changes, and sparklines",
  component: StockWatchlist,
  settingsTabs: [
    {
      id: "appearance",
      label: "Appearance",
      icon: "M12 3a9 9 0 1 0 9 9c0-1.66-3-2-3-4s2.34-1 2-3c-.37-2.2-4-5-8-5z M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M12 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M16 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
      component: WidgetAppearanceTab,
    },
    {
      id: "symbols",
      label: "Symbols",
      icon: "M11 11a8 8 0 1 0 0 0z M21 21l-4.3-4.3",
      component: SymbolsTab,
    },
    {
      id: "display",
      label: "Display",
      icon: "M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36-1.41 1.41M7.05 16.95l-1.41 1.41m12.72 0-1.41-1.41M7.05 7.05 5.64 5.64M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
      component: DisplayTab,
    },
  ],
  defaultSize: { w: 4, h: 6 },
  minSize: { w: 4, h: 4 },
  defaultSettings: {
    symbols: [],
    customTitle: "",
    columns: [...DEFAULT_WATCHLIST_COLUMNS],
    sortBy: "manual",
    sparklineRange: "1D",
    refreshIntervalSec: 120,
    pauseWhenMarketClosed: true,
    cachedQuotes: {},
    cachedSparklines: {},
    paddingV: 10,
    paddingH: 12,
  },
};

registerWidget(stockWatchlistDefinition);
