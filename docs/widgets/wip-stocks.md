# Stocks & Crypto Widget Suite (WIP)

> **Status:** 🟡 Partial — Stock widget shipped; other three still planned.
>
> **Stage:** Phase 1 complete (`src/lib/markets/` backbone + Stock widget,
> v1.5.2). Phases 2–4 (Stock Watchlist, Crypto, Crypto Watchlist) still
> planned, all on the same backbone.
>
> The user-facing Stock widget docs are at [`./stock.md`](./stock.md).
> Everything below describes the still-WIP three widgets and the shared
> backbone they will sit on.

## Overview

A four-widget addition that brings live(ish) market data to the new tab page,
sitting on top of a shared backbone module so the data-fetching, formatting,
market-hours logic, and chart rendering are written once and reused four
times:

| Widget               | ID                 | Default size | Status     | Purpose                                   |
| -------------------- | ------------------ | ------------ | ---------- | ----------------------------------------- |
| **Stock**            | `stock`            | 4 × 4        | ✅ Shipped | Single ticker — price + stats + chart     |
| **Stock Watchlist**  | `stock-watchlist`  | 4 × 6        | ⭕ Planned | Table of multiple tickers with sparklines |
| **Crypto**           | `crypto`           | 4 × 4        | ⭕ Planned | Single coin — price + stats + chart       |
| **Crypto Watchlist** | `crypto-watchlist` | 4 × 6        | ⭕ Planned | Table of multiple coins with sparklines   |

All four are network-using widgets and follow Clean Browsing's network policy
for opt-in, disclosed, host-scoped traffic. See the shared rules in
[`docs/widgets/README.md`](./README.md).

## Architecture: shared market backbone

To keep the four widgets DRY, the data layer lives outside any single widget
folder, in a new `src/lib/markets/` module. Widgets import from it; the module
itself never imports from widgets.

```
src/lib/markets/
├── index.ts             # public re-exports
├── types.ts             # Quote, HistoryPoint, MarketState, ChartRange…
├── format.ts            # currency, volume (compact), percent, change-color helpers
├── marketHours.ts       # isUSEquityMarketOpen(), nextOpen(), nextClose()
├── chart/
│   ├── ChartCanvas.svelte   # thin wrapper around lightweight-charts
│   └── sparkline.ts         # tiny canvas/SVG sparkline for watchlist rows
└── providers/
    ├── yfinance.ts      # quote + history + symbol search via Yahoo Finance HTTP
    └── coingecko.ts     # quote + history + coin search via CoinGecko HTTP
```

The widgets call into this module rather than hand-rolling fetches. Provider
modules expose a uniform interface (`fetchQuote`, `fetchQuotes`, `fetchHistory`,
`search`) so the stock widget and the watchlist share the exact same code
path for each API call — only the layout above the data differs.

## Provider choices (resolved)

### Stocks: Yahoo Finance HTTP endpoints

We'll call Yahoo Finance directly from the extension — the same endpoints the
Python `yfinance` library wraps (`query1.finance.yahoo.com/v8/finance/chart`,
`/v7/finance/quote`, `/v1/finance/search`). `yfinance` itself is a Python
package and the JS port (`yahoo-finance2`) carries Node-only dependencies, so
neither runs in the browser — but the HTTP API is identical and we declare the
hosts in `manifest.json` so CORS isn't an issue from the extension context.

Trade-offs we're accepting:

- **Unofficial API.** Yahoo can change shape without notice. The provider
  module isolates the parsing so a future break is a single-file fix, and
  the widgets render their cached values + an inline error bar when a fetch
  throws.
- **15-minute delay on US equities.** The widget shows a "15 min delayed"
  pill so users can see at a glance whether they're looking at fresh data.

### Crypto: CoinGecko (recommended) — Yahoo as fallback

For crypto specifically we have two viable paths:

- **CoinGecko** (`api.coingecko.com/api/v3`) — free, keyless, no auth, well-
  documented, ~10–30 calls/min on the public tier, covers thousands of coins
  with built-in market cap rankings, 24h volume, sparkline data, and a
  proper search endpoint. This is the standard free crypto API; it's what
  most crypto dashboards use.
