<script lang="ts">
  import type { WidgetSettingsTabProps } from "$lib/widgets/types.js";
  import type { PingMonitorSettings } from "../definition.js";
  import { normalizeTarget } from "../definition.js";
  import PingIcon from "../PingIcon.svelte";

  let { settings, updateSettings }: WidgetSettingsTabProps<PingMonitorSettings> = $props();

  const hasHistory = $derived(
    settings.targets.some((t) => Array.isArray(t.history) && t.history.length > 0),
  );

  function clearAllHistory() {
    const legacy = settings as unknown as Record<string, unknown>;
    const cleared = settings.targets.map((t) => ({
      ...normalizeTarget(t, legacy),
      history: [],
    }));
    updateSettings({ ...settings, targets: cleared });
  }
</script>

<div class="tab-body">
  <section class="group">
    <h3 class="group-title">Network notice</h3>
    <p class="notice">
      This widget sends HTTP requests to each configured target on the per-target interval you set
      in the Targets tab. Nothing is sent anywhere else.
    </p>
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
      Fires once per target when it transitions between reachable and unreachable. Only works while
      the new-tab page is open.
    </p>
  </section>

  {#if hasHistory}
    <section class="group">
      <h3 class="group-title">Data</h3>
      <button type="button" class="btn danger" onclick={clearAllHistory}>
        <PingIcon name="trash-2" size={14} />
        Clear all history
      </button>
      <p class="hint">Resets every target's response-time history and uptime stats.</p>
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
</style>
