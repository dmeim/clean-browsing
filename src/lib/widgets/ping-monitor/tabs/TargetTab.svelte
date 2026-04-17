<script lang="ts">
  import type { WidgetSettingsTabProps } from "$lib/widgets/types.js";
  import type { PingMethod, PingMonitorSettings, PingTarget } from "../definition.js";
  import { normalizeTarget, MIN_INTERVAL_MS, MIN_TIMEOUT_MS, MIN_SLOW_MS } from "../definition.js";
  import { isValidPingInput } from "../ping.js";
  import DurationInput from "$lib/ui/settings/DurationInput.svelte";

  let { settings, updateSettings }: WidgetSettingsTabProps<PingMonitorSettings> = $props();

  const target = $derived(normalizeTarget(settings.target));

  function updateTarget(patch: Partial<PingTarget>) {
    updateSettings({ ...settings, target: { ...target, ...patch } });
  }
</script>

<div class="tab-body">
  <p class="notice">
    Enter a URL with scheme (<code>https://1.1.1.1</code>) or just a hostname/IP — HTTPS is assumed
    if no scheme is given.
  </p>

  <article class="target-card">
    <div class="field">
      <span class="field-label">Label</span>
      <input
        type="text"
        class="text-input"
        placeholder="e.g. Google DNS"
        value={target.label}
        oninput={(e) => updateTarget({ label: (e.currentTarget as HTMLInputElement).value })}
      />
    </div>

    <div class="field">
      <span class="field-label">Address</span>
      <div class="address-row">
        <input
          type="text"
          class="text-input url-input"
          placeholder="1.1.1.1 or https://example.com"
          value={target.url}
          class:invalid={target.url !== "" && !isValidPingInput(target.url)}
          oninput={(e) => updateTarget({ url: (e.currentTarget as HTMLInputElement).value })}
        />
        <select
          class="select method-select"
          value={target.method}
          onchange={(e) =>
            updateTarget({
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
          onChange={(ms) => updateTarget({ intervalMs: ms })}
          placeholder="5m"
        />
      </div>
      <div class="field">
        <span class="field-label">Timeout</span>
        <DurationInput
          valueMs={target.timeoutMs}
          minMs={MIN_TIMEOUT_MS}
          onChange={(ms) => updateTarget({ timeoutMs: ms })}
          placeholder="5s"
        />
      </div>
      <div class="field">
        <span class="field-label">Slow threshold</span>
        <DurationInput
          valueMs={target.slowThresholdMs}
          minMs={MIN_SLOW_MS}
          onChange={(ms) => updateTarget({ slowThresholdMs: ms })}
          placeholder="1500ms"
        />
      </div>
    </div>
  </article>
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
</style>
