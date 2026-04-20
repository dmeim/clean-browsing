<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import type { WidgetProps } from "$lib/widgets/types.js";
  import type { PingMonitorSettings, PingStatus } from "./definition.js";
  import { MAX_HISTORY, normalizeTarget, normalizeUptimeWindows } from "./definition.js";
  import {
    checkUrl,
    normalizeUrl,
    isValidPingInput,
    statusTransitioned,
    fireTransitionNotification,
    uptimePercent,
  } from "./ping.js";
  import PingIcon from "./PingIcon.svelte";
  import { uiStore } from "$lib/ui/uiStore.svelte.js";

  let { settings, updateSettings }: WidgetProps<PingMonitorSettings> = $props();

  let isLoading = $state(false);
  let hovered = $state(false);

  // Plain bookkeeping (not reactive). A reactive value here would re-trigger
  // the timer $effect on every mutation, which caused the v1 infinite-loop
  // bug.
  let prevStatus: PingStatus | null = null;
  let currentTimer: { id: ReturnType<typeof setInterval>; intervalMs: number } | null = null;

  const target = $derived(normalizeTarget(settings.target));

  async function runCheck(): Promise<void> {
    if (isLoading) return;
    const current = normalizeTarget(settings.target);
    if (!isValidPingInput(current.url)) return;

    isLoading = true;
    try {
      const sample = await checkUrl(
        normalizeUrl(current.url),
        current.timeoutMs,
        current.slowThresholdMs,
        current.method,
      );

      // Re-read after the async gap so we never overwrite user edits made
      // while the fetch was in flight.
      const fresh = normalizeTarget(settings.target);
      const nextHistory = [...fresh.history, sample].slice(-MAX_HISTORY);

      if (
        settings.notificationsOnTransition &&
        prevStatus &&
        prevStatus !== "unknown" &&
        statusTransitioned(prevStatus, sample.status)
      ) {
        fireTransitionNotification(fresh.label, fresh.url, prevStatus, sample.status);
      }
      prevStatus = sample.status;

      updateSettings({
        ...settings,
        target: { ...fresh, history: nextHistory },
      });
    } finally {
      isLoading = false;
    }
  }

  // Diff-based timer management. Re-runs on every settings change but only
  // touches the interval when the URL becomes (in)valid or intervalMs
  // changes. Plain mutable bookkeeping — never read reactively.
  $effect(() => {
    const t = normalizeTarget(settings.target);

    untrack(() => {
      if (prevStatus === null && t.history.length > 0) {
        prevStatus = t.history[t.history.length - 1].status;
      }
    });

    const desired = isValidPingInput(t.url) ? t.intervalMs : null;

    if (currentTimer && currentTimer.intervalMs !== desired) {
      clearInterval(currentTimer.id);
      currentTimer = null;
    }
    if (desired !== null && !currentTimer) {
      const id = setInterval(runCheck, desired);
      currentTimer = { id, intervalMs: desired };
      untrack(() => void runCheck());
    }
  });

  onDestroy(() => {
    if (currentTimer) {
      clearInterval(currentTimer.id);
      currentTimer = null;
    }
  });

  const HOUR_MS = 3_600_000;

  const uptimeWindows = $derived(
    [...normalizeUptimeWindows(settings.uptimeWindows)].sort((a, b) => a - b),
  );

  const uptimeReadings = $derived(
    uptimeWindows.map((hours) => ({
      hours,
      value: uptimePercent(target.history, hours * HOUR_MS),
    })),
  );

  function fmtUptime(v: number | null): string {
    return v != null ? `${v.toFixed(1)}%` : "N/A";
  }

  const lastSample = $derived(
    target.history.length > 0 ? target.history[target.history.length - 1] : null,
  );
  const status = $derived<PingStatus>(lastSample?.status ?? "unknown");
  const delayText = $derived(lastSample?.durationMs != null ? `${lastSample.durationMs} ms` : "--");

  const statusColor = $derived(
    status === "reachable"
      ? "var(--ui-success)"
      : status === "slow"
        ? "var(--ui-warning)"
        : status === "unreachable"
          ? "var(--ui-error)"
          : "var(--ui-muted-fg, rgb(148 163 184))",
  );

  const SPARKLINE_COUNT = 20;
  const SVG_W = 100;
  const SVG_H = 24;

  const sparklinePoints = $derived.by(() => {
    const samples = target.history.slice(-SPARKLINE_COUNT);
    if (samples.length < 2) return "";
    const durations = samples.map((s) => s.durationMs).filter((d): d is number => d != null);
    const maxD = Math.max(...durations, target.slowThresholdMs, 1);
    return samples
      .map((s, i) => {
        const x = (i / (samples.length - 1)) * SVG_W;
        const y = s.durationMs != null ? SVG_H - (s.durationMs / maxD) * (SVG_H - 2) - 1 : 1;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  });

  const padV = $derived(settings.paddingV ?? 8);
  const padH = $derived(settings.paddingH ?? 8);

  const hasUrl = $derived(isValidPingInput(target.url));
  const showRefresh = $derived(hovered && hasUrl && !uiStore.editMode);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="widget-card ping-monitor"
  onmouseenter={() => (hovered = true)}
  onmouseleave={() => (hovered = false)}
>
  <div
    class="widget-inner ping-inner"
    style="top: {padV}px; bottom: {padV}px; left: {padH}px; right: {padH}px;"
  >
    {#if !hasUrl}
      <div class="empty">
        <PingIcon name="wifi" size={28} class="empty-icon" />
        <span class="empty-text">Open settings to set a URL</span>
      </div>
    {:else}
      <div class="section section-top">
        <div class="status-row">
          <span class="dot" style="background: {statusColor};"></span>
          <span class="delay" style="color: {statusColor};">{delayText}</span>
        </div>
      </div>

      <div class="section section-graph">
        {#if sparklinePoints}
          <svg class="sparkline" viewBox="0 0 {SVG_W} {SVG_H}" preserveAspectRatio="none">
            <polyline
              points={sparklinePoints}
              fill="none"
              stroke={statusColor}
              stroke-width="1.5"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
          </svg>
        {:else}
          <div class="sparkline-placeholder"></div>
        {/if}
      </div>

      <div class="section section-bottom">
        <span class="label-text">{target.label || target.url}</span>
        <span class="uptime-row">
          {#each uptimeReadings as reading, i (reading.hours)}
            {#if i > 0}<span class="uptime-sep">·</span>{/if}
            <span class="uptime-cell">{reading.hours}h&nbsp;{fmtUptime(reading.value)}</span>
          {/each}
        </span>
      </div>

      <button
        type="button"
        class="refresh-btn"
        class:visible={showRefresh}
        disabled={isLoading}
        onclick={runCheck}
        title="Check now"
      >
        <PingIcon name="rotate-cw" size={14} class={isLoading ? "spin" : ""} />
      </button>
    {/if}
  </div>
</div>

<style>
  /*
   * The widget body is a CSS container, and every visible element sizes
   * itself in cqmin against that container. Same input → same output, so
   * .delay and .label-text use identical formulas and grow in lockstep.
   * Sections set vertical proportions via flex-basis; bottom is wider
   * (36%) than top (24%) because it stacks two lines.
   */
  .ping-inner {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    overflow: hidden;
    container-type: size;
    gap: clamp(0.1rem, 1.5cqmin, 0.6rem);
  }

  .section {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
    min-width: 0;
  }

  .section-top {
    flex: 0 0 22%;
  }
  .section-graph {
    flex: 1 1 auto;
    display: block;
    position: relative;
  }
  .section-bottom {
    flex: 0 0 32%;
    flex-direction: column;
    gap: clamp(0.1rem, 2cqmin, 0.6rem);
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    gap: clamp(0.2rem, 4cqmin, 0.75rem);
    color: rgb(148 163 184);
  }

  :global(.empty-icon) {
    opacity: 0.5;
    width: clamp(1rem, 18cqmin, 3rem);
    height: clamp(1rem, 18cqmin, 3rem);
  }

  .empty-text {
    font-size: clamp(0.55rem, 7cqmin, 1.25rem);
    text-align: center;
    line-height: 1.15;
    padding: 0 0.25rem;
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: clamp(0.2rem, 3cqmin, 1rem);
    max-width: 100%;
  }

  .dot {
    width: clamp(0.3rem, 4cqmin, 1.75rem);
    height: clamp(0.3rem, 4cqmin, 1.75rem);
    border-radius: 50%;
    flex-shrink: 0;
  }

  .delay {
    font-size: clamp(0.7rem, 11cqmin, 5rem);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    white-space: nowrap;
  }

  .sparkline,
  .sparkline-placeholder {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }

  .label-text {
    font-size: clamp(0.6rem, 11cqmin, 5rem);
    color: rgb(148 163 184);
    text-align: center;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    /* Line-height accommodates descenders ('g', 'p', 'y') so that the
       overflow:hidden box (needed for ellipsis) doesn't clip the bottoms
       of those glyphs. flex-shrink:0 keeps the line-box at its full
       1.3em height even when the section gets too tight to hold both
       lines + gap — without that, the column flex compresses the label
       and the bottom of the descender disappears under the clip. */
    line-height: 1.3;
    padding: 0 0.15rem;
    flex-shrink: 0;
  }

  .uptime-row {
    display: inline-flex;
    align-items: center;
    gap: clamp(0.15rem, 2cqmin, 0.85rem);
    font-size: clamp(0.5rem, 8cqmin, 3.5rem);
    color: rgb(130 145 168);
    font-variant-numeric: tabular-nums;
    line-height: 1.15;
    max-width: 100%;
    flex-shrink: 0;
  }

  .uptime-cell {
    white-space: nowrap;
  }

  .uptime-sep {
    opacity: 0.6;
  }

  .refresh-btn {
    position: absolute;
    top: clamp(0.05rem, 2cqmin, 0.5rem);
    right: clamp(0.05rem, 2cqmin, 0.5rem);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(0.08rem, 2cqmin, 0.5rem);
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(148 163 184 / 0.25);
    border-radius: 0.25rem;
    color: rgb(148 163 184);
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
  }

  .refresh-btn :global(svg) {
    width: clamp(0.55rem, 4cqmin, 1.6rem);
    height: clamp(0.55rem, 4cqmin, 1.6rem);
  }

  .refresh-btn.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .refresh-btn:hover {
    color: rgb(226 232 240);
    background: rgb(15 23 42 / 0.7);
  }

  .refresh-btn:disabled {
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
</style>
