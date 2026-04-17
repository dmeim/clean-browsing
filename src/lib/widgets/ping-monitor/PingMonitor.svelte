<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import type { WidgetProps } from "$lib/widgets/types.js";
  import type { PingMonitorSettings, PingStatus, PingTarget } from "./definition.js";
  import { MAX_HISTORY, normalizeTarget } from "./definition.js";
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

  // UI-facing flag: true while any target's check is in flight.
  let anyLoading = $state(false);

  // Plain bookkeeping (not reactive): prevents spurious transition
  // notifications on mount and serializes per-target fetches. A reactive
  // SvelteSet would re-trigger the timer $effect on every mutation,
  // which caused the v1 infinite-loop bug.
  const prevStatuses: Record<string, PingStatus> = {};
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const loadingTargets = new Set<string>();

  // Per-target timer bookkeeping, entirely plain (not reactive).
  // Maps targetId → { id: intervalId, intervalMs }. The $effect below
  // diffs desired vs actual state; timers are only touched when targets
  // are added, removed, or have their intervalMs edited. A SvelteMap
  // here would make every .set() invalidate the effect, looping forever.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const timers = new Map<string, { id: ReturnType<typeof setInterval>; intervalMs: number }>();

  /**
   * Normalize the stored targets (handles legacy schema migration) and
   * return the current read view. We don't persist normalization back
   * eagerly — that happens the next time the user edits settings or a
   * check persists history.
   */
  function readTargets(): PingTarget[] {
    const legacy = settings as unknown as Record<string, unknown>;
    return settings.targets.map((t) => normalizeTarget(t, legacy));
  }

  async function runCheckForTarget(targetId: string): Promise<void> {
    if (loadingTargets.has(targetId)) return;
    const targets = readTargets();
    const target = targets.find((t) => t.id === targetId);
    if (!target || !isValidPingInput(target.url)) return;

    loadingTargets.add(targetId);
    anyLoading = true;
    try {
      const sample = await checkUrl(
        normalizeUrl(target.url),
        target.timeoutMs,
        target.slowThresholdMs,
        target.method,
      );

      // Re-read after the async gap so we never overwrite user edits
      // made while the fetch was in flight.
      const fresh = readTargets().find((t) => t.id === targetId);
      if (!fresh) return; // target was removed while in flight

      const nextHistory = [...fresh.history, sample].slice(-MAX_HISTORY);

      const prev = prevStatuses[targetId] ?? "unknown";
      if (
        settings.notificationsOnTransition &&
        prev !== "unknown" &&
        statusTransitioned(prev, sample.status)
      ) {
        fireTransitionNotification(fresh.label, fresh.url, prev, sample.status);
      }
      prevStatuses[targetId] = sample.status;

      const updatedTargets = readTargets().map((t) =>
        t.id === targetId ? { ...t, history: nextHistory } : t,
      );
      updateSettings({ ...settings, targets: updatedTargets });
    } finally {
      loadingTargets.delete(targetId);
      anyLoading = loadingTargets.size > 0;
    }
  }

  function checkAll() {
    for (const t of readTargets()) {
      if (isValidPingInput(t.url)) runCheckForTarget(t.id);
    }
  }

  // Diff-based timer management. This effect re-runs on every settings
  // change (same reason every prop update triggers a re-run), but the
  // diff ensures we only touch timers when a target's intervalMs truly
  // changes, or a target is added/removed. Everything else is a no-op.
  $effect(() => {
    const targets = readTargets();

    // Seed prevStatuses on first encounter of each target so we don't
    // fire a spurious transition notification for the first check.
    untrack(() => {
      for (const t of targets) {
        if (!(t.id in prevStatuses) && t.history.length > 0) {
          prevStatuses[t.id] = t.history[t.history.length - 1].status;
        }
      }
    });

    // Desired state: which targets should have timers, and at what interval.
    // Plain Map — purely local bookkeeping, never read reactively.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const desired = new Map<string, number>();
    for (const t of targets) {
      if (isValidPingInput(t.url)) desired.set(t.id, t.intervalMs);
    }

    // Remove stale or mis-intervaled timers.
    for (const [id, { id: timerId, intervalMs }] of timers) {
      if (desired.get(id) !== intervalMs) {
        clearInterval(timerId);
        timers.delete(id);
      }
    }

    // Add missing timers.
    for (const [id, intervalMs] of desired) {
      if (!timers.has(id)) {
        const timerId = setInterval(() => runCheckForTarget(id), intervalMs);
        timers.set(id, { id: timerId, intervalMs });
      }
    }
  });

  onDestroy(() => {
    for (const { id } of timers.values()) clearInterval(id);
    timers.clear();
  });

  const HOUR_MS = 3_600_000;
  const DAY_MS = 86_400_000;

  const allHistory = $derived(settings.targets.flatMap((t) => t.history ?? []));
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
          onclick={checkAll}
          disabled={anyLoading}
          title="Check now"
        >
          <PingIcon name="rotate-cw" size={14} class={anyLoading ? "spin" : ""} />
        </button>
      </div>

      <div class="cards">
        {#each settings.targets as target (target.id)}
          {@const normalized = (() => {
            const legacy = settings as unknown as Record<string, unknown>;
            return normalizeTarget(target, legacy);
          })()}
          <PingTargetCard target={normalized} slowThresholdMs={normalized.slowThresholdMs} />
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