- **Yahoo Finance** via `BTC-USD` style tickers — works for the top ~50
  coins, much narrower coverage, but lets us reuse the stock provider code
  unchanged.

**Lean preference: CoinGecko.** The crypto-specific data (market cap rank,
all-time high, ATH change %, dominance) is well worth the second provider
module. The four widgets still share `markets/types.ts` and `markets/chart/`
either way — it's only `providers/coingecko.ts` that's net-new.

> **Note:** "crypto-yfinance" doesn't appear to be a real package — Yahoo's
> own ticker namespace is the closest thing, and it's the same `yfinance`
> backend. CoinGecko is the more crypto-native choice for the same "free,
> no-auth" cost.

## Charting: TradingView's lightweight-charts

Picked over Chart.js because:

- **Purpose-built for finance.** Line, area, candlestick, and histogram
  series with crosshair / tooltip / zoom / pan built in. Chart.js gets you
  there but with several plugins.
- **Smaller bundle.** ~50 KB minified vs. Chart.js + date adapter at
  ~80–100 KB.
- **Better default UX.** The crosshair-snaps-to-data and the time-axis
  formatting feel native to a stock app rather than a generic chart.
- **One library covers all four widgets.** Hero chart in the single
  widgets, tiny inline sparklines in the watchlist rows.
- Apache 2.0 licensed.

If the result feels good in the Stock widget we may migrate the Ping Monitor
sparkline over to it for consistency. Decision deferred until we can compare
side-by-side in the running extension.

## Market hours behavior

US NYSE only for v1 (covers the vast majority of useful tickers). Logic lives
in `markets/marketHours.ts` and is exchange-agnostic in shape so adding LSE,
TSE, etc. later is a data change, not a code change.

Behavior across the four widgets:

- **Market open:** widgets refresh on the configured interval (default
  1 min for single-ticker, 2 min for watchlists), price is colored against
  previous close.
- **Market closed:** refresh loop pauses, the cached "last close" price
  stays visible, and a subtle overlay / pill labels the widget as "Market
  closed — last close shown." No flashing, no countdown — just an honest
  read of the closing price.
- **Pre-market and after-hours:** treated as "closed" for v1 (Yahoo's free
  data for these sessions is patchy and labelled inconsistently).

For crypto, markets are 24/7 — the overlay never appears and the refresh
loop runs continuously.

## Hard constraints (still relevant)

1. **CORS via host permissions.** Yahoo and CoinGecko don't need permissive
   CORS headers for us because we declare both hosts in `public/manifest.json`
   under `permissions`. Extension contexts bypass CORS for declared hosts.
2. **Honest delay labelling.** Free data is delayed. A "live" number that's
   actually 15 minutes stale is worse than a clearly-labelled delayed quote.
   Both single-ticker widgets render a "15 min delayed" pill when the
   provider says the quote is delayed.
3. **Provider isolation.** All Yahoo / CoinGecko parsing lives in
   `markets/providers/*.ts` behind a uniform interface so a breaking change
   upstream is a single-file fix, never a widget rewrite.

## Phased rollout

1. **v1.5.2 — ✅ Shipped.** `markets/` backbone (yfinance provider, types,
   format helpers, market-hours utility, lightweight-charts wrapper) +
   Stock widget.
2. **Next — Stock Watchlist widget.** Reuses everything from phase 1.
3. **Then — CoinGecko provider + Crypto widget.**
4. **Finally — Crypto Watchlist widget.**

---

## Widget 1: Stock

Single-ticker hero widget. The user picks one symbol, the widget renders a
big price number, a configurable row of stats, and a price chart underneath.

- **Widget ID:** `stock`
- **Default size:** 4 × 4
- **Minimum size:** 3 × 3 — below that, the chart loses too much shape and
  the stats row collapses
- **Source:** `src/lib/widgets/stock/`
  - `Stock.svelte`
  - `StockSettings.svelte`
  - `definition.ts`

### Settings type

