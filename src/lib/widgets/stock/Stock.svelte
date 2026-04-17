<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import type { WidgetProps } from "$lib/widgets/types.js";
  import type { StockSettings } from "./definition.js";
  import type { StatField } from "$lib/markets/index.js";
  import {
    changeColor,
    colorVarForChange,
    fetchChart,
    formatChange,
    formatNumber,
    formatPercent,
    formatPrice,
    formatPriceCompact,
    formatVolume,
    isUSEquityMarketOpen,
  } from "$lib/markets/index.js";
  import ChartCanvas from "$lib/markets/chart/ChartCanvas.svelte";
  import StockIcon from "./StockIcon.svelte";
  import { uiStore } from "$lib/ui/uiStore.svelte.js";

  let { settings, updateSettings, gridW, gridH }: WidgetProps<StockSettings> = $props();

  let loading = $state(false);
  let error = $state<string | null>(null);
  let hovered = $state(false);
  // Re-derives `marketOpen` on a slow tick so the "closed" pill flips
  // without us having to subscribe to a wall-clock store.
  let nowMs = $state(Date.now());

  // Plain mutable bookkeeping (not reactive). Lets the $effect below stay
  // idempotent under settings updates so it doesn't re-fetch on its own
  // updateSettings call — that's the infinite-loop trap ping-monitor
  // documents in its definition.
  let lastFetched: { symbol: string; range: string } | null = null;
  let currentTimer: {
    id: ReturnType<typeof setInterval>;
    symbol: string;
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
    const symbol = settings.symbol.trim();
    if (!symbol) return;
    if (loading) return;

    if (!force && settings.cachedQuote && settings.cachedQuote.symbol === symbol) {
      const ageSec = (Date.now() - settings.cachedQuote.fetchedAt) / 1000;
      if (ageSec < settings.refreshIntervalSec) return;
    }

    loading = true;
    error = null;
    try {
      const result = await fetchChart(symbol, settings.chartRange);
      // Re-read settings after the async gap so we don't clobber a user
      // edit (e.g. they swapped symbols while the request was in flight).
      if (settings.symbol.trim() !== symbol) return;
      updateSettings({
        ...settings,
        cachedQuote: result.quote,
        cachedHistory: result.history,
      });
    } catch (e) {
      error = (e as Error).message || "Failed to load quote";
    } finally {
      loading = false;
    }
  }

  // Refetch when the symbol or chart range actually changes. The $effect
  // re-runs on every settings update (including the updateSettings call
  // refresh() itself makes), so we gate the network call on a mutable
  // `lastFetched` outside the reactive system. Without this gate, every
  // successful fetch would synchronously trigger another fetch.
  $effect(() => {
    const symbol = settings.symbol;
    const range = settings.chartRange;
    if (!symbol) {
      lastFetched = null;
      return;
    }
    if (lastFetched && lastFetched.symbol === symbol && lastFetched.range === range) return;
    lastFetched = { symbol, range };
    untrack(() => refresh(true));
  });

  // Refresh loop. Re-creates the interval only when symbol or intervalSec
  // changes — the `pauseWhenMarketClosed` toggle is read fresh inside the
  // tick. Same idempotency story as the refetch effect above.
  $effect(() => {
    const symbol = settings.symbol;
    const intervalSec = settings.refreshIntervalSec;

    if (!symbol) {
      if (currentTimer) {
        clearInterval(currentTimer.id);
        currentTimer = null;
      }
      return;
    }

    if (
      currentTimer &&
      currentTimer.symbol === symbol &&
      currentTimer.intervalSec === intervalSec
    ) {
      return;
    }

    if (currentTimer) clearInterval(currentTimer.id);
    const id = setInterval(() => {
      if (settings.pauseWhenMarketClosed && !isUSEquityMarketOpen()) return;
      void refresh(true);
    }, intervalSec * 1000);
    currentTimer = { id, symbol, intervalSec };
  });

  onDestroy(() => {
    if (currentTimer) {
      clearInterval(currentTimer.id);
      currentTimer = null;
    }
  });

  // Auto-toggle the chart based on widget size. Below 2×2 normal cells the
  // chart is too small to be useful; at 3×3 normal or larger it earns its
  // space. Sizes in between (e.g. 2×2 exactly) leave the user's manual
  // setting alone — that's the hysteresis zone.
  $effect(() => {
    const w = gridW;
    const h = gridH;
    let desired: boolean | null = null;
    if (w < 2 || h < 2) desired = false;
    else if (w >= 3 && h >= 3) desired = true;
    if (desired === null) return;
    if (desired === settings.showChart) return;
    untrack(() => updateSettings({ ...settings, showChart: desired }));
  });

  const padV = $derived(settings.paddingV ?? 10);
  const padH = $derived(settings.paddingH ?? 12);
  const quote = $derived(settings.cachedQuote);
  const cachedMatchesSymbol = $derived(
    quote != null && quote.symbol === settings.symbol.trim().toUpperCase(),
  );
  const visibleQuote = $derived(cachedMatchesSymbol ? quote : null);
  const visibleHistory = $derived(cachedMatchesSymbol ? settings.cachedHistory : []);
  const changeKind = $derived(visibleQuote ? changeColor(visibleQuote.change) : "neutral");
  const accentColor = $derived(colorVarForChange(changeKind));

  const displayTitle = $derived((settings.label ?? "").trim() || visibleQuote?.name || "");
  const showRefresh = $derived(hovered && settings.symbol && !uiStore.editMode);
  const showRefLine = $derived(settings.chartRange === "1D" && visibleQuote != null);

  function formatStatValue(field: StatField): string {
    if (!visibleQuote) return "—";
    const q = visibleQuote;
    switch (field) {
      case "change":
        return formatChange(q.change);
      case "changePercent":
        return formatPercent(q.changePercent);
      case "dayHigh":
        return formatPrice(q.dayHigh, q.currency);
      case "dayLow":
        return formatPrice(q.dayLow, q.currency);
      case "dayRange":
        return Number.isFinite(q.dayLow) && Number.isFinite(q.dayHigh)
          ? `${formatPrice(q.dayLow, q.currency)}–${formatPrice(q.dayHigh, q.currency)}`
          : "—";
      case "open":
        return formatPrice(q.open, q.currency);
      case "previousClose":
        return formatPrice(q.previousClose, q.currency);
      case "fiftyTwoHigh":
        return formatPrice(q.fiftyTwoHigh, q.currency);
      case "fiftyTwoLow":
        return formatPrice(q.fiftyTwoLow, q.currency);
      case "volume":
        return formatVolume(q.volume);
      case "avgVolume":
        return q.avgVolume != null ? formatVolume(q.avgVolume) : "—";
      case "marketCap":
        return q.marketCap != null ? formatPriceCompact(q.marketCap, q.currency) : "—";
      case "peRatio":
        return q.peRatio != null ? formatNumber(q.peRatio) : "—";
      case "dividendYield":
        return q.dividendYield != null ? formatPercent(q.dividendYield, false) : "—";
    }
  }

  const STAT_LABELS: Record<StatField, string> = {
    change: "Change",
    changePercent: "Change %",
    dayHigh: "Day high",
    dayLow: "Day low",
    dayRange: "Day range",
    open: "Open",
    previousClose: "Prev close",
    fiftyTwoHigh: "52w high",
    fiftyTwoLow: "52w low",
    volume: "Volume",
    avgVolume: "Avg volume",
    marketCap: "Market cap",
    peRatio: "P/E ratio",
    dividendYield: "Div yield",
  };

  function isColoredStat(field: StatField): boolean {
    return field === "change" || field === "changePercent";
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="widget-card stock"
  onmouseenter={() => (hovered = true)}
  onmouseleave={() => (hovered = false)}
>
  <div
    class="widget-inner stock-inner"
    style="top: {padV}px; bottom: {padV}px; left: {padH}px; right: {padH}px;"
  >
    {#if !settings.symbol}
      <div class="empty">
        <StockIcon name="chart-line" size={28} />
        <p>Open settings to add a symbol.</p>
      </div>
    {:else if !visibleQuote && loading}
      <div class="empty">
        <StockIcon name="rotate-cw" size={20} class="spin" />
        <p>Loading {settings.symbol}…</p>
      </div>
    {:else if !visibleQuote && error}
      <div class="empty error-empty">
        <StockIcon name="circle-alert" size={20} />
        <p>{error}</p>
        <button type="button" class="retry" onclick={() => refresh(true)}>Retry</button>
      </div>
    {:else if visibleQuote}
      <header class="head">
        <div class="title-block">
          <span class="symbol">{visibleQuote.symbol}</span>
          {#if displayTitle}
            <span class="name">{displayTitle}</span>
          {/if}
        </div>
        <div class="badges">
          {#if !marketOpen}
            <span class="badge muted" title="US market closed — last close shown">Closed</span>
          {/if}
          {#if visibleQuote.isDelayed}
            <span class="badge warn" title="Quote is {visibleQuote.delayMinutes} min delayed">
              <StockIcon name="clock" size={10} />
              {visibleQuote.delayMinutes}m
            </span>
          {/if}
        </div>
      </header>

      <section class="hero">
        <div class="price" style="color: var(--widget-text, rgb(241 245 249));">
          {formatPrice(visibleQuote.price, visibleQuote.currency)}
        </div>
        <div class="change" style="color: {accentColor};">
          <StockIcon
            name={changeKind === "up"
              ? "trending-up"
              : changeKind === "down"
                ? "trending-down"
                : "minus"}
            size={14}
          />
          <span class="change-value">{formatChange(visibleQuote.change)}</span>
          <span class="change-pct">({formatPercent(visibleQuote.changePercent)})</span>
        </div>
      </section>

      {#if settings.showChart && visibleHistory.length > 1}
        <section class="chart">
          <ChartCanvas
            data={visibleHistory}
            color={changeKind}
            referenceLine={showRefLine ? visibleQuote.previousClose : null}
          />
        </section>
      {/if}

      {#if settings.stats.length > 0}
        <section class="stats">
          {#each settings.stats as field (field)}
            <div class="stat">
              <span class="stat-label">{STAT_LABELS[field]}</span>
              <span class="stat-value" style={isColoredStat(field) ? `color: ${accentColor};` : ""}>
                {formatStatValue(field)}
              </span>
            </div>
          {/each}
        </section>
      {/if}

      {#if error}
        <div class="error-bar">
          <StockIcon name="circle-alert" size={11} />
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
        <StockIcon name="rotate-cw" size={12} class={loading ? "spin" : ""} />
      </button>
    {/if}
  </div>
</div>

<style>
  .stock-inner {
    display: flex;
    flex-direction: column;
    gap: clamp(0.2rem, 1.5cqi, 0.5rem);
    color: var(--widget-text, rgb(241 245 249));
    overflow: hidden;
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
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
    flex-shrink: 0;
    min-width: 0;
  }

  .title-block {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    min-width: 0;
  }

  .symbol {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: clamp(0.7rem, 4.2cqi, 1rem);
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .name {
    font-size: clamp(0.55rem, 2.8cqi, 0.8rem);
    opacity: 0.7;
    line-height: 1.15;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
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

  .hero {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    flex-shrink: 0;
  }

  .price {
    font-size: clamp(1rem, 10cqi, 2.4rem);
    font-weight: 600;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .change {
    display: flex;
    align-items: center;
    gap: clamp(0.15rem, 1cqi, 0.35rem);
    font-size: clamp(0.65rem, 3.4cqi, 1rem);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
    flex-wrap: wrap;
  }

  .change-value {
    font-weight: 600;
  }

  .change-pct {
    opacity: 0.85;
  }

  .chart {
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
    position: relative;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(0.3rem, 1.5cqi, 0.55rem) clamp(0.5rem, 2cqi, 0.9rem);
    flex-shrink: 0;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    min-width: 0;
  }

  .stat-label {
    color: var(--ui-muted-fg, rgb(148 163 184));
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: clamp(0.55rem, 1.6cqi, 0.7rem);
    line-height: 1.15;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stat-value {
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    font-size: clamp(0.78rem, 2.4cqi, 0.95rem);
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

  .stock-inner {
    container-type: inline-size;
  }

  :global(.spin) {
    animation: stock-spin 1s linear infinite;
  }

  @keyframes stock-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
