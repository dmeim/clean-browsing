<script lang="ts">
  import type { WidgetSettingsTabProps } from "$lib/widgets/types.js";
  import type { PingMethod, PingMonitorSettings, PingTarget } from "../definition.js";
  import {
    normalizeTarget,
    DEFAULT_TARGET_INTERVAL_MS,
    DEFAULT_TARGET_TIMEOUT_MS,
    DEFAULT_TARGET_SLOW_MS,
    MIN_INTERVAL_MS,
    MIN_TIMEOUT_MS,
    MIN_SLOW_MS,
  } from "../definition.js";
  import { isValidPingInput } from "../ping.js";
  import PingIcon from "../PingIcon.svelte";
  import DurationInput from "$lib/ui/settings/DurationInput.svelte";

  let { settings, updateSettings }: WidgetSettingsTabProps<PingMonitorSettings> = $props();

  // Normalize once per render so the form always sees the full v2 shape,
  // even if the stored instance predates the per-target schema.
  const legacy = $derived(settings as unknown as Record<string, unknown>);
  const normalizedTargets = $derived(settings.targets.map((t) => normalizeTarget(t, legacy)));

  function persistTargets(next: PingTarget[]) {
    updateSettings({ ...settings, targets: next });
  }

  function updateTarget(id: string, patch: Partial<PingTarget>) {
    persistTargets(normalizedTargets.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function addTarget() {
    const t: PingTarget = {
      id: crypto.randomUUID(),
      label: "",
      url: "",
      method: "GET",
      intervalMs: DEFAULT_TARGET_INTERVAL_MS,
      timeoutMs: DEFAULT_TARGET_TIMEOUT_MS,
      slowThresholdMs: DEFAULT_TARGET_SLOW_MS,
      history: [],
    };
    persistTargets([...normalizedTargets, t]);
  }

  function removeTarget(id: string) {
    persistTargets(normalizedTargets.filter((t) => t.id !== id));
  }
</script>

<div class="tab-body">
  <p class="notice">
    Enter a URL with scheme (<code>https://1.1.1.1</code>) or just a hostname/IP — HTTPS is assumed
    if no scheme is given. Each target runs on its own schedule.
  </p>

  {#each normalizedTargets as target (target.id)}
    <article class="target-card">
      <header class="target-head">
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
        <button
          type="button"
          class="icon-btn"
          title="Remove target"
          onclick={() => removeTarget(target.id)}
        >
          <PingIcon name="x" size={14} />
        </button>
      </header>

      <div class="field">
        <span class="field-label">Address</span>
        <div class="address-row">
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
            value={target.method}
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

      <div class="duration-grid">
        <div class="field">
          <span class="field-label">Check every</span>
          <DurationInput
            valueMs={target.intervalMs}
            minMs={MIN_INTERVAL_MS}
            onChange={(ms) => updateTarget(target.id, { intervalMs: ms })}
            placeholder="5m"
          />
        </div>
        <div class="field">
          <span class="field-label">Timeout</span>
          <DurationInput
            valueMs={target.timeoutMs}
            minMs={MIN_TIMEOUT_MS}
            onChange={(ms) => updateTarget(target.id, { timeoutMs: ms })}
            placeholder="5s"
          />
        </div>
        <div class="field">
          <span class="field-label">Slow threshold</span>
          <DurationInput
            valueMs={target.slowThresholdMs}
            minMs={MIN_SLOW_MS}
            onChange={(ms) => updateTarget(target.id, { slowThresholdMs: ms })}
            placeholder="1500ms"
          />
        </div>
      </div>
    </article>
  {/each}

  <button type="button" class="btn ghost add-btn" onclick={addTarget}>
    <PingIcon name="plus" size={14} />
    Add target
  </button>
</div>

<style>
  .tab-body {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .notice {
    margin: 0;
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

  .target-card {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.75rem;
    background: rgb(15 23 42 / 0.35);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.5rem;
  }

  .target-head {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .label-input {
    flex: 1;
    font-size: 0.9rem;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: transparent;
    border: 1px solid transparent;
    color: rgb(148 163 184);
    border-radius: 0.375rem;
    cursor: pointer;
    flex-shrink: 0;
  }

  .icon-btn:hover {
    color: rgb(248 113 113);
    border-color: rgb(248 113 113 / 0.4);
    background: rgb(248 113 113 / 0.1);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .field-label {
    font-size: 0.7rem;
    color: rgb(148 163 184);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
  }

  .address-row {
    display: flex;
    gap: 0.35rem;
  }

  .text-input,
  .select {
    padding: 0.45rem 0.65rem;
    border-radius: 0.375rem;
    background: rgb(2 6 23 / 0.6);
    border: 1px solid rgb(71 85 105);
    color: rgb(241 245 249);
    font-size: 0.85rem;
    width: 100%;
  }

  .text-input:focus,
  .select:focus {
    outline: none;
    border-color: rgb(59 130 246);
    box-shadow: 0 0 0 2px rgb(59 130 246 / 0.25);
  }

  .url-input {
    flex: 1;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.8rem;
  }

  .url-input.invalid {
    border-color: rgb(248 113 113);
  }

  .method-select {
    width: auto;
    flex-shrink: 0;
    padding: 0.45rem 0.5rem;
    font-size: 0.78rem;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
  }

  .duration-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.6rem;
  }

  @media (max-width: 520px) {
    .duration-grid {
      grid-template-columns: 1fr;
    }
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.5rem 0.85rem;
    border-radius: 0.5rem;
    border: 1px solid transparent;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    align-self: flex-start;
  }

  .btn.ghost {
    background: transparent;
    border-color: rgb(71 85 105);
    color: rgb(226 232 240);
  }

  .btn.ghost:hover {
    border-color: rgb(100 116 139);
    background: rgb(51 65 85 / 0.2);
  }
</style>
