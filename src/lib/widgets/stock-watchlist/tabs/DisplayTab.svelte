<script lang="ts">
  import type { WidgetSettingsTabProps } from "$lib/widgets/types.js";
  import {
    type StockWatchlistSettings,
    type WatchlistColumn,
    type WatchlistRefreshSec,
    type SparklineRange,
    WATCHLIST_COLUMN_OPTIONS,
    WATCHLIST_SORT_OPTIONS,
    WATCHLIST_SPARKLINE_RANGE_OPTIONS,
    WATCHLIST_REFRESH_OPTIONS,
  } from "../definition.js";

  let { settings, updateSettings }: WidgetSettingsTabProps<StockWatchlistSettings> = $props();

  function set<K extends keyof StockWatchlistSettings>(key: K, value: StockWatchlistSettings[K]) {
    updateSettings({ ...settings, [key]: value });
  }

  function toggleColumn(col: WatchlistColumn) {
    const active = settings.columns.includes(col);
    const next = active ? settings.columns.filter((c) => c !== col) : [...settings.columns, col];
    updateSettings({ ...settings, columns: next });
  }

  function setSparklineRange(value: SparklineRange) {
    updateSettings({ ...settings, sparklineRange: value, cachedSparklines: {} });
  }

  function setRefresh(value: WatchlistRefreshSec) {
    updateSettings({ ...settings, refreshIntervalSec: value });
  }
</script>

<div class="form">
  <section class="group">
    <label for="wl-title" class="group-title">Title</label>
    <input
      id="wl-title"
      type="text"
      class="text-input"
      placeholder="Watchlist"
      value={settings.customTitle ?? ""}
      oninput={(e) => set("customTitle", (e.currentTarget as HTMLInputElement).value)}
    />
    <p class="hint">Leave blank to show &ldquo;Watchlist.&rdquo;</p>
  </section>

  <section class="group">
    <h3 class="group-title">Columns to show</h3>
    <p class="hint">Tap to toggle. Order reflects left-to-right render order.</p>
    <div class="pill-grid">
      {#each WATCHLIST_COLUMN_OPTIONS as opt (opt.value)}
        {@const active = settings.columns.includes(opt.value)}
        <button
          type="button"
          class="pill"
          class:active
          aria-pressed={active}
          onclick={() => toggleColumn(opt.value)}
        >
          {opt.label}
        </button>
      {/each}
    </div>
  </section>

  <section class="group">
    <label for="wl-sort" class="group-title">Sort by</label>
    <select
      id="wl-sort"
      class="select"
      value={settings.sortBy}
      onchange={(e) =>
        set(
          "sortBy",
          (e.currentTarget as HTMLSelectElement).value as StockWatchlistSettings["sortBy"],
        )}
    >
      {#each WATCHLIST_SORT_OPTIONS as opt (opt.value)}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
    <p class="hint">Manual honors the order from the Symbols tab.</p>
  </section>

  <section class="group">
    <h3 class="group-title">Sparkline range</h3>
    <div class="segmented">
      {#each WATCHLIST_SPARKLINE_RANGE_OPTIONS as opt (opt.value)}
        {@const active = settings.sparklineRange === opt.value}
        <button
          type="button"
          class="seg"
          class:active
          aria-pressed={active}
          onclick={() => setSparklineRange(opt.value)}
        >
          {opt.label}
        </button>
      {/each}
    </div>
  </section>

  <section class="group">
    <label for="wl-refresh" class="group-title">Refresh interval</label>
    <select
      id="wl-refresh"
      class="select"
      value={String(settings.refreshIntervalSec)}
      onchange={(e) =>
        setRefresh(Number((e.currentTarget as HTMLSelectElement).value) as WatchlistRefreshSec)}
    >
      {#each WATCHLIST_REFRESH_OPTIONS as opt (opt.value)}
        <option value={String(opt.value)}>{opt.label}</option>
      {/each}
    </select>
  </section>

  <section class="group">
    <label class="row">
      <span class="row-label">Pause when market closed</span>
      <input
        type="checkbox"
        checked={settings.pauseWhenMarketClosed}
        onchange={(e) =>
          set("pauseWhenMarketClosed", (e.currentTarget as HTMLInputElement).checked)}
      />
    </label>
    <p class="hint">Suspends auto-refresh outside US NYSE / NASDAQ trading hours.</p>
  </section>
</div>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .group-title {
    margin: 0;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgb(148 163 184);
  }

  .hint {
    font-size: 0.7rem;
    color: rgb(148 163 184);
    margin: 0;
  }

  .pill-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .pill {
    padding: 0.4rem 0.7rem;
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.4rem;
    color: rgb(148 163 184);
    font-size: 0.78rem;
    cursor: pointer;
    transition:
      background 0.12s ease,
      border-color 0.12s ease,
      color 0.12s ease;
  }

  .pill:hover {
    border-color: rgb(100 116 139);
    color: rgb(226 232 240);
  }

  .pill.active {
    background: rgb(59 130 246 / 0.18);
    border-color: rgb(59 130 246);
    color: rgb(241 245 249);
  }

  .segmented {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.25rem;
  }

  .seg {
    padding: 0.4rem 0.3rem;
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.35rem;
    color: rgb(148 163 184);
    font-size: 0.78rem;
    font-weight: 500;
    cursor: pointer;
    font-variant-numeric: tabular-nums;
  }

  .seg:hover {
    border-color: rgb(100 116 139);
    color: rgb(226 232 240);
  }

  .seg.active {
    background: rgb(59 130 246 / 0.18);
    border-color: rgb(59 130 246);
    color: rgb(241 245 249);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .row-label {
    font-size: 0.875rem;
    color: rgb(226 232 240);
  }

  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    accent-color: rgb(59 130 246);
    cursor: pointer;
  }

  .text-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: rgb(2 6 23 / 0.7);
    border: 1px solid rgb(71 85 105);
    color: rgb(241 245 249);
    font-size: 0.9rem;
  }

  .text-input:focus {
    outline: none;
    border-color: rgb(59 130 246);
    box-shadow: 0 0 0 2px rgb(59 130 246 / 0.25);
  }

  .select {
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: rgb(2 6 23 / 0.7);
    border: 1px solid rgb(71 85 105);
    color: rgb(241 245 249);
    font-size: 0.9rem;
  }

  .select:focus {
    outline: none;
    border-color: rgb(59 130 246);
    box-shadow: 0 0 0 2px rgb(59 130 246 / 0.25);
  }
</style>
