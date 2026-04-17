<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import type { WidgetProps } from "$lib/widgets/types.js";
  import type { PingMonitorSettings, PingStatus } from "./definition.js";
  import { MAX_HISTORY } from "./definition.js";
  import {
    checkUrl,
    normalizeUrl,
    isValidPingInput,
    statusTransitioned,
    fireTransitionNotification,
    uptimePercent,
  } from "./ping.js";
  import PingIcon from "./PingIcon.svelte";
  import PingTargetCard from "./PingTargetCard.svelte";

  let { settings, updateSettings }: WidgetProps<PingMonitorSettings> = $props();

  let loading = $state(false);

  const prevStatuses: Record<string, PingStatus> = {};

  async function runChecks() {
    if (loading) return;
    const valid = settings.targets.filter((t) => isValidPingInput(t.url));
    if (valid.length === 0) return;
    loading = true;
    try {
      const results = await Promise.all(
        valid.map((t) =>
          checkUrl(normalizeUrl(t.url), settings.timeoutMs, settings.slowThresholdMs, t.method),
        ),
      );

      // Re-read targets AFTER the async gap so we never overwrite
      // user edits (label/URL) made while fetches were in flight.
      const fresh = settings.targets;
      const updatedTargets = fresh.map((t) => {
        const idx = valid.findIndex((v) => v.id === t.id);
        if (idx === -1) return t;

        const sample = results[idx];
        const nextHistory = [...t.history, sample].slice(-MAX_HISTORY);

        const prev = prevStatuses[t.id] ?? "unknown";
        if (
          settings.notificationsOnTransition &&
          prev !== "unknown" &&
          statusTransitioned(prev, sample.status)
        ) {
          fireTransitionNotification(t.label, t.url, prev, sample.status);
        }
        prevStatuses[t.id] = sample.status;

        return { ...t, history: nextHistory };
      });

      updateSettings({ ...settings, targets: updatedTargets });
    } finally {
      loading = false;
    }
  }

  // Timer is managed with plain variables — never recreated unless the
  // user actually changes intervalSec. runChecks() is NEVER called from
  // this effect; it only fires from the timer ticks and the manual
  // "Check now" button.
  //
  // Why this matters: every updateSettings() call replaces the settings
  // prop reference, which causes $effect to re-run even though
  // intervalSec is unchanged. If we called runChecks() here, each check
  // would schedule the next one instantly. The value-equality guard
  // (`interval === currentInterval`) turns the re-run into a no-op.
  let timerId: ReturnType<typeof setInterval> | null = null;
  let currentInterval = 0;
  let seeded = false;

  $effect(() => {
    const interval = settings.intervalSec;

    // One-time seed of prevStatuses from persisted history so we don't
    // fire spurious transition notifications on first check.
    if (!seeded) {
      seeded = true;
      untrack(() => {
        for (const t of settings.targets) {
          if (t.history.length > 0) {
            prevStatuses[t.id] = t.history[t.history.length - 1].status;
          }
        }
      });
    }

    // Only (re)create the timer when intervalSec actually changes by value.
    if (interval === currentInterval) return;

    if (timerId !== null) clearInterval(timerId);
    currentInterval = interval;
    timerId = setInterval(runChecks, interval * 1000);
  });

  onDestroy(() => {
    if (timerId !== null) clearInterval(timerId);
  });

  const HOUR_MS = 3_600_000;
  const DAY_MS = 86_400_000;

  const allHistory = $derived(settings.targets.flatMap((t) => t.history));
  const uptime1h = $derived(uptimePercent(allHistory, HOUR_MS));
  const uptime24h = $derived(uptimePercent(allHistory, DAY_MS));

  function fmtUptime(v: number | null): string {
    return v != null ? `${v.toFixed(1)}%` : "N/A";
  }

  const padV = $derived(settings.paddingV ?? 8);
  const padH = $derived(settings.paddingH ?? 8);
</script>

<div class="widget-card ping-monitor">
  <div
    class="widget-inner ping-inner"
    style="top: {padV}px; bottom: {padV}px; left: {padH}px; right: {padH}px;"
  >
    {#if settings.targets.length === 0}
      <div class="empty">
        <PingIcon name="wifi" size={28} class="empty-icon" />
        <span class="empty-text">Open settings to add targets</span>
      </div>
    {:else}
      <div class="header">
        <span class="title">Ping Monitor</span>
        <button
          type="button"
          class="refresh-btn"
          onclick={() => runChecks()}
          disabled={loading}
          title="Check now"
        >
          <PingIcon name="rotate-cw" size={14} class={loading ? "spin" : ""} />
        </button>
      </div>

      <div class="cards">
        {#each settings.targets as target (target.id)}
          <PingTargetCard {target} slowThresholdMs={settings.slowThresholdMs} />
        {/each}
      </div>

      <div class="stats">
        <span class="stat">1h: {fmtUptime(uptime1h)}</span>
        <span class="stat">24h: {fmtUptime(uptime24h)}</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .ping-inner {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    overflow: hidden;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 0.5rem;
    color: rgb(148 163 184);
  }

  :global(.empty-icon) {
    opacity: 0.5;
  }

  .empty-text {
    font-size: 0.8rem;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .title {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgb(148 163 184);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .refresh-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: rgb(148 163 184);
    cursor: pointer;
    padding: 0.15rem;
    border-radius: 0.25rem;
  }

  .refresh-btn:hover {
    color: rgb(226 232 240);
  }

  .refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  :global(.spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .cards {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    flex: 1 1 auto;
    align-content: flex-start;
    overflow-y: auto;
  }

  .stats {
    display: flex;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .stat {
    font-size: 0.7rem;
    color: rgb(148 163 184);
    font-variant-numeric: tabular-nums;
  }
</style>
