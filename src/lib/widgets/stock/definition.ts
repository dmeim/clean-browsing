import type { WidgetDefinition } from "$lib/widgets/types.js";
import type { ChartRange, HistoryPoint, Quote, StatField } from "$lib/markets/index.js";
import { registerWidget } from "$lib/widgets/registry.js";
import Stock from "./Stock.svelte";
import SymbolTab from "./tabs/SymbolTab.svelte";
import DisplayTab from "./tabs/DisplayTab.svelte";
import WidgetAppearanceTab from "$lib/ui/settings/WidgetAppearanceTab.svelte";

export type StockRefreshSec = 30 | 60 | 300 | 900;

export type StockSettings = {
  /** Yahoo ticker (uppercase). Empty until the user picks one. */
  symbol: string;
  /** Optional display override; blank falls back to quote.name. */
  label: string;
  /** Ordered list of stats to render under the price. */
  stats: StatField[];
  chartRange: ChartRange;
  showChart: boolean;
  refreshIntervalSec: StockRefreshSec;
  pauseWhenMarketClosed: boolean;
  cachedQuote: Quote | null;
  cachedHistory: HistoryPoint[];
  paddingV: number;
  paddingH: number;
};

export const STOCK_REFRESH_OPTIONS: ReadonlyArray<{ value: StockRefreshSec; label: string }> = [
  { value: 30, label: "Every 30 seconds" },
  { value: 60, label: "Every minute" },
  { value: 300, label: "Every 5 minutes" },
  { value: 900, label: "Every 15 minutes" },
];

export const STOCK_RANGE_OPTIONS: ReadonlyArray<{ value: ChartRange; label: string }> = [
  { value: "1D", label: "1D" },
  { value: "5D", label: "5D" },
  { value: "1M", label: "1M" },
  { value: "6M", label: "6M" },
  { value: "YTD", label: "YTD" },
  { value: "1Y", label: "1Y" },
  { value: "5Y", label: "5Y" },
];

export const STOCK_STAT_OPTIONS: ReadonlyArray<{ value: StatField; label: string }> = [
  { value: "change", label: "Change" },
  { value: "changePercent", label: "Change %" },
  { value: "dayHigh", label: "Day high" },
  { value: "dayLow", label: "Day low" },
  { value: "dayRange", label: "Day range" },
  { value: "open", label: "Open" },
  { value: "previousClose", label: "Prev close" },
  { value: "fiftyTwoHigh", label: "52w high" },
  { value: "fiftyTwoLow", label: "52w low" },
  { value: "volume", label: "Volume" },
  { value: "avgVolume", label: "Avg volume" },
  { value: "marketCap", label: "Market cap" },
  { value: "peRatio", label: "P/E ratio" },
  { value: "dividendYield", label: "Div yield" },
];

export const DEFAULT_STOCK_STATS: StatField[] = [
  "change",
  "changePercent",
  "dayHigh",
  "dayLow",
  "previousClose",
  "volume",
];

export const stockDefinition: WidgetDefinition<StockSettings> = {
  id: "stock",
  name: "Stock",
  description: "Live(ish) price + chart for a single ticker, powered by Yahoo Finance",
  component: Stock,
  settingsTabs: [
    {
      id: "appearance",
      label: "Appearance",
      icon: "M12 3a9 9 0 1 0 9 9c0-1.66-3-2-3-4s2.34-1 2-3c-.37-2.2-4-5-8-5z M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M12 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M16 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
      component: WidgetAppearanceTab,
    },
    {
      id: "symbol",
      label: "Symbol",
      icon: "M11 11a8 8 0 1 0 0 0z M21 21l-4.3-4.3",
      component: SymbolTab,
    },
    {
      id: "display",
      label: "Display",
      icon: "M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36-1.41 1.41M7.05 16.95l-1.41 1.41m12.72 0-1.41-1.41M7.05 7.05 5.64 5.64M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
      component: DisplayTab,
    },
  ],
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 1, h: 1 },
  defaultSettings: {
    symbol: "",
    label: "",
    stats: [...DEFAULT_STOCK_STATS],
    chartRange: "1D",
    showChart: true,
    refreshIntervalSec: 60,
    pauseWhenMarketClosed: true,
    cachedQuote: null,
    cachedHistory: [],
    paddingV: 10,
    paddingH: 12,
  },
};

registerWidget(stockDefinition);
