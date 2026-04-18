# Stock

A single-ticker market widget. Pick one symbol — anything Yahoo Finance
covers: stocks (US, UK, Tokyo, Frankfurt, etc.), ETFs, and crypto
(`BTC-USD`, `ETH-USD`, `DOGE-USD`, etc.) — and the widget shows the latest
price, day's change, a configurable row of stats, and a price chart for the
range you choose. Powered by Yahoo Finance's public HTTP endpoints (the same
ones the Python `yfinance` library wraps).

- **Widget ID:** `stock`
- **Default size:** 4 × 4 (width × height in grid cells)
- **Minimum size:** 3 × 3
- **Source:** [`src/lib/widgets/stock/`](../../src/lib/widgets/stock/)

## Network notice

This is a network-using widget and follows the rules described in
[`PRIVACY_POLICY.md`](../PRIVACY_POLICY.md):

- A freshly added Stock widget makes **no requests** until you pick a symbol
  in its settings.
- Once configured, it contacts only `query1.finance.yahoo.com` (quotes,
  charts, and symbol search). No other host.
- Quotes refresh on the interval you choose (30 s – 15 min). The widget
  pauses auto-refresh outside US NYSE / NASDAQ trading hours by default —
  toggle the **Pause when market closed** option to change that. Crypto
  symbols always refresh regardless of this setting (crypto trades 24/7).
- Each refresh is a single HTTP request that returns both the latest quote
  and the full chart history for the active range, so the widget is light
  on the upstream API.
- Yahoo's free tier is typically **delayed 15 minutes** for US equities,
  and the widget surfaces the delay as a small badge in the header so
  you can always see whether the price is fresh. The badge disappears
  during the brief window when Yahoo serves a real-time number (e.g.
  during pre-market for some accounts).

If you remove the Stock widget from your grid, all of its outbound traffic
stops.

## Usage

1. Add **Stock** from the **Add widget** menu in edit mode. The widget will
   show a placeholder asking you to pick a symbol.
2. Open the widget's settings (gear icon in edit mode).
3. On the **Symbol** tab, type a ticker (`AAPL`), company name (`Apple`),
   or crypto pair (`BTC-USD`) and click **Search**, then pick a result.
4. Optional: open the **Display** tab to choose which stats appear,
   change the chart range, or change the refresh interval.
5. The widget will fetch its first quote immediately and start displaying
   the price, change, chart, and stats.

## What it shows

- **Header:** the symbol (mono-font), the company/coin name (or your
  custom label), a "Closed" badge when the US market is closed (not shown
  for crypto — crypto trades 24/7), and a "delayed" badge with the lag in
  minutes when the quote isn't real-time.
- **Hero price:** the current price, formatted in the symbol's native
  currency (USD for US equities, GBP for `.L` London tickers, JPY for
  `.T` Tokyo, etc.).
- **Change row:** absolute change + percent change against the previous
  close, colored green (up), red (down), or muted (flat). Shown with a
  trend-line icon for a quick at-a-glance read.
- **Chart:** an interactive area chart of the chosen range. The 1D range
  shows a dashed reference line at the previous close. Move your mouse
  across the chart for the crosshair.
- **Stats grid:** a two-column list of whatever you've enabled in the
  Display tab — by default Change, Change %, Day high, Day low, Prev
  close, and Volume.

## Settings

The Stock widget uses three tabs: **Appearance**, **Symbol**, and
**Display**. Appearance controls are the same standard widget chrome
controls every widget has; the other two tabs are documented below.

### Symbol tab

| Setting    | Type                       | Default | What it does                                                                                                                                                              |
| ---------- | -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Symbol** | Search box + result picker | empty   | Pick a ticker via Yahoo's search. Exchange suffixes accepted (`TSCO.L` for London, `7203.T` for Tokyo). Crypto: `BTC-USD`, `ETH-USD`. Required before any quote loads.    |
| **Label**  | text                       | empty   | Custom display name shown next to the symbol. Blank falls back to the company name returned by Yahoo — handy when the company name is too long to fit at the chosen size. |

### Display tab