```ts
// src/lib/widgets/stock/definition.ts
import type { ChartRange, Quote, HistoryPoint, StatField } from "$lib/markets/types.js";

export type StockSettings = {
  symbol: string; // e.g. "AAPL", "TSCO.L", "7203.T"
  label: string; // optional override; blank → quote.name
  stats: StatField[]; // ordered list of stats to show
  chartRange: ChartRange;
  showChart: boolean;
  refreshIntervalSec: number; // 30 / 60 / 300 / 900
  pauseWhenMarketClosed: boolean;
  cachedQuote: Quote | null;
  cachedHistory: HistoryPoint[];
  paddingV: number;
  paddingH: number;
};
```

`StatField` is shared with the watchlist and lives in `markets/types.ts`:

```ts
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
```

### Settings form (three tabs)

**Symbol tab**

| Field      | Type                    | Default | Notes                                                                               |
| ---------- | ----------------------- | ------- | ----------------------------------------------------------------------------------- |
| **Symbol** | text + "Look up" button | empty   | Exchange suffixes accepted (`TSCO.L`, `7203.T`). Lookup hits `markets.search()`.    |
| **Label**  | text                    | empty   | Custom display name; blank falls back to the company name returned by the provider. |

**Display tab**

| Setting                      | Type                                         | Default                                                                   | Notes                                                                                      |
| ---------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Stats to show**            | multi-select / pills                         | `change`, `changePercent`, `dayHigh`, `dayLow`, `previousClose`, `volume` | All `StatField` values selectable. Order in the list is the render order.                  |
| **Chart range**              | segmented: 1D / 5D / 1M / 6M / YTD / 1Y / 5Y | `1D`                                                                      | A pure re-fetch on change — different ranges are different API calls.                      |
| **Show chart**               | toggle                                       | `on`                                                                      | Off hides the chart and gives the stats column the full width.                             |
| **Refresh interval**         | select: 30 s / 1 min / 5 min / 15 min        | `1 min`                                                                   | Lower values are friendlier to live trading; higher values are friendlier to the provider. |
| **Pause when market closed** | toggle                                       | `on`                                                                      | Suspends the refresh loop overnight and on weekends.                                       |

**Appearance tab** — standard widget appearance controls.

### Layout

```
┌────────────────────────────────────────┐
│ AAPL  Apple Inc.            15m delay  │  ← header row
│ $189.42                                │  ← hero price
│ ▲ +2.18  (+1.16%)                      │  ← change row (color-coded)
│ ┌────────────────────────────────────┐ │
│ │       chart (lightweight-charts)   │ │  ← time series + crosshair
│ └────────────────────────────────────┘ │
│ Day range  187.10–190.55               │  ← stats grid (2-col)
│ 52w high   199.62                      │
│ 52w low    164.08                      │
│ Volume     58.4M                       │
└────────────────────────────────────────┘
```

When `pauseWhenMarketClosed` is on and the US market is closed, a translucent
pill (`Market closed — last close`) sits over the header row, and the chart
shows the last available session.

---

## Widget 2: Stock Watchlist

Table of multiple tickers, each row showing a price, change, and tiny
sparkline. Designed for "10 things I check every morning" rather than "deep
dive into one symbol."

- **Widget ID:** `stock-watchlist`
- **Default size:** 4 × 6
- **Minimum size:** 4 × 4

### Settings type

```ts
// src/lib/widgets/stock-watchlist/definition.ts
import type { Quote, StatField } from "$lib/markets/types.js";

export type WatchlistColumn =
  | "price"
  | "change"
  | "changePercent"
  | "sparkline"
  | "dayRange"
  | "volume"
  | "marketCap";

export type WatchlistSort = "manual" | "alpha" | "changePercentDesc" | "priceDesc";

export type StockWatchlistSettings = {
  symbols: string[]; // ordered; "manual" sort respects this order
  columns: WatchlistColumn[]; // ordered; render left-to-right
  sortBy: WatchlistSort;
  sparklineRange: "1D" | "5D" | "1M";
  refreshIntervalSec: number; // 60 / 120 / 300 / 900
  pauseWhenMarketClosed: boolean;
  cachedQuotes: Record<string, Quote>;
  cachedSparklines: Record<string, number[]>;
  paddingV: number;
  paddingH: number;
};
```

### Settings form (three tabs)

**Symbols tab**

A list editor: text input + "Add" button, draggable rows for manual reorder,
trash icon per row to remove. Same UX as the Ping Monitor pre-rewrite list.

