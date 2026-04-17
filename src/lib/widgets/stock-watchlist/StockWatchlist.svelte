<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import type { WidgetProps } from "$lib/widgets/types.js";
  import type { StockWatchlistSettings, WatchlistColumn } from "./definition.js";
  import {
    changeColor,
    colorVarForChange,
    formatChange,
    formatPercent,
    formatPrice,
    formatPriceCompact,
    formatVolume,
    fetchChartBatch,
    isUSEquityMarketOpen,
    type Quote,
  } from "$lib/markets/index.js";
  import Sparkline from "$lib/markets/chart/Sparkline.svelte";
  import WatchlistIcon from "./WatchlistIcon.svelte";
  import { uiStore } from "$lib/ui/uiStore.svelte.js";

  let { settings, updateSettings }: WidgetProps<StockWatchlistSettings> = $props();

  let loading = $state(false);
  let error = $state<string | null>(null);
  let hovered = $state(false);
  let nowMs = $state(Date.now());

  let lastFetchedKey: string | null = null;
  let currentTimer: {
    id: ReturnType<typeof setInterval>;
    key: string;
    intervalSec: number;
  } | null = null;

  $effect(() => {
    const id = setInterval(() => {
      nowMs = Date.now();
    }, 30_000);
    return () => clearInterval(id);
  });

  const marketOpen = $derived(isUSEquityMarketOpen(new Date(nowMs)));

  async function refresh(force: boolean) {
    if (settings.symbols.length === 0) return;
    if (loading) return;

    if (!force) {
      const quotes = Object.values(settings.cachedQuotes);
      if (quotes.length > 0) {
        const oldestFetch = quotes.reduce((min, q) => Math.min(min, q.fetchedAt), Infinity);
        const ageSec = (Date.now() - oldestFetch) / 1000;
        if (ageSec < settings.refreshIntervalSec) return;
      }
    }

    loading = true;
    error = null;
    try {
      const results = await fetchChartBatch(settings.symbols, settings.sparklineRange);
      const currentSymbols = settings.symbols;
      if (currentSymbols.length === 0) return;

      const nextQuotes: Record<string, Quote> = { ...settings.cachedQuotes };
      const nextSparklines: Record<string, number[]> = { ...settings.cachedSparklines };

      let anySuccess = false;
      for (const sym of currentSymbols) {
        const key = sym.trim().toUpperCase();
        const result = results[key];
        if (result) {
          nextQuotes[key] = result.quote;
          nextSparklines[key] = result.history.map((p) => p.price);
          anySuccess = true;
        }
      }

      if (!anySuccess && Object.keys(settings.cachedQuotes).length === 0) {
        error = "Failed to load any quotes";
        return;
      }

      const activeSet = new Set(currentSymbols.map((s) => s.trim().toUpperCase()));
      for (const key of Object.keys(nextQuotes)) {
        if (!activeSet.has(key)) {
          delete nextQuotes[key];
          delete nextSparklines[key];
        }
      }

      updateSettings({
        ...settings,
        cachedQuotes: nextQuotes,
        cachedSparklines: nextSparklines,
      });
    } catch (e) {
      error = (e as Error).message || "Failed to load quotes";
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    const key = JSON.stringify({
      symbols: settings.symbols,
      range: settings.sparklineRange,
    });
    if (settings.symbols.length === 0) {
      lastFetchedKey = null;
      return;
    }
    if (lastFetchedKey === key) return;
    lastFetchedKey = key;
    untrack(() => refresh(true));
  });

  $effect(() => {
    const symbols = settings.symbols;
    const intervalSec = settings.refreshIntervalSec;
    const key = JSON.stringify(symbols);

    if (symbols.length === 0) {
      if (currentTimer) {
        clearInterval(currentTimer.id);
        currentTimer = null;
      }
      return;
    }

    if (currentTimer && currentTimer.key === key && currentTimer.intervalSec === intervalSec) {
      return;
    }

    if (currentTimer) clearInterval(currentTimer.id);
    const id = setInterval(() => {
      if (settings.pauseWhenMarketClosed && !isUSEquityMarketOpen()) return;
      void refresh(true);
    }, intervalSec * 1000);
    currentTimer = { id, key, intervalSec };
  });

  onDestroy(() => {
    if (currentTimer) {
      clearInterval(currentTimer.id);
      currentTimer = null;
    }
  });

  const sortedSymbols = $derived.by(() => {
    const syms = [...settings.symbols];
    const quotes = settings.cachedQuotes;
    switch (settings.sortBy) {
      case "alpha":
        return syms.sort((a, b) => a.localeCompare(b));
      case "changePercentDesc":
        return syms.sort((a, b) => {
          const qa = quotes[a.trim().toUpperCase()];
          const qb = quotes[b.trim().toUpperCase()];
          return (qb?.changePercent ?? 0) - (qa?.changePercent ?? 0);
        });
      case "priceDesc":
        return syms.sort((a, b) => {
          const qa = quotes[a.trim().toUpperCase()];
          const qb = quotes[b.trim().toUpperCase()];
          return (qb?.price ?? 0) - (qa?.price ?? 0);
        });
      default:
        return syms;
    }
  });

  const padV = $derived(settings.paddingV ?? 10);
  const padH = $derived(settings.paddingH ?? 12);
  const showRefresh = $derived(hovered && settings.symbols.length > 0 && !uiStore.editMode);
  const displayTitle = $derived((settings.customTitle ?? "").trim() || "Watchlist");
  const hasCachedData = $derived(Object.keys(settings.cachedQuotes).length > 0);
  const hasDelay = $derived(Object.values(settings.cachedQuotes).some((q) => q.isDelayed));

  function quoteFor(sym: string): Quote | undefined {
    return settings.cachedQuotes[sym.trim().toUpperCase()];
  }

  function sparklineFor(sym: string): number[] {
    return settings.cachedSparklines[sym.trim().toUpperCase()] ?? [];
  }

  function formatColumnValue(col: WatchlistColumn, q: Quote | undefined): string {
    if (!q) return "\u2014";
    switch (col) {
      case "price":
        return formatPrice(q.price, q.currency);
      case "change":
        return formatChange(q.change);
      case "changePercent":
        return formatPercent(q.changePercent);
      case "dayRange":
        return Number.isFinite(q.dayLow) && Number.isFinite(q.dayHigh)
          ? `${formatPrice(q.dayLow, q.currency)}\u2013${formatPrice(q.dayHigh, q.currency)}`
          : "\u2014";
      case "volume":
        return formatVolume(q.volume);
      case "marketCap":
        return q.marketCap != null ? formatPriceCompact(q.marketCap, q.currency) : "\u2014";
      default:
        return "";
    }
  }

  function isColoredColumn(col: WatchlistColumn): boolean {
    return col === "change" || col === "changePercent";
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="widget-card watchlist"
  onmouseenter={() => (hovered = true)}
  onmouseleave={() => (hovered = false)}
>
  <div
    class="widget-inner watchlist-inner"
    style="top: {padV}px; bottom: {padV}px; left: {padH}px; right: {padH}px;"
  >
    {#if settings.symbols.length === 0}
      <div class="empty">
        <WatchlistIcon name="chart-line" size={28} />
        <p>Open settings to add symbols.</p>
      </div>
    {:else if !hasCachedData && loading}
      <div class="empty">
        <WatchlistIcon name="rotate-cw" size={20} class="spin" />
        <p>Loading\u2026</p>
      </div>
    {:else if !hasCachedData && error}
      <div class="empty error-empty">
        <WatchlistIcon name="circle-alert" size={20} />
        <p>{error}</p>
        <button type="button" class="retry" onclick={() => refresh(true)}>Retry</button>
      </div>
    {:else}
      <header class="head">
        <span class="title">{displayTitle}</span>
        <div class="badges">
          {#if !marketOpen}
            <span class="badge muted" title="US market closed \u2014 last close shown">Closed</span>
          {/if}
          {#if hasDelay}
            <span class="badge warn" title="Quotes delayed ~15 min">
              <WatchlistIcon name="clock" size={10} />
              15m
            </span>
          {/if}
        </div>
      </header>

      <div class="table-body">
        {#each sortedSymbols as sym (sym)}
          {@const q = quoteFor(sym)}
          {@const cc = q ? changeColor(q.change) : "neutral"}
          {@const accent = colorVarForChange(cc)}
          <div class="row">
            <div class="cell sym-cell">
              <span class="sym">{sym}</span>
            </div>
            {#each settings.columns as col (col)}
              {#if col === "sparkline"}
                {@const sd = sparklineFor(sym)}
                <div class="cell sparkline-cell">
                  {#if sd.length > 1}
                    <Sparkline data={sd} color={cc} />
                  {/if}
                </div>
              {:else}
                <div class="cell data-cell" style={isColoredColumn(col) ? `color: ${accent}` : ""}>
                  {formatColumnValue(col, q)}
                </div>
              {/if}
            {/each}
          </div>
        {/each}
      </div>

      {#if error}
        <div class="error-bar">
          <WatchlistIcon name="circle-alert" size={11} />
          <span>{error}</span>
        </div>
      {/if}

      <button
        type="button"
        class="refresh-btn"
        class:visible={showRefresh}
        disabled={loading}
        onclick={() => refresh(true)}
        title="Refresh"
      >
        <WatchlistIcon name="rotate-cw" size={12} class={loading ? "spin" : ""} />
      </button>
    {/if}
  </div>
</div>

<style>
  .watchlist-inner {
    display: flex;
    flex-direction: column;
    gap: clamp(0.15rem, 1cqi, 0.4rem);
    color: var(--widget-text, rgb(241 245 249));
    overflow: hidden;
    container-type: inline-size;
  }

  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: var(--widget-text, rgb(148 163 184));
    text-align: center;
    padding: 0 0.5rem;
  }

  .empty p {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.85;
  }

  .error-empty .retry {
    margin-top: 0.25rem;
    padding: 0.25rem 0.6rem;
    border-radius: 0.375rem;
    border: 1px solid currentColor;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 0.75rem;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .title {
    font-size: clamp(0.7rem, 3.5cqi, 0.95rem);
    font-weight: 600;
    letter-spacing: 0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .badges {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: clamp(0.05rem, 0.4cqi, 0.12rem) clamp(0.25rem, 1.4cqi, 0.45rem);
    border-radius: 0.3rem;
    font-size: clamp(0.5rem, 2cqi, 0.65rem);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .badge.muted {
    background: rgb(15 23 42 / 0.45);
    border: 1px solid rgb(71 85 105 / 0.6);
    color: rgb(148 163 184);
  }

  .badge.warn {
    background: rgb(166 106 44 / 0.18);
    border: 1px solid rgb(166 106 44 / 0.6);
    color: var(--ui-warning);
  }

  .table-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .row {
    display: flex;
    align-items: center;
    gap: clamp(0.3rem, 1.5cqi, 0.6rem);
    padding: clamp(0.15rem, 0.8cqi, 0.3rem) 0;
    border-bottom: 1px solid rgb(51 65 85 / 0.25);
    flex-shrink: 0;
  }

  .row:last-child {
    border-bottom: none;
  }

  .sym-cell {
    flex: 0 0 auto;
    min-width: clamp(2.5rem, 12cqi, 4rem);
  }

  .sym {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: clamp(0.65rem, 2.8cqi, 0.85rem);
    font-weight: 600;
    letter-spacing: 0.02em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .data-cell {
    flex: 1;
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-size: clamp(0.6rem, 2.5cqi, 0.82rem);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .sparkline-cell {
    flex: 0 0 clamp(36px, 15cqi, 72px);
    height: clamp(16px, 5cqi, 24px);
  }

  .error-bar {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.4rem;
    border-radius: 0.3rem;
    background: rgb(127 29 29 / 0.25);
    border: 1px solid rgb(220 38 38 / 0.4);
    color: rgb(252 165 165);
    font-size: 0.7rem;
    flex-shrink: 0;
  }

  .refresh-btn {
    position: absolute;
    top: 0.35rem;
    right: 0.35rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    background: rgb(15 23 42 / 0.6);
    border: 1px solid rgb(71 85 105 / 0.4);
    border-radius: 0.3rem;
    color: rgb(148 163 184);
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
  }

  .refresh-btn.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .refresh-btn:hover {
    color: rgb(226 232 240);
    background: rgb(15 23 42 / 0.85);
  }

  .refresh-btn:disabled {
    cursor: not-allowed;
  }

  :global(.spin) {
    animation: watchlist-spin 1s linear infinite;
  }

  @keyframes watchlist-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