| Setting                      | Type                                         | Default                                                 | What it does                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stats to show**            | multi-select pills                           | Change, Change %, Day high, Day low, Prev close, Volume | Tap to toggle. Order in the list reflects render order. The full menu also includes Day range, Open, 52-week high/low, Avg volume, Market cap, P/E ratio, and Div yield.           |
| **Chart range**              | segmented: 1D / 5D / 1M / 6M / YTD / 1Y / 5Y | `1D`                                                    | Refetches the chart in the new range. 1D shows intraday 5-minute bars; 1Y and 5Y show daily / weekly bars.                                                                         |
| **Show chart**               | toggle                                       | `on`                                                    | Off hides the chart and gives the stats grid the full body.                                                                                                                        |
| **Refresh interval**         | select: 30 s / 1 min / 5 min / 15 min        | `1 min`                                                 | How often the widget refetches in the background. Lower values are friendlier to live trading; higher values are friendlier to Yahoo's rate limits.                                |
| **Pause when market closed** | toggle                                       | `on`                                                    | Suspends the refresh loop outside US NYSE / NASDAQ trading hours (Mon–Fri 09:30–16:00 ET). Has no effect on crypto symbols (24/7). The widget continues to display the last close. |

## Stat reference

| Stat field         | What it shows                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Change**         | Absolute price change since the previous close, signed.                                                                       |
| **Change %**       | Percent change since the previous close, signed.                                                                              |
| **Day high / low** | The session's highest and lowest trade.                                                                                       |
| **Day range**      | A combined low–high label, e.g. `$187.10–$190.55`.                                                                            |
| **Open**           | Opening trade price for the session.                                                                                          |
| **Prev close**     | Closing trade price from the previous session — the baseline for the change row.                                              |
| **52w high / low** | 52-week extremes.                                                                                                             |
| **Volume**         | Shares traded this session, in compact notation (`1.2B`, `58.4M`).                                                            |
| **Avg volume**     | 3-month average daily volume. Shows `—` if Yahoo hasn't returned it for this ticker.                                          |
| **Market cap**     | Current market capitalization, in compact currency notation. Shows `—` if Yahoo hasn't returned it.                           |
| **P/E ratio**      | Trailing twelve-month price / earnings ratio. Shows `—` if Yahoo hasn't returned it.                                          |
| **Div yield**      | Trailing annual dividend yield, as a percentage. Shows `—` if Yahoo hasn't returned it (e.g. for non-dividend-paying stocks). |

The four "may be `—`" stats (Avg volume, Market cap, P/E, Div yield) come
from Yahoo's chart-meta payload and aren't always populated for every
ticker; that's expected behavior, not a widget bug.

## Tips

- **The widget caches both the latest quote and the chart history in its
  own settings**, so reopening Firefox shows the previous numbers
  immediately and only refetches if the cache is older than your refresh
  interval.
- **The chart range refetches the history**, not just re-renders, because
  different ranges have different data resolutions (5-minute bars for 1D,
  daily for 1M, etc.). Switching range can briefly flicker on slow
  connections.
- **Network errors render an inline error bar inside the widget** (no
  toast spam). The cached price stays visible underneath, so a flaky API
  doesn't blank out your dashboard.
- **One ticker per widget.** To watch several symbols at a glance, use the
  [Stock Watchlist](./stock-watchlist.md) widget.

## Source-data caveats

The Stock widget calls Yahoo Finance's public HTTP endpoints. These are
free and require no API key, but they are technically undocumented — Yahoo
can change their shape without notice. The provider module is isolated in
[`src/lib/markets/providers/yfinance.ts`](../../src/lib/markets/providers/yfinance.ts)
so a future Yahoo change is a single-file fix, never a widget rewrite.

The widget will keep displaying its cached values and surface an error bar
if a fetch fails for any reason — your dashboard never goes blank because
of an upstream hiccup.

## Out of scope (today)

Options chains, news feeds, earnings calendars, technical indicators
(MA / RSI / MACD), pre-market and after-hours pricing (mostly paywalled /
patchy on free Yahoo), portfolio tracking with cost-basis, dividend
calendar, and price-threshold alerts are not implemented in this release.
A CoinGecko provider for richer crypto metadata (market cap rank, ATH,
circulating supply, coin icons) is a potential future addition.
