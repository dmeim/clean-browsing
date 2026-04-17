<script lang="ts">
  import type { WidgetSettingsProps } from "$lib/widgets/types.js";
  import type { PingMonitorSettings, PingTarget, PingMethod } from "./definition.js";
  import { isValidPingInput } from "./ping.js";
  import PingIcon from "./PingIcon.svelte";

  let { settings, updateSettings }: WidgetSettingsProps<PingMonitorSettings> = $props();

  const normalized = $derived<PingMonitorSettings>({
    targets: settings.targets ?? [],
    intervalSec: settings.intervalSec ?? 300,
    timeoutMs: settings.timeoutMs ?? 5000,
    slowThresholdMs: settings.slowThresholdMs ?? 1500,
    notificationsOnTransition: settings.notificationsOnTransition ?? false,
    paddingV: settings.paddingV ?? 8,
    paddingH: settings.paddingH ?? 8,
  });

  function set<K extends keyof PingMonitorSettings>(key: K, value: PingMonitorSettings[K]) {
    updateSettings({ ...normalized, [key]: value });
  }

  function updateTarget(id: string, patch: Partial<PingTarget>) {
    const next = normalized.targets.map((t) => (t.id === id ? { ...t, ...patch } : t));
    set("targets", next);
  }

  function addTarget() {
    const t: PingTarget = {
      id: crypto.randomUUID(),
      label: "",
      url: "",
      method: "GET",
      history: [],
    };
    set("targets", [...normalized.targets, t]);
  }

  function removeTarget(id: string) {
    set(
      "targets",
      normalized.targets.filter((t) => t.id !== id),
    );
  }

  function clearAllHistory() {
    const cleared = normalized.targets.map((t) => ({ ...t, history: [] }));
    set("targets", cleared);
  }
</script>