**Display tab**

| Setting                      | Type                                                                                          | Default                   | Notes                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------ |
| **Columns**                  | multi-select / pills (price / change / change% / sparkline / day range / volume / market cap) | price, change%, sparkline | Order in the list is the render order, left-to-right.                          |
| **Sort by**                  | select: manual / A–Z / change% desc / price desc                                              | `manual`                  | `manual` honors the order from the Symbols tab; others sort the rendered rows. |
| **Sparkline range**          | segmented: 1D / 5D / 1M                                                                       | `1D`                      | Range used for every row's sparkline. Single API call per refresh.             |
| **Refresh interval**         | select: 1 min / 2 min / 5 min / 15 min                                                        | `2 min`                   | Watchlists fetch all symbols in one batched call where possible.               |
| **Pause when market closed** | toggle                                                                                        | `on`                      | Same semantics as the Stock widget.                                            |

**Appearance tab** — standard.

### Layout

```
┌──────────────────────────────────────────┐
│ Watchlist                    15m delay   │
│ AAPL    189.42  +1.16%   ╱╲╱─╮           │
│ MSFT    421.10  +0.42%   ─╲╱─╱           │
│ NVDA    878.55  −2.04%   ╲╲╱╲╲           │
│ TSLA    178.21  +3.18%   ╱╱╱─╲           │
│ GOOG    156.84  +0.12%   ─╲╱─╲           │
│ ...                                      │
└──────────────────────────────────────────┘
```

Sparklines are 60-pixel-wide canvas elements rendered via
`markets/chart/sparkline.ts` — much lighter than spinning up a full
lightweight-charts instance per row.

---

## Widget 3: Crypto

Same shape as the Stock widget but pointed at CoinGecko. Differences:

- **Widget ID:** `crypto`
- **Default size:** 4 × 4
- **No market-hours overlay** (crypto is 24/7).
- **Coin search** instead of symbol search — CoinGecko's `/search` endpoint
  returns `{ id, symbol, name, market_cap_rank, large }` (icon URL).
- **Crypto-specific stats:**

```ts
export type CryptoStatField =
  | "change24h"
  | "change24hPercent"
  | "change7dPercent"
  | "change30dPercent"
  | "ath"
  | "athChangePercent"
  | "athDate"
  | "atl"
  | "atlChangePercent"
  | "marketCap"
  | "marketCapRank"
  | "volume24h"
  | "circulatingSupply"
  | "totalSupply";
```

Settings shape mirrors `StockSettings` but uses `CryptoStatField` and skips
the `pauseWhenMarketClosed` toggle. Coin icon fetched from CoinGecko's CDN
shows next to the name in the header.

---

## Widget 4: Crypto Watchlist

Same shape as Stock Watchlist but with CoinGecko data and a slightly
different default column set:

- **Widget ID:** `crypto-watchlist`
- **Default size:** 4 × 6
- **Default columns:** rank, name + icon, price, 24h change %, sparkline.
- **Available columns:** rank, name, price, 24h change, 24h change %, 7d
  change %, market cap, 24h volume, sparkline.
- **No market-hours overlay**, refresh runs continuously.

CoinGecko's `/coins/markets` endpoint returns up to 250 coins in one call
with built-in 7-day sparkline data — so the watchlist's "show all rows in one
fetch" pattern is even more efficient than for stocks.

---

## Implementation notes (shared)

- **Symbol / coin search.** Debounced text input that calls
  `markets.search(query)`. The provider routes to Yahoo or CoinGecko based
  on which widget is calling. Same UX as Weather's city picker.
- **Number formatting.** `Intl.NumberFormat` for prices (currency-aware via
  `quote.currency`), volumes (compact: `1.2B`), percentages (always show
  sign for change %).
- **Color of the change row.** Define `--market-up` and `--market-down` in
  `app.css` so theme + colorblindness overrides work. Don't hardcode green/red.
- **Refresh loop.** Single `$effect`-managed `setInterval` per widget,
  torn down on unmount, rebuilt when `refreshIntervalSec` changes. When
  `pauseWhenMarketClosed` is on, the loop checks `isUSEquityMarketOpen()`
  on each tick and skips the fetch if closed.
