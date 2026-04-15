<script lang="ts">
  import type { WidgetProps } from "$lib/widgets/types.js";
  import type { StopwatchSettings, StopwatchLap } from "./definition.js";
  import { MAX_LAPS } from "./definition.js";
  import { formatElapsed } from "$lib/widgets/_shared/time.js";
  import { playClick } from "./clickSound.js";
  import Icon from "$lib/widgets/_shared/Icon.svelte";

  let { settings, updateSettings }: WidgetProps<StopwatchSettings> = $props();

  // Normalized view over settings. Older instances created before the
  // stopwatch widget shipped won't have runtime fields, so fall back.
  const runState = $derived(settings.runState ?? "idle");
  const startedAtEpoch = $derived(settings.startedAtEpoch ?? 0);
  const elapsedBeforeResume = $derived(settings.elapsedBeforeResume ?? 0);
  const precision = $derived(settings.precision ?? "cs");
  const showSplits = $derived(settings.showSplits ?? true);
  const maxLapsShown = $derived(settings.maxLapsShown ?? 10);
  const laps = $derived(settings.laps ?? []);
  const padV = $derived(settings.paddingV ?? 8);
  const padH = $derived(settings.paddingH ?? 8);

  // RAF-driven repaint trigger. Only bumps while the stopwatch is running,
  // so a paused/idle stopwatch costs zero frames.
  let tick = $state(0);
  let rafId = 0;

  $effect(() => {
    if (runState !== "running") {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      return;
    }
    const loop = () => {
      tick++;
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    };
  });

  // Authoritative elapsed calculation. `tick` is read so the $derived
  // re-evaluates every animation frame while running; the math itself is
  // stateless and based purely on Date.now() and stored fields.
  const elapsedMs = $derived.by(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    tick;
    if (runState === "running") {
      // Guard against system clock going backwards.
      const delta = Math.max(0, Date.now() - startedAtEpoch);
      return elapsedBeforeResume + delta;
    }
    return elapsedBeforeResume;
  });

  const display = $derived(formatElapsed(elapsedMs, precision));

  function writeState(patch: Partial<StopwatchSettings>) {
    updateSettings({ ...settings, ...patch });
  }

  function handlePrimary() {
    if (runState === "running") {
      // Pause — fold the current segment into elapsedBeforeResume.
      const delta = Math.max(0, Date.now() - startedAtEpoch);
      writeState({
        runState: "paused",
        startedAtEpoch: 0,
        elapsedBeforeResume: elapsedBeforeResume + delta,
      });
    } else {
      // Start from idle or resume from paused. Both transitions just mark
      // a new segment start — elapsedBeforeResume is already correct.
      writeState({
        runState: "running",
        startedAtEpoch: Date.now(),
      });
    }
  }

  function handleLap() {
    if (runState !== "running") return;
    if (settings.soundFeedback) playClick();

    const delta = Math.max(0, Date.now() - startedAtEpoch);
    const totalMs = elapsedBeforeResume + delta;
    const prevTotal = laps.length > 0 ? laps[0].totalMs : 0;
    const splitMs = Math.max(0, totalMs - prevTotal);

    const next: StopwatchLap = {
      index: laps.length + 1,
      splitMs,
      totalMs,
      recordedAt: Date.now(),
    };
    // Newest-first ordering keeps the scrollable list anchored at the
    // latest lap without needing to scroll the container.
    const trimmed = [next, ...laps].slice(0, MAX_LAPS);
    writeState({ laps: trimmed });
  }

  function handleReset() {
    // Zeroes the elapsed time but leaves the lap history intact — lap
    // history is cleared separately from the settings dialog.
    writeState({
      runState: "idle",
      startedAtEpoch: 0,
      elapsedBeforeResume: 0,
    });
  }

  const visibleLaps = $derived(maxLapsShown > 0 ? laps.slice(0, maxLapsShown) : laps);
</script>

<div class="widget-card stopwatch">
  <div
    class="widget-inner stopwatch-inner"
    style="top: {padV}px; bottom: {padV}px; left: {padH}px; right: {padH}px;"
  >
    <div class="display" aria-live="polite">{display}</div>

    <div class="controls">
      <button
        type="button"
        class="ctrl primary"
        onclick={handlePrimary}
        aria-label={runState === "running" ? "Pause" : "Start"}
        title={runState === "running" ? "Pause" : "Start"}
      >
        {#if runState === "running"}
          <Icon name="pause" size={18} />
        {:else}
          <Icon name="play" size={18} />
        {/if}
      </button>
      <button
        type="button"
        class="ctrl"
        onclick={handleLap}
        disabled={runState !== "running"}
        aria-label="Lap"
        title="Lap"
      >
        <Icon name="flag" size={16} />
      </button>
      <button
        type="button"
        class="ctrl"
        onclick={handleReset}
        disabled={runState === "idle" && elapsedBeforeResume === 0}
        aria-label="Reset"
        title="Reset"
      >
        <Icon name="rotate-ccw" size={16} />
      </button>
    </div>

    {#if laps.length > 0}
      <ul class="laps">
        {#each visibleLaps as lap (lap.index)}
          <li class="lap">
            <span class="lap-index">#{lap.index}</span>
            <span class="lap-time">
              {formatElapsed(showSplits ? lap.splitMs : lap.totalMs, precision)}
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .stopwatch-inner {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    color: var(--widget-text, rgb(241 245 249));
    overflow: hidden;
  }

  .display {
    text-align: center;
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    color: var(--widget-accent, rgb(241 245 249));
    flex-shrink: 0;
  }

  .controls {
    display: flex;
    justify-content: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .ctrl {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    border: 1px solid rgb(71 85 105);
    background: rgb(15 23 42 / 0.5);
    color: inherit;
    cursor: pointer;
    transition:
      background 120ms ease,
      border-color 120ms ease,
      opacity 120ms ease;
  }

  .ctrl:hover:not(:disabled) {
    background: rgb(30 41 59 / 0.7);
  }

  .ctrl:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .ctrl.primary {
    width: 2.25rem;
    height: 2.25rem;
    border-color: rgb(59 130 246);
    background: rgb(59 130 246 / 0.15);
  }

  .ctrl.primary:hover {
    background: rgb(59 130 246 / 0.3);
  }

  .laps {
    list-style: none;
    margin: 0;
    padding: 0;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    font-size: 0.75rem;
  }

  .lap {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.2rem 0.4rem;
    border-bottom: 1px solid rgb(51 65 85 / 0.4);
  }

  .lap:last-child {
    border-bottom: none;
  }

  .lap-index {
    color: rgb(148 163 184);
    font-variant-numeric: tabular-nums;
  }

  .lap-time {
    font-variant-numeric: tabular-nums;
  }
</style>