<div class="form">
  <div class="notice">
    <strong>Network notice.</strong> This widget sends HTTP requests to the URLs you configure, on a recurring
    interval. Nothing is sent anywhere else. No requests fire until you add a target below.
  </div>

  <div class="section">
    <span class="section-label">Targets</span>

    {#each normalized.targets as target (target.id)}
      <div class="target-row">
        <div class="target-fields">
          <input
            type="text"
            class="text-input label-input"
            placeholder="Label (e.g. Google DNS)"
            value={target.label}
            oninput={(e) =>
              updateTarget(target.id, {
                label: (e.currentTarget as HTMLInputElement).value,
              })}
          />
          <div class="url-row">
            <input
              type="text"
              class="text-input url-input"
              placeholder="1.1.1.1 or https://example.com"
              value={target.url}
              class:invalid={target.url !== "" && !isValidPingInput(target.url)}
              oninput={(e) =>
                updateTarget(target.id, {
                  url: (e.currentTarget as HTMLInputElement).value,
                })}
            />
            <select
              class="select method-select"
              value={target.method ?? "GET"}
              onchange={(e) =>
                updateTarget(target.id, {
                  method: (e.currentTarget as HTMLSelectElement).value as PingMethod,
                })}
            >
              <option value="GET">GET</option>
              <option value="HEAD">HEAD</option>
              <option value="POST">POST</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          class="icon-btn remove-btn"
          title="Remove target"
          onclick={() => removeTarget(target.id)}
        >
          <PingIcon name="x" size={14} />
        </button>
      </div>
    {/each}

    <button type="button" class="btn ghost add-btn" onclick={addTarget}>
      <PingIcon name="plus" size={14} />
      Add target
    </button>
    <p class="hint">
      Enter a URL with scheme (<code>https://1.1.1.1</code>) or just a hostname/IP — HTTPS is
      assumed if no scheme is given.
    </p>
  </div>

  <div class="section">
    <label for="ping-interval" class="section-label">Check interval</label>
    <select
      id="ping-interval"
      class="select"
      value={String(normalized.intervalSec)}
      onchange={(e) =>
        set(
          "intervalSec",
          Number(
            (e.currentTarget as HTMLSelectElement).value,
          ) as PingMonitorSettings["intervalSec"],
        )}
    >
      <option value="30">Every 30 seconds</option>
      <option value="60">Every minute</option>
      <option value="300">Every 5 minutes</option>
      <option value="900">Every 15 minutes</option>
      <option value="1800">Every 30 minutes</option>
      <option value="3600">Every hour</option>
    </select>
    {#if normalized.intervalSec <= 60}
      <p class="hint warning">Short intervals put more load on the target.</p>
    {/if}
  </div>

  <div class="section">
    <div class="label-row">
      <span class="section-label inline">Timeout</span>
      <span class="value">{(normalized.timeoutMs / 1000).toFixed(1)} s</span>
    </div>
    <input
      type="range"
      min="1000"
      max="30000"
      step="500"
      value={normalized.timeoutMs}
      oninput={(e) => set("timeoutMs", Number((e.currentTarget as HTMLInputElement).value))}
    />
  </div>

  <div class="section">
    <div class="label-row">
      <span class="section-label inline">Slow threshold</span>
      <span class="value">{normalized.slowThresholdMs} ms</span>
    </div>
    <input
      type="range"
      min="100"
      max="5000"
      step="100"
      value={normalized.slowThresholdMs}
      oninput={(e) => set("slowThresholdMs", Number((e.currentTarget as HTMLInputElement).value))}
    />
    <p class="hint">Round trips above this threshold are marked as slow.</p>
  </div>

  <label class="row">
    <span class="row-label">Notify on status changes</span>
    <input
      type="checkbox"
      checked={normalized.notificationsOnTransition}
      onchange={(e) =>
        set("notificationsOnTransition", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>
  {#if normalized.notificationsOnTransition}
    <p class="hint">
      Fires when a target becomes unreachable or recovers. Only works while the new-tab page is
      open.
    </p>
  {/if}

  {#if normalized.targets.some((t) => t.history.length > 0)}
    <button type="button" class="btn danger" onclick={clearAllHistory}>
      <PingIcon name="trash-2" size={14} />
      Clear all history
    </button>
  {/if}

  <div class="section">
    <div class="label-row">
      <span class="section-label inline">Vertical padding</span>
      <span class="value">{normalized.paddingV}px</span>
    </div>
    <input
      type="range"
      min="0"
      max="80"
      step="1"
      value={normalized.paddingV}
      oninput={(e) => set("paddingV", Number((e.currentTarget as HTMLInputElement).value))}
    />
  </div>

  <div class="section">
    <div class="label-row">
      <span class="section-label inline">Horizontal padding</span>
      <span class="value">{normalized.paddingH}px</span>
    </div>
    <input
      type="range"
      min="0"
      max="80"
      step="1"
      value={normalized.paddingH}
      oninput={(e) => set("paddingH", Number((e.currentTarget as HTMLInputElement).value))}
    />
  </div>
</div>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
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

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .section-label {
    font-size: 0.8rem;
    color: rgb(148 163 184);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
  }

  .section-label.inline {
    text-transform: none;
    letter-spacing: normal;
    font-weight: normal;
    font-size: 0.875rem;
    color: rgb(226 232 240);
  }

  .target-row {
    display: flex;
    align-items: flex-start;
    gap: 0.35rem;
  }

  .target-fields {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .url-row {
    display: flex;
    gap: 0.25rem;
  }

  .text-input,
  .select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: rgb(2 6 23 / 0.7);
    border: 1px solid rgb(71 85 105);
    color: rgb(241 245 249);
    font-size: 0.9rem;
  }

  .text-input:focus,
  .select:focus {
    outline: none;
    border-color: rgb(59 130 246);
    box-shadow: 0 0 0 2px rgb(59 130 246 / 0.25);
  }

  .label-input {
    font-size: 0.85rem;
  }

  .url-input {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.82rem;
    flex: 1;
  }

  .url-input.invalid {
    border-color: rgb(248 113 113);
  }

  .method-select {
    width: auto;
    flex-shrink: 0;
    padding: 0.5rem 0.5rem;
    font-size: 0.78rem;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid transparent;
    color: rgb(148 163 184);
    cursor: pointer;
    padding: 0.4rem;
    border-radius: 0.375rem;
    flex-shrink: 0;
    margin-top: 0.35rem;
  }

  .icon-btn:hover {
    color: rgb(248 113 113);
    border-color: rgb(248 113 113 / 0.4);
    background: rgb(248 113 113 / 0.1);
  }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.5rem 0.85rem;
    border-radius: 0.5rem;
    background: rgb(59 130 246);
    color: white;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .btn.ghost {
    background: transparent;
    border: 1px solid rgb(71 85 105);
    color: rgb(226 232 240);
  }

  .btn.ghost:hover {
    border-color: rgb(100 116 139);
  }

  .btn.danger {
    background: transparent;
    border: 1px solid rgb(248 113 113 / 0.5);
    color: rgb(248 113 113);
  }

  .btn.danger:hover {
    background: rgb(248 113 113 / 0.1);
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

  .label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .value {
    font-size: 0.75rem;
    color: rgb(203 213 225);
    font-variant-numeric: tabular-nums;
  }

  input[type="range"] {
    width: 100%;
    accent-color: rgb(59 130 246);
    cursor: pointer;
  }

  .hint {
    font-size: 0.7rem;
    color: rgb(148 163 184);
    margin: 0.1rem 0 0;
  }

  .hint.warning {
    color: rgb(251 191 36);
  }
</style>
