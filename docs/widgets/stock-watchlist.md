# Watchlist

A multi-ticker table widget. Add the symbols you care about — stocks, ETFs,
and crypto (`BTC-USD`, `ETH-USD`, etc.) — and the widget renders a compact,
scrollable table showing price, change, sparkline, and more for each, all
refreshed on a single interval. Powered by the same Yahoo Finance public
HTTP endpoints as the Stock widget.

- **Widget ID:** `stock-watchlist`
- **Default size:** 4 x 6 (width x height in grid cells)
- **Minimum size:** 4 x 4
- **Source:** [`src/lib/widgets/stock-watchlist/`](../../src/lib/widgets/stock-watchlist/)

## Network notice

This is a network-using widget and follows the rules described in
[`PRIVACY_POLICY.md`](../PRIVACY_POLICY.md):

- A freshly added Watchlist widget makes **no requests** until you add at
  least one symbol in its settings.
- Once configured, it contacts only `query1.finance.yahoo.com` (quotes,
  charts, and symbol search). No other host.
- Each refresh fetches all symbols in parallel. The widget pauses
  auto-refresh outside US NYSE / NASDAQ trading hours by default. Crypto
  symbols always refresh regardless of this setting (crypto trades 24/7).
- Yahoo's free tier is typically **delayed 15 minutes** for US equities,
  and the widget surfaces this as a "15m" badge in the header.

If you remove the Watchlist widget from your grid, all of its outbound
traffic stops.

## Usage

1. Add **Watchlist** from the **Add widget** menu in edit mode. The widget
   will show a placeholder asking you to add symbols.
2. Open the widget's settings (gear icon in edit mode).
3. On the **Symbols** tab, search for a ticker, company name, or crypto
   pair (`BTC-USD`), then click a result to add it. Repeat for each symbol.
4. Optional: drag symbols to reorder, or switch to the **Display** tab to
   configure columns, sort mode, sparkline range, or refresh interval.
5. The widget fetches all symbols immediately and starts displaying the
   table.

## What it shows

- **Header:** a title (defaults to "Watchlist," customizable in the
  Display tab), a "Closed" badge when the US market is closed (or
  "Equities closed" for mixed stock + crypto lists — crypto never shows
  a closed badge), and a "15m" badge when any quote is delayed.
- **Column titles** (optional) — a header row with abbreviated labels.
  Off by default; toggle in the Display tab.
- **Table rows:** one row per symbol. Each row shows the ticker symbol
  plus whichever columns you've enabled. Visible columns stay aligned across
  the whole table, and when the Sparkline column is enabled it expands to
  consume the remaining horizontal space.
- **Sparklines:** tiny inline SVG charts per row, drawn at the range you
  choose (1D, 5D, or 1M). Color tracks the direction of the day's change
  (green up, red down, muted flat).

## Settings

The Watchlist uses three tabs: **Appearance**, **Symbols**, and
**Display**. Appearance controls are the same standard widget chrome
controls every widget has; the other two tabs are documented below.

### Symbols tab

| Setting         | Type                       | Default | What it does                                                                                                                                                         |
| --------------- | -------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Add symbol**  | Search box + result picker | —       | Search by ticker, company name, or crypto pair (`BTC-USD`) via Yahoo's search. Exchange suffixes accepted (`TSCO.L`, `7203.T`). Duplicates are rejected with a hint. |
| **Symbol list** | Draggable list with remove | empty   | Shows all added symbols with their company name (when cached). Drag to reorder; click the trash icon to remove. Order matters when sort is set to Manual.            |

### Display tab

| Setting                      | Type                                              | Default                    | What it does                                                                                                                            |
| ---------------------------- | ------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**                    | text                                              | empty (shows "Watchlist")  | Custom title for the widget header. Leave blank to show "Watchlist."                                                                    |
| **Columns to show**          | multi-select pills                                | Price, Change %, Sparkline | Tap to toggle. Order reflects left-to-right render order. Full menu: Price, Change, Change %, Sparkline, Day range, Volume, Market cap. |
| **Show column titles**       | toggle                                            | off                        | Renders a header row with abbreviated column labels above the data rows.                                                                |
| **Sort by**                  | select: Manual / A-Z / Change % desc / Price desc | Manual                     | Manual honors the order from the Symbols tab. Other modes sort the rendered rows without changing your stored order.                    |
| **Sparkline range**          | segmented: 1D / 5D / 1M                           | 1D                         | Range used for every row's sparkline. Changing the range clears the sparkline cache and refetches.                                      |
| **Refresh interval**         | select: 1 min / 2 min / 5 min / 15 min            | 2 min                      | How often the widget refetches all symbols in the background.                                                                           |
| **Pause when market closed** | toggle                                            | on                         | Suspends the refresh loop outside US NYSE / NASDAQ trading hours (Mon-Fri 09:30-16:00 ET). Has no effect on crypto symbols (24/7).      |

## Tips

- **The widget caches both quotes and sparkline data in its settings**, so
  reopening Firefox shows the previous numbers instantly and only refetches
  if the cache is older than your refresh interval.
- **All symbols fetch in parallel.** Each symbol is a separate Yahoo
  request, but they run concurrently via `Promise.allSettled`. If one
  symbol fails, the others still update and the failed symbol keeps its
  cached data.
- **Network errors render an inline error bar** inside the widget. Cached
  data stays visible underneath, so a flaky connection doesn't blank out
  your table.
- **Sorting doesn't change your list.** The sort modes reorder the
  rendered rows but never mutate the stored symbol order. Switch back to
  Manual to see your original arrangement.
- **For a deep dive into one symbol,** use the single-ticker
  [Stock widget](./stock.md) alongside the watchlist.

## Source-data caveats

Same as the [Stock widget](./stock.md#source-data-caveats) — Yahoo
Finance's public HTTP endpoints are free and keyless but technically
undocumented. The provider module is isolated in
[`src/lib/markets/providers/yfinance.ts`](../../src/lib/markets/providers/yfinance.ts)
so a future Yahoo change is a single-file fix.
