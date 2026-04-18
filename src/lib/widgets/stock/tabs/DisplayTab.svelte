<script lang="ts">
  import type { WidgetSettingsTabProps } from "$lib/widgets/types.js";
  import type { StatField, ChartRange } from "$lib/markets/index.js";
  import {
    type StockSettings,
    type StockRefreshSec,
    STOCK_RANGE_OPTIONS,
    STOCK_REFRESH_OPTIONS,
    STOCK_STAT_OPTIONS,
  } from "../definition.js";

  let { settings, updateSettings }: WidgetSettingsTabProps<StockSettings> = $props();

  function set<K extends keyof StockSettings>(key: K, value: StockSettings[K]) {
    updateSettings({ ...settings, [key]: value });
  }

  function toggleStat(field: StatField) {
    const active = settings.stats.includes(field);
    const next = active ? settings.stats.filter((s) => s !== field) : [...settings.stats, field];
    updateSettings({ ...settings, stats: next });
  }

  function setRange(value: ChartRange) {
    // Clearing cached history forces a refetch in the new range.
    updateSettings({ ...settings, chartRange: value, cachedHistory: [] });
  }

  function setRefresh(value: StockRefreshSec) {
    updateSettings({ ...settings, refreshIntervalSec: value });
  }
</script>

<div class="form">
  <section class="group">
    <h3 class="group-title">Stats to show</h3>
    <p class="hint">Tap to toggle. Order in the list reflects render order.</p>
    <div class="pill-grid">
      {#each STOCK_STAT_OPTIONS as opt (opt.value)}
        {@const active = settings.stats.includes(opt.value)}
        <button
          type="button"
          class="pill"
          class:active
          aria-pressed={active}
          onclick={() => toggleStat(opt.value)}
        >
          {opt.label}
        </button>
      {/each}
    </div>
  </section>

  <section class="group">
    <h3 class="group-title">Chart range</h3>
    <div class="segmented">
      {#each STOCK_RANGE_OPTIONS as opt (opt.value)}
        {@const active = settings.chartRange === opt.value}
        <button
          type="button"
          class="seg"
          class:active
          aria-pressed={active}
          onclick={() => setRange(opt.value)}
        >
          {opt.label}
        </button>
      {/each}
    </div>
  </section>

  <section class="group">
    <label class="row">
      <span class="row-label">Show chart</span>
      <input
        type="checkbox"
        checked={settings.showChart}
        onchange={(e) => set("showChart", (e.currentTarget as HTMLInputElement).checked)}
      />
    </label>
    <p class="hint">
      Auto-hides at very small widget sizes and turns back on once you grow it again.
    </p>
  </section>

  <section class="group">
    <label for="stock-refresh" class="group-title">Refresh interval</label>
    <select
      id="stock-refresh"
      class="select"
      value={String(settings.refreshIntervalSec)}
      onchange={(e) =>
        setRefresh(Number((e.currentTarget as HTMLSelectElement).value) as StockRefreshSec)}
    >
      {#each STOCK_REFRESH_OPTIONS as opt (opt.value)}
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
    <p class="hint">
      Suspends auto-refresh outside US NYSE / NASDAQ trading hours. Has no effect on crypto symbols
      (24/7).
    </p>
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
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.25rem;
  }

  @media (max-width: 420px) {
    .segmented {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
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
