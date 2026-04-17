<script lang="ts">
  import type { WidgetSettingsTabProps } from "$lib/widgets/types.js";
  import type { PingMonitorSettings } from "../definition.js";
  import { normalizeTarget, normalizeUptimeWindows, UPTIME_WINDOW_OPTIONS } from "../definition.js";
  import PingIcon from "../PingIcon.svelte";

  let { settings, updateSettings }: WidgetSettingsTabProps<PingMonitorSettings> = $props();

  const target = $derived(normalizeTarget(settings.target));
  const hasHistory = $derived(target.history.length > 0);

  // Stored in selection order — the first entry is the "oldest" pick and
  // is the one we drop when the user activates a new option.
  const windows = $derived(normalizeUptimeWindows(settings.uptimeWindows));

  function toggleWindow(hours: number) {
    if (windows.includes(hours)) return; // can't deselect — must keep two
    const next = [...windows.slice(1), hours];
    updateSettings({ ...settings, uptimeWindows: next });
  }

  function clearHistory() {
    updateSettings({ ...settings, target: { ...target, history: [] } });
  }
</script>

<div class="tab-body">
  <section class="group">
    <h3 class="group-title">Network notice</h3>
    <p class="notice">
      This widget sends an HTTP request to the configured target on the interval you set in the
      Target tab. Nothing is sent anywhere else.
    </p>
  </section>

  <section class="group">
    <h3 class="group-title">Uptime windows</h3>
    <p class="hint window-hint">
      Pick which two rolling-uptime windows show up under the graph. Tap an inactive option to swap
      it in for the older of the two active ones.
    </p>
    <div class="window-grid">
      {#each UPTIME_WINDOW_OPTIONS as opt (opt)}
        {@const isActive = windows.includes(opt)}
        <button
          type="button"
          class="window-pill"
          class:active={isActive}
          aria-pressed={isActive}
          onclick={() => toggleWindow(opt)}
        >
          {opt}h
        </button>
      {/each}
    </div>
  </section>

  <section class="group">
    <h3 class="group-title">Notifications</h3>
    <label class="row">
      <span class="row-label">Notify on status changes</span>
      <input
        type="checkbox"
        checked={settings.notificationsOnTransition ?? false}
        onchange={(e) =>
          updateSettings({
            ...settings,
            notificationsOnTransition: (e.currentTarget as HTMLInputElement).checked,
          })}
      />
    </label>
    <p class="hint">
      Fires once when the target transitions between reachable and unreachable. Only works while the
      new-tab page is open.
    </p>
  </section>

  {#if hasHistory}
    <section class="group">
      <h3 class="group-title">Data</h3>
      <button type="button" class="btn danger" onclick={clearHistory}>
        <PingIcon name="trash-2" size={14} />
        Clear history
      </button>
      <p class="hint">Resets the response-time history and uptime stats for this target.</p>
    </section>
  {/if}
</div>

<style>
  .tab-body {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .group-title {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ui-muted-fg);
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

  .hint {
    margin: 0.25rem 0 0;
    font-size: 0.7rem;
    color: rgb(148 163 184);
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

  .btn.danger {
    background: transparent;
    border-color: rgb(248 113 113 / 0.5);
    color: rgb(248 113 113);
  }

  .btn.danger:hover {
    background: rgb(248 113 113 / 0.1);
  }

  .window-hint {
    margin: 0;
  }

  .window-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.4rem;
  }

  @media (max-width: 380px) {
    .window-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .window-pill {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 0.4rem;
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.4rem;
    color: rgb(148 163 184);
    font-size: 0.85rem;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    transition:
      background 0.12s ease,
      border-color 0.12s ease,
      color 0.12s ease;
  }

  .window-pill:hover {
    border-color: rgb(100 116 139);
    color: rgb(226 232 240);
  }

  .window-pill.active {
    background: rgb(59 130 246 / 0.18);
    border-color: rgb(59 130 246);
    color: rgb(241 245 249);
    cursor: default;
  }

  .window-pill.active:hover {
    border-color: rgb(59 130 246);
    color: rgb(241 245 249);
  }
</style>
