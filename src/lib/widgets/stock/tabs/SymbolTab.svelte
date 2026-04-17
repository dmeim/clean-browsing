<script lang="ts">
  import type { WidgetSettingsTabProps } from "$lib/widgets/types.js";
  import type { StockSettings } from "../definition.js";
  import { searchSymbols, type SymbolSearchResult } from "$lib/markets/index.js";

  let { settings, updateSettings }: WidgetSettingsTabProps<StockSettings> = $props();

  let query = $state("");
  let searching = $state(false);
  let searchError = $state<string | null>(null);
  let results = $state<SymbolSearchResult[]>([]);

  async function runSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    searching = true;
    searchError = null;
    try {
      results = await searchSymbols(trimmed);
      if (results.length === 0) searchError = "No matches found.";
    } catch (e) {
      searchError = (e as Error).message || "Search failed.";
    } finally {
      searching = false;
    }
  }

  function handleSearchKey(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
    }
  }

  function pickResult(r: SymbolSearchResult) {
    updateSettings({
      ...settings,
      symbol: r.symbol,
      label: settings.label || "",
      cachedQuote: null,
      cachedHistory: [],
    });
    results = [];
    query = "";
  }

  function setLabel(value: string) {
    updateSettings({ ...settings, label: value });
  }

  function clearSymbol() {
    updateSettings({
      ...settings,
      symbol: "",
      cachedQuote: null,
      cachedHistory: [],
    });
  }
</script>

<div class="form">
  {#if !settings.symbol}
    <div class="notice">
      <strong>Network notice.</strong> This widget calls <code>query1.finance.yahoo.com</code> to fetch
      quote and chart data. Nothing is sent anywhere else, and no requests fire until you pick a symbol
      below. Free Yahoo data is typically delayed 15 minutes for US equities.
    </div>
  {/if}

  <div class="section">
    <span class="label">Symbol</span>
    {#if settings.symbol}
      <div class="current">
        <div class="current-text">
          <span class="current-symbol">{settings.symbol}</span>
          {#if settings.cachedQuote?.name && settings.cachedQuote.symbol === settings.symbol}
            <span class="current-name">{settings.cachedQuote.name}</span>
          {/if}
        </div>
        <button type="button" class="btn ghost small" onclick={clearSymbol}>Change</button>
      </div>
    {/if}

    <div class="search-row">
      <input
        type="text"
        class="text-input"
        placeholder="Search by symbol or company…"
        bind:value={query}
        onkeydown={handleSearchKey}
      />
      <button type="button" class="btn" onclick={runSearch} disabled={searching}>
        {searching ? "…" : "Search"}
      </button>
    </div>

    {#if searchError}
      <p class="hint error">{searchError}</p>
    {/if}

    {#if results.length > 0}
      <ul class="results">
        {#each results as r (r.symbol + r.exchange)}
          <li>
            <button type="button" class="result" onclick={() => pickResult(r)}>
              <div class="result-main">
                <span class="result-symbol">{r.symbol}</span>
                <span class="result-name">{r.name}</span>
              </div>
              <div class="result-meta">
                {#if r.exchange}<span class="result-exchange">{r.exchange}</span>{/if}
                {#if r.type}<span class="result-type">{r.type}</span>{/if}
              </div>
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    <p class="hint">
      Exchange suffixes are accepted: <code>TSCO.L</code> (London), <code>7203.T</code> (Tokyo).
    </p>
  </div>

  <div class="section">
    <label for="stock-label" class="label">Label</label>
    <input
      id="stock-label"
      type="text"
      class="text-input"
      placeholder="Defaults to the company name"
      value={settings.label ?? ""}
      oninput={(e) => setLabel((e.currentTarget as HTMLInputElement).value)}
    />
    <p class="hint">Custom label shown next to the symbol. Leave blank to use the company name.</p>
  </div>
</div>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .notice {
    padding: 0.6rem 0.75rem;
    border-radius: 0.5rem;
    background: rgb(30 41 59 / 0.6);
    border: 1px solid rgb(59 130 246 / 0.4);
    color: rgb(226 232 240);
    font-size: 0.78rem;
    line-height: 1.4;
  }

  .notice code {
    background: rgb(2 6 23 / 0.6);
    padding: 0.05rem 0.3rem;
    border-radius: 0.25rem;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.72rem;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .label {
    font-size: 0.7rem;
    color: rgb(148 163 184);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
  }

  .current {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.5rem;
    gap: 0.5rem;
  }

  .current-text {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  .current-symbol {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.95rem;
    font-weight: 600;
    color: rgb(241 245 249);
  }

  .current-name {
    font-size: 0.75rem;
    color: rgb(148 163 184);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .search-row {
    display: flex;
    gap: 0.4rem;
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

  .btn {
    padding: 0.5rem 0.85rem;
    border-radius: 0.5rem;
    background: rgb(59 130 246);
    color: white;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn.ghost {
    background: transparent;
    border: 1px solid rgb(71 85 105);
    color: rgb(226 232 240);
  }

  .btn.small {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }

  .results {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 14rem;
    overflow-y: auto;
  }

  .result {
    width: 100%;
    text-align: left;
    padding: 0.5rem 0.75rem;
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.4rem;
    color: rgb(226 232 240);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .result:hover {
    border-color: rgb(59 130 246);
  }

  .result-main {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  .result-symbol {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.85rem;
    font-weight: 600;
    color: rgb(241 245 249);
  }

  .result-name {
    font-size: 0.75rem;
    color: rgb(148 163 184);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .result-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.1rem;
    flex-shrink: 0;
  }

  .result-exchange {
    font-size: 0.7rem;
    color: rgb(148 163 184);
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
  }

  .result-type {
    font-size: 0.65rem;
    color: rgb(100 116 139);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .hint {
    font-size: 0.7rem;
    color: rgb(148 163 184);
    margin: 0.1rem 0 0;
  }

  .hint code {
    background: rgb(2 6 23 / 0.6);
    padding: 0.05rem 0.3rem;
    border-radius: 0.25rem;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.68rem;
  }

  .hint.error {
    color: rgb(248 113 113);
  }
</style>