- **Caching.** All widgets store their last successful response in
  `settings.cached*` so reload is instant, same pattern as Weather. Refetch
  fires only if the cache is older than the refresh interval.
- **Error handling.** Match Weather: render an inline error bar inside the
  widget, keep the cached values visible underneath. No toast spam.
- **Icons.** `lucide-svelte`: `TrendingUp`, `TrendingDown`, `Minus`,
  `RefreshCw`, `Search`, `Plus`, `Trash2`, `GripVertical`.

## Manifest impact

Add to `permissions` in `public/manifest.json`:

- `https://query1.finance.yahoo.com/*`
- `https://query2.finance.yahoo.com/*`
- `https://api.coingecko.com/*`
- `https://assets.coingecko.com/*` (only if we render CoinGecko's coin icons)

Update `docs/PRIVACY_POLICY.md` to list all four hosts and attribute each to
the relevant widget(s).

## Testing checklist (Firefox MV2)

Per-widget — run all four lists when each widget ships.

### Stock

- [ ] Widget appears in the **Add widget** dialog with a "Add a symbol" placeholder.
- [ ] No network calls fire until a symbol is configured.
- [ ] Symbol lookup returns multiple matches and lets the user pick.
- [ ] US equity (e.g. `AAPL`) loads price + chart + all default stats.
- [ ] International equity (e.g. `TSCO.L`, `7203.T`) loads with the correct currency formatting.
- [ ] Chart range switcher refetches and re-renders without flicker.
- [ ] "Market closed" overlay appears outside US trading hours; refresh loop pauses.
- [ ] Delayed-data pill renders when the provider's response is delayed.
- [ ] Cached quote renders immediately on page reload before the next refresh ticks.
- [ ] Inline error bar appears on network failure; cached values stay visible underneath.
- [ ] Widget scales cleanly from 3×3 to 8×8 via `widgetScaler`.

### Stock Watchlist

- [ ] Adding / removing / reordering symbols persists across reloads.
- [ ] Batch fetch hits the provider once per refresh, not once per symbol.
- [ ] Sparkline renders for each row at the configured range.
- [ ] Sort modes don't mutate the stored symbol order.
- [ ] Empty state shows when no symbols are configured.

### Crypto

- [ ] Coin search returns multiple matches with icons.
- [ ] BTC, ETH, and a small-cap coin all load price + chart + stats.
- [ ] No "Market closed" overlay (crypto is 24/7).
- [ ] All-time-high stat and date render correctly.

### Crypto Watchlist

- [ ] Default columns (rank, name, price, 24h%, sparkline) render correctly.
- [ ] Sparkline data uses CoinGecko's bundled 7-day series.
- [ ] Adding the 251st coin shows a friendly "limit reached" message (CoinGecko caps `/coins/markets` at 250 per page).

### Cross-cutting

- [ ] `npm run check` passes cleanly for the whole suite.
- [ ] `markets/` is the only source of provider knowledge — `grep -r "query1.finance.yahoo.com" src/lib/widgets/` returns zero hits.

## Out of scope for v1 (across the suite)

Options chains, news feeds, earnings calendars, technical indicators
(MA / RSI / MACD), drawing tools, pre-market and after-hours pricing
(mostly paywalled / patchy on Yahoo), portfolio tracking with cost-basis,
dividend calendar, alerts on price thresholds, currency conversion,
non-US exchange-hours awareness, and CoinGecko Pro features. Each could
become a follow-up release once the core suite settles.

## Open design questions (remaining)

1. **Where does the API-key UX go if we ever add a keyed provider later?**
   Not relevant for v1 (Yahoo and CoinGecko are both keyless), but worth
   thinking about before someone asks for Polygon or Finnhub support.
2. **Watchlist row click target.** Does clicking a row in the watchlist do
   anything? Options: nothing, open a tooltip with extra stats, or open the
   single-ticker widget in a popover. Lean nothing for v1 — keep the
   widget read-only and predictable.
3. **CoinGecko rate-limit headroom.** Public tier is "10–30 calls/min,"
   which is fuzzy. The watchlist's batched `/coins/markets` call counts as
   one call regardless of coin count, so this should be fine in practice.
   Worth instrumenting once the widget is live to confirm.
