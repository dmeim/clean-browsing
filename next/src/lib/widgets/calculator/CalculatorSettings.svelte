<script lang="ts">
  import type { WidgetSettingsProps } from "$lib/widgets/types.js";
  import type { CalculatorSettings } from "./definition.js";

  let { settings, updateSettings }: WidgetSettingsProps<CalculatorSettings> = $props();

  const normalized = $derived<CalculatorSettings>({
    keyboardSupport: settings.keyboardSupport ?? true,
    roundButtons: settings.roundButtons ?? true,
    colorOperators: settings.colorOperators ?? true,
    colorEquals: settings.colorEquals ?? true,
    colorClear: settings.colorClear ?? true,
    historyEnabled: settings.historyEnabled ?? true,
    history: settings.history ?? [],
  });

  function set<K extends keyof CalculatorSettings>(key: K, value: CalculatorSettings[K]) {
    updateSettings({ ...normalized, [key]: value });
  }

  function clearHistory() {
    updateSettings({ ...normalized, history: [] });
  }

  const historyCount = $derived(normalized.history.length);
</script>

<div class="form">
  <label class="row">
    <span class="label">Enable keyboard support</span>
    <input
      type="checkbox"
      checked={normalized.keyboardSupport}
      onchange={(e) => set("keyboardSupport", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>

  <label class="row">
    <span class="label">Round buttons</span>
    <input
      type="checkbox"
      checked={normalized.roundButtons}
      onchange={(e) => set("roundButtons", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>

  <label class="row">
    <span class="label">Color operator buttons</span>
    <input
      type="checkbox"
      checked={normalized.colorOperators}
      onchange={(e) => set("colorOperators", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>

  <label class="row">
    <span class="label">Color equals button</span>
    <input
      type="checkbox"
      checked={normalized.colorEquals}
      onchange={(e) => set("colorEquals", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>

  <label class="row">
    <span class="label">Color clear / backspace buttons</span>
    <input
      type="checkbox"
      checked={normalized.colorClear}
      onchange={(e) => set("colorClear", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>

  <label class="row">
    <span class="label">Enable history</span>
    <input
      type="checkbox"
      checked={normalized.historyEnabled}
      onchange={(e) => set("historyEnabled", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>

  {#if normalized.historyEnabled}
    <div class="history-info">
      <span class="history-count">
        {historyCount} {historyCount === 1 ? "entry" : "entries"} stored
      </span>
      <button
        type="button"
        class="btn-danger"
        disabled={historyCount === 0}
        onclick={clearHistory}
      >
        Clear history
      </button>
    </div>
  {/if}
</div>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
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

  .label {
    font-size: 0.875rem;
    color: rgb(226 232 240);
  }

  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    accent-color: rgb(59 130 246);
    cursor: pointer;
  }

  .history-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.5rem;
    margin-top: 0.25rem;
  }

  .history-count {
    font-size: 0.8rem;
    color: rgb(148 163 184);
  }

  .btn-danger {
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
    background: rgb(127 29 29 / 0.6);
    color: rgb(254 202 202);
    border: 1px solid rgb(185 28 28);
    border-radius: 0.375rem;
    cursor: pointer;
  }

  .btn-danger:hover:not(:disabled) {
    background: rgb(185 28 28 / 0.7);
  }

  .btn-danger:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
