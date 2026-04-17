<script lang="ts">
  import type { WidgetSettingsTabProps } from "$lib/widgets/types.js";
  import type { StockWatchlistSettings } from "../definition.js";
  import { searchSymbols, type SymbolSearchResult } from "$lib/markets/index.js";
  import WatchlistIcon from "../WatchlistIcon.svelte";

  let { settings, updateSettings }: WidgetSettingsTabProps<StockWatchlistSettings> = $props();

  let query = $state("");
  let searching = $state(false);
  let searchError = $state<string | null>(null);
  let results = $state<SymbolSearchResult[]>([]);
  let dragIdx = $state<number | null>(null);
  let dragOverIdx = $state<number | null>(null);

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

  function addSymbol(r: SymbolSearchResult) {
    const sym = r.symbol.trim().toUpperCase();
    if (settings.symbols.map((s) => s.trim().toUpperCase()).includes(sym)) {
      searchError = `${sym} is already in the list.`;
      return;
    }
    updateSettings({
      ...settings,
      symbols: [...settings.symbols, sym],
    });
    results = [];
    query = "";
    searchError = null;
  }

  function removeSymbol(idx: number) {
    const removed = settings.symbols[idx]?.trim().toUpperCase();
    const nextSymbols = settings.symbols.filter((_, i) => i !== idx);
    const nextQuotes = { ...settings.cachedQuotes };
    const nextSparklines = { ...settings.cachedSparklines };
    if (removed) {
      delete nextQuotes[removed];
      delete nextSparklines[removed];
    }
    updateSettings({
      ...settings,
      symbols: nextSymbols,
      cachedQuotes: nextQuotes,
      cachedSparklines: nextSparklines,
    });
  }

  function handleDragStart(e: DragEvent, idx: number) {
    dragIdx = idx;
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: DragEvent, idx: number) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    dragOverIdx = idx;
  }

  function handleDrop(e: DragEvent, targetIdx: number) {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== targetIdx) {
      const next = [...settings.symbols];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(targetIdx, 0, moved);
      updateSettings({ ...settings, symbols: next });
    }
    dragIdx = null;
    dragOverIdx = null;
  }

  function handleDragEnd() {
    dragIdx = null;
    dragOverIdx = null;
  }
</script>

<div class="form">
  {#if settings.symbols.length === 0}
    <div class="notice">
      <strong>Network notice.</strong> This widget calls
      <code>query1.finance.yahoo.com</code> to fetch quote and chart data for each symbol. Nothing is
      sent anywhere else, and no requests fire until you add symbols below. Free Yahoo data is typically
      delayed 15 minutes for US equities.
    </div>
  {/if}

  <div class="section">
    <span class="label">Add symbol</span>
    <div class="search-row">
      <input
        type="text"
        class="text-input"
        placeholder="Search by symbol or company\u2026"
        bind:value={query}
        onkeydown={handleSearchKey}
      />
      <button type="button" class="btn" onclick={runSearch} disabled={searching}>
        {searching ? "\u2026" : "Search"}
      </button>
    </div>

    {#if searchError}
      <p class="hint error">{searchError}</p>
    {/if}

    {#if results.length > 0}
      <ul class="results">
        {#each results as r (r.symbol + r.exchange)}
          <li>
            <button type="button" class="result" onclick={() => addSymbol(r)}>
              <div class="result-main">
                <span class="result-symbol">{r.symbol}</span>
                <span class="result-name">{r.name}</span>
              </div>
              <div class="result-meta">
                {#if r.exchange}<span class="result-exchange">{r.exchange}</span>{/if}
                <WatchlistIcon name="plus" size={14} />
              </div>
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    <p class="hint">
      Exchange suffixes accepted: <code>TSCO.L</code> (London), <code>7203.T</code> (Tokyo).
    </p>
  </div>

  {#if settings.symbols.length > 0}
    <div class="section">
      <span class="label">Symbols ({settings.symbols.length})</span>
      <ul class="symbol-list">
        {#each settings.symbols as sym, i (sym + i)}
          {@const q = settings.cachedQuotes[sym.trim().toUpperCase()]}
          <li
            class="symbol-row"
            class:dragging={dragIdx === i}
            class:drag-over={dragOverIdx === i && dragIdx !== i}
            draggable="true"
            ondragstart={(e) => handleDragStart(e, i)}
            ondragover={(e) => handleDragOver(e, i)}
            ondrop={(e) => handleDrop(e, i)}
            ondragend={handleDragEnd}
          >
            <span class="drag-handle">
              <WatchlistIcon name="grip-vertical" size={14} />
            </span>
            <div class="symbol-info">
              <span class="symbol-ticker">{sym}</span>
              {#if q?.name}
                <span class="symbol-name">{q.name}</span>
              {/if}
            </div>
            <button
              type="button"
              class="remove-btn"
              onclick={() => removeSymbol(i)}
              title="Remove {sym}"
            >
              <WatchlistIcon name="trash-2" size={14} />
            </button>
          </li>
        {/each}
      </ul>
      <p class="hint">Drag to reorder. Order matters when sort is set to &ldquo;Manual.&rdquo;</p>
    </div>
  {/if}
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
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .result-exchange {
    font-size: 0.7rem;
    color: rgb(148 163 184);
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
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

  .symbol-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .symbol-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.6rem;
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.4rem;
    transition:
      border-color 0.12s ease,
      opacity 0.12s ease;
  }

  .symbol-row.dragging {
    opacity: 0.4;
  }

  .symbol-row.drag-over {
    border-color: rgb(59 130 246);
  }

  .drag-handle {
    cursor: grab;
    color: rgb(100 116 139);
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .symbol-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    min-width: 0;
  }

  .symbol-ticker {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.85rem;
    font-weight: 600;
    color: rgb(241 245 249);
  }

  .symbol-name {
    font-size: 0.7rem;
    color: rgb(148 163 184);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remove-btn {
    background: none;
    border: none;
    color: rgb(100 116 139);
    cursor: pointer;
    padding: 0.2rem;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .remove-btn:hover {
    color: rgb(248 113 113);
  }
</style>
