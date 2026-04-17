<script lang="ts">
  import type { WidgetSettingsTabProps } from "$lib/widgets/types.js";
  import type { StopwatchSettings, StopwatchPrecision } from "./definition.js";

  let { settings, updateSettings }: WidgetSettingsTabProps<StopwatchSettings> = $props();

  const normalized = $derived<StopwatchSettings>({
    runState: settings.runState ?? "idle",
    startedAtEpoch: settings.startedAtEpoch ?? 0,
    elapsedBeforeResume: settings.elapsedBeforeResume ?? 0,
    precision: settings.precision ?? "cs",
    maxLapsShown: settings.maxLapsShown ?? 10,
    showSplits: settings.showSplits ?? true,
    soundFeedback: settings.soundFeedback ?? false,
    laps: settings.laps ?? [],
    paddingV: settings.paddingV ?? 8,
    paddingH: settings.paddingH ?? 8,
  });

  function set<K extends keyof StopwatchSettings>(key: K, value: StopwatchSettings[K]) {
    updateSettings({ ...normalized, [key]: value });
  }

  let confirmClear = $state(false);
  let confirmTimer = 0;

  function armClear() {
    if (normalized.laps.length === 0) return;
    if (confirmClear) {
      updateSettings({ ...normalized, laps: [] });
      confirmClear = false;
      if (confirmTimer) window.clearTimeout(confirmTimer);
      confirmTimer = 0;
      return;
    }
    confirmClear = true;
    confirmTimer = window.setTimeout(() => {
      confirmClear = false;
      confirmTimer = 0;
    }, 3000);
  }

  function exportCsv() {
    if (normalized.laps.length === 0) return;
    const header = "index,split_ms,total_ms,recorded_at_iso\n";
    const rows = [...normalized.laps]
      .sort((a, b) => a.index - b.index)
      .map((l) => `${l.index},${l.splitMs},${l.totalMs},${new Date(l.recordedAt).toISOString()}`)
      .join("\n");
    const blob = new Blob([header + rows + "\n"], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `stopwatch-laps-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const precisionOptions: { value: StopwatchPrecision; label: string }[] = [
    { value: "ms", label: "ms" },
    { value: "cs", label: "cs" },
    { value: "s", label: "s" },
  ];
</script>

<div class="form">
  <div class="row stack">
    <span class="label">Precision</span>
    <div class="segmented" role="radiogroup" aria-label="Precision">
      {#each precisionOptions as opt (opt.value)}
        <button
          type="button"
          role="radio"
          aria-checked={normalized.precision === opt.value}
          class="seg"
          class:selected={normalized.precision === opt.value}
          onclick={() => set("precision", opt.value)}
        >
          {opt.label}
        </button>
      {/each}
    </div>
    <span class="hint">How many digits the elapsed time shows.</span>
  </div>

  <div class="row stack">
    <div class="label-row">
      <span class="label">Max laps shown</span>
      <span class="value">{normalized.maxLapsShown === 0 ? "all" : normalized.maxLapsShown}</span>
    </div>
    <input
      type="number"
      min="0"
      max={200}
      step="1"
      class="text-input"
      value={normalized.maxLapsShown}
      oninput={(e) => set("maxLapsShown", Number((e.currentTarget as HTMLInputElement).value))}
    />
    <span class="hint"
      >How many laps render in the widget. <code>0</code> shows all. History is stored up to 200.</span
    >
  </div>

  <label class="row">
    <span class="label">Show splits</span>
    <input
      type="checkbox"
      checked={normalized.showSplits}
      onchange={(e) => set("showSplits", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>

  <label class="row">
    <span class="label">Sound feedback on Lap</span>
    <input
      type="checkbox"
      checked={normalized.soundFeedback}
      onchange={(e) => set("soundFeedback", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>

  <div class="row stack">
    <div class="label-row">
      <span class="label">Lap history</span>
      <span class="value">{normalized.laps.length} recorded</span>
    </div>
    <div class="button-row">
      <button type="button" class="btn" onclick={exportCsv} disabled={normalized.laps.length === 0}>
        Export CSV
      </button>
      <button
        type="button"
        class="btn danger"
        class:armed={confirmClear}
        onclick={armClear}
        disabled={normalized.laps.length === 0}
      >
        {confirmClear ? "Click again to confirm" : "Clear history"}
      </button>
    </div>
  </div>
</div>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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

  .row.stack {
    flex-direction: column;
    align-items: stretch;
    gap: 0.4rem;
    cursor: default;
  }

  .label {
    font-size: 0.875rem;
    color: rgb(226 232 240);
  }

  .label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .value {
    font-size: 0.75rem;
    color: rgb(148 163 184);
    font-variant-numeric: tabular-nums;
  }

  .hint {
    font-size: 0.7rem;
    color: rgb(148 163 184);
  }

  .hint code {
    background: rgb(15 23 42);
    padding: 0.05rem 0.3rem;
    border-radius: 0.25rem;
    color: rgb(203 213 225);
  }

  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    accent-color: rgb(59 130 246);
    cursor: pointer;
  }

  .text-input {
    width: 100%;
    padding: 0.4rem 0.6rem;
    border-radius: 0.375rem;
    background: rgb(2 6 23 / 0.6);
    border: 1px solid rgb(71 85 105);
    color: rgb(241 245 249);
    font-size: 0.85rem;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
  }

  .text-input:focus {
    outline: none;
    border-color: rgb(59 130 246);
  }

  .segmented {
    display: flex;
    gap: 0.25rem;
    padding: 0.2rem;
    background: rgb(2 6 23 / 0.6);
    border-radius: 0.375rem;
    border: 1px solid rgb(71 85 105);
  }

  .seg {
    flex: 1;
    padding: 0.35rem 0.5rem;
    border-radius: 0.25rem;
    background: transparent;
    border: none;
    color: rgb(203 213 225);
    font-size: 0.8rem;
    cursor: pointer;
  }

  .seg.selected {
    background: rgb(59 130 246 / 0.25);
    color: rgb(241 245 249);
  }

  .button-row {
    display: flex;
    gap: 0.4rem;
  }

  .btn {
    flex: 1;
    padding: 0.45rem 0.6rem;
    border-radius: 0.375rem;
    background: rgb(2 6 23 / 0.6);
    border: 1px solid rgb(71 85 105);
    color: rgb(226 232 240);
    font-size: 0.8rem;
    cursor: pointer;
  }

  .btn:hover:not(:disabled) {
    background: rgb(30 41 59 / 0.8);
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn.danger {
    border-color: rgb(248 113 113 / 0.6);
    color: rgb(252 165 165);
  }

  .btn.danger.armed {
    background: rgb(248 113 113 / 0.2);
    border-color: rgb(248 113 113);
    color: rgb(254 202 202);
  }
</style>
