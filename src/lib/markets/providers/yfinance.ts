// Yahoo Finance HTTP provider. Calls the same undocumented endpoints that
// the Python `yfinance` library wraps. The single chart endpoint
// (`/v8/finance/chart/<symbol>`) returns both the latest quote (in `meta`)
// and the price history we need for charting, so a refresh of a single
// stock widget is one HTTP request, not two.
//
// Stats that aren't reliably available from the chart endpoint
// (marketCap, peRatio, dividendYield) are returned as null. They will be
// populated in a later iteration that adds the `/v10/finance/quoteSummary`
// call as an opt-in.

import type { ChartRange, HistoryPoint, Quote, SymbolSearchResult } from "../types.js";

const CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const SEARCH_URL = "https://query1.finance.yahoo.com/v1/finance/search";

type RangeParams = { interval: string; range: string };

const RANGE_PARAMS: Record<ChartRange, RangeParams> = {
  "1D": { interval: "5m", range: "1d" },
  "5D": { interval: "15m", range: "5d" },
  "1M": { interval: "1d", range: "1mo" },
  "6M": { interval: "1d", range: "6mo" },
  YTD: { interval: "1d", range: "ytd" },
  "1Y": { interval: "1d", range: "1y" },
  "5Y": { interval: "1wk", range: "5y" },
};

type ChartMeta = {
  currency?: string;
  symbol?: string;
  exchangeName?: string;
  fullExchangeName?: string;
  longName?: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketTime?: number; // epoch seconds
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  regularMarketOpen?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  marketCap?: number;
  trailingPE?: number;
  trailingAnnualDividendYield?: number;
  averageDailyVolume3Month?: number;
};

type ChartResponse = {
  chart?: {
    result?: Array<{
      meta?: ChartMeta;
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
    error?: { code?: string; description?: string } | null;
  };
};

type SearchQuote = {
  symbol?: string;
  longname?: string;
  shortname?: string;
  exchDisp?: string;
  typeDisp?: string;
  quoteType?: string;
};

type SearchResponse = {
  quotes?: SearchQuote[];
};

export type ChartFetchResult = {
  quote: Quote;
  history: HistoryPoint[];
};

/**
 * Fetch quote + history in a single Yahoo chart call.
 *
 * @throws Error on network failure, non-200 response, or empty/invalid payload.
 */
export async function fetchChart(
  symbol: string,
  range: ChartRange,
  signal?: AbortSignal,
): Promise<ChartFetchResult> {
  const trimmed = symbol.trim().toUpperCase();
  if (!trimmed) throw new Error("Symbol is required");

  const params = RANGE_PARAMS[range];
  const url = new URL(`${CHART_URL}/${encodeURIComponent(trimmed)}`);
  url.searchParams.set("interval", params.interval);
  url.searchParams.set("range", params.range);
  url.searchParams.set("includePrePost", "false");

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) {
    throw new Error(`Yahoo chart fetch failed: HTTP ${res.status}`);
  }
  const data = (await res.json()) as ChartResponse;
  if (data.chart?.error) {
    const desc = data.chart.error.description ?? data.chart.error.code ?? "Unknown error";
    throw new Error(`Yahoo: ${desc}`);
  }
  const result = data.chart?.result?.[0];
  if (!result || !result.meta) {
    throw new Error("Yahoo returned no data for this symbol");
  }

  const meta = result.meta;
  const timestamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];

  const history: HistoryPoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const t = timestamps[i];
    const close = closes[i];
    if (typeof t !== "number" || typeof close !== "number" || !Number.isFinite(close)) continue;
    history.push({ t, price: close });
  }

  const price = meta.regularMarketPrice ?? NaN;
  const previousClose = meta.previousClose ?? meta.chartPreviousClose ?? NaN;
  const change =
    Number.isFinite(price) && Number.isFinite(previousClose) ? price - previousClose : 0;
  const changePercent =
    Number.isFinite(price) && Number.isFinite(previousClose) && previousClose !== 0
      ? (change / previousClose) * 100
      : 0;

  const lastUpdatedAt =
    typeof meta.regularMarketTime === "number" ? meta.regularMarketTime * 1000 : Date.now();
  const ageMin = (Date.now() - lastUpdatedAt) / 60_000;
  const isDelayed = ageMin > 1;

  const quote: Quote = {
    symbol: meta.symbol ?? trimmed,
    name: meta.longName ?? meta.shortName ?? trimmed,
    currency: meta.currency ?? "USD",
    exchange: meta.fullExchangeName ?? meta.exchangeName ?? "",
    price,
    change,
    changePercent,
    open: meta.regularMarketOpen ?? NaN,
    previousClose,
    dayHigh: meta.regularMarketDayHigh ?? NaN,
    dayLow: meta.regularMarketDayLow ?? NaN,
    fiftyTwoHigh: meta.fiftyTwoWeekHigh ?? NaN,
    fiftyTwoLow: meta.fiftyTwoWeekLow ?? NaN,
    volume: meta.regularMarketVolume ?? NaN,
    avgVolume:
      typeof meta.averageDailyVolume3Month === "number" ? meta.averageDailyVolume3Month : null,
    marketCap: typeof meta.marketCap === "number" ? meta.marketCap : null,
    peRatio: typeof meta.trailingPE === "number" ? meta.trailingPE : null,
    dividendYield:
      typeof meta.trailingAnnualDividendYield === "number"
        ? meta.trailingAnnualDividendYield * 100
        : null,
    fetchedAt: Date.now(),
    lastUpdatedAt,
    isDelayed,
    delayMinutes: isDelayed ? Math.round(ageMin) : 0,
  };

  return { quote, history };
}

export async function searchSymbols(
  query: string,
  signal?: AbortSignal,
): Promise<SymbolSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const url = new URL(SEARCH_URL);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("quotesCount", "10");
  url.searchParams.set("newsCount", "0");

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) {
    throw new Error(`Yahoo search failed: HTTP ${res.status}`);
  }
  const data = (await res.json()) as SearchResponse;
  const quotes = data.quotes ?? [];
  return quotes
    .filter((q): q is SearchQuote & { symbol: string } => typeof q.symbol === "string")
    .map((q) => ({
      symbol: q.symbol,
      name: q.longname ?? q.shortname ?? q.symbol,
      exchange: q.exchDisp ?? "",
      type: q.typeDisp ?? q.quoteType ?? "",
    }));
}
