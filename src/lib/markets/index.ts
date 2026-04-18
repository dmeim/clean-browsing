// Public surface of the markets module. Widgets import from "$lib/markets"
// rather than reaching into the provider / chart submodules directly so we
// can reshape the internals without touching call sites.

export type {
  AssetType,
  ChartRange,
  HistoryPoint,
  MarketState,
  Quote,
  StatField,
  SymbolSearchResult,
} from "./types.js";

export { EQUITY_ONLY_STATS, assetTypeFromYahoo } from "./types.js";

export {
  type ChangeColor,
  changeColor,
  colorVarForChange,
  formatChange,
  formatNumber,
  formatPercent,
  formatPrice,
  formatPriceCompact,
  formatPriceSmart,
  formatVolume,
} from "./format.js";

export {
  isUSEquityMarketOpen,
  shouldPauseRefresh,
  shouldPauseRefreshMixed,
  usEquityMarketState,
} from "./marketHours.js";

export {
  fetchChart,
  fetchChartBatch,
  searchSymbols,
  type ChartFetchResult,
} from "./providers/yfinance.js";
