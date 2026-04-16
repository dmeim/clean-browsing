<script lang="ts">
  import type { WidgetProps } from "$lib/widgets/types.js";
  import type { TimerSettings } from "./definition.js";
  import { formatElapsed } from "$lib/widgets/_shared/time.js";
  import { playBeep } from "./beepSound.js";
  import {
    buildAlarmName,
    scheduleTimerAlarm,
    clearAlarmByName,
    alarmExists,
    hasNotificationsApi,
  } from "./alarms.js";
  import Icon from "$lib/widgets/_shared/Icon.svelte";

  let { settings, updateSettings }: WidgetProps<TimerSettings> = $props();

  // Backfill older instances so the component always sees a complete
  // TimerSettings shape.
  const runState = $derived(settings.runState ?? "idle");
  const startedAtEpoch = $derived(settings.startedAtEpoch ?? 0);
  const totalDurationMs = $derived(settings.totalDurationMs ?? 0);
  const pausedRemainingMs = $derived(settings.pausedRemainingMs ?? 0);
  const defaultDurationMs = $derived(settings.defaultDurationMs ?? 5 * 60_000);
  const progressStyle = $derived(settings.progressStyle ?? "ring");
  const autoReset = $derived(settings.autoReset ?? false);
  const padV = $derived(settings.paddingV ?? 8);
  const padH = $derived(settings.paddingH ?? 8);
  const label = $derived((settings.label ?? "Timer").trim() || "Timer");
  const scheduledAlarmName = $derived(settings.scheduledAlarmName ?? "");

  // RAF-driven repaint trigger. Only ticks while running.
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

  // Stateless remaining-ms calculation.
  const remainingMs = $derived.by(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    tick;
    if (runState === "running") {
      const delta = Math.max(0, Date.now() - startedAtEpoch);
      return Math.max(0, totalDurationMs - delta);
    }
    if (runState === "paused") return pausedRemainingMs;
    if (runState === "expired") return 0;
    return defaultDurationMs;
  });

  // Percent of the total that has elapsed (0–1). When idle the ring is empty.
  const progress = $derived.by(() => {
    if (totalDurationMs <= 0) return 0;
    if (runState === "idle") return 0;
    return 1 - remainingMs / totalDurationMs;
  });

  // Display precision: show whole seconds for ≥10s, show .cs for <10s to
  // give feedback at the end of a run.
  const display = $derived.by(() => {
    if (remainingMs >= 10_000) return formatElapsed(remainingMs, "s");
    return formatElapsed(remainingMs, "cs");
  });

  function writeState(patch: Partial<TimerSettings>) {
    updateSettings({ ...settings, ...patch });
  }

  async function startTimer(durationMs: number) {
    if (durationMs <= 0) return;
    // Clear any stale alarm first.
    if (scheduledAlarmName) await clearAlarmByName(scheduledAlarmName);
    const instanceId = crypto.randomUUID();
    const sound = (settings.sound ?? "beep") === "beep" ? "beep" : "none";
    const alarmName = buildAlarmName(instanceId, label, sound);
    const startedAt = Date.now();
    const fireAt = startedAt + durationMs;
    if (settings.notifications !== false) {
      await scheduleTimerAlarm(instanceId, label, sound, fireAt);
    }
    writeState({
      runState: "running",
      startedAtEpoch: startedAt,
      totalDurationMs: durationMs,
      pausedRemainingMs: 0,
      scheduledAlarmName: settings.notifications !== false ? alarmName : "",
    });
  }

  async function pauseTimer() {
    if (runState !== "running") return;
    const delta = Math.max(0, Date.now() - startedAtEpoch);
    const remaining = Math.max(0, totalDurationMs - delta);
    if (scheduledAlarmName) await clearAlarmByName(scheduledAlarmName);
    writeState({
      runState: "paused",
      startedAtEpoch: 0,
      pausedRemainingMs: remaining,
      scheduledAlarmName: "",
    });
  }

  async function resumeTimer() {
    if (runState !== "paused") return;
    const remaining = pausedRemainingMs;
    if (remaining <= 0) return;
    const instanceId = crypto.randomUUID();
    const sound = (settings.sound ?? "beep") === "beep" ? "beep" : "none";
    const alarmName = buildAlarmName(instanceId, label, sound);
    const startedAt = Date.now();
    const fireAt = startedAt + remaining;
    if (settings.notifications !== false) {
      await scheduleTimerAlarm(instanceId, label, sound, fireAt);
    }
    // totalDurationMs is kept as-is so progress % stays meaningful across
    // pause/resume, but the next expiry is `remaining` ms away.
    writeState({
      runState: "running",
      startedAtEpoch: startedAt - (totalDurationMs - remaining),
      pausedRemainingMs: 0,
      scheduledAlarmName: settings.notifications !== false ? alarmName : "",
    });
  }

  async function resetTimer() {
    if (scheduledAlarmName) await clearAlarmByName(scheduledAlarmName);
    writeState({
      runState: "idle",
      startedAtEpoch: 0,
      totalDurationMs: 0,
      pausedRemainingMs: 0,
      scheduledAlarmName: "",
    });
  }

  function handlePrimary() {
    if (runState === "idle" || runState === "expired") {
      void startTimer(defaultDurationMs);
    } else if (runState === "running") {
      void pauseTimer();
    } else if (runState === "paused") {
      void resumeTimer();
    }
  }

  // Foreground-expiry handler. If the tab is open when the timer runs
  // out, the background alarm still fires the system notification, but
  // we also want to beep + transition state here so the UI updates.
  $effect(() => {
    if (runState !== "running") return;
    if (remainingMs > 0) return;
    // One-shot transition.
    const willAutoReset = autoReset;
    const soundMode = settings.sound ?? "beep";
    if (soundMode === "beep") playBeep();
    // Clear our tracked alarm name; the background alarm either already
    // fired or will be a harmless duplicate.
    const alarmToClear = scheduledAlarmName;
    if (alarmToClear) void clearAlarmByName(alarmToClear);
    if (willAutoReset && totalDurationMs > 0) {
      const startedAt = Date.now();
      writeState({
        runState: "running",
        startedAtEpoch: startedAt,
        scheduledAlarmName: "",
      });
      // Re-arm the background alarm for the next cycle.
      if (settings.notifications !== false) {
        const instanceId = crypto.randomUUID();
        const sound = soundMode === "beep" ? "beep" : "none";
        void scheduleTimerAlarm(instanceId, label, sound, startedAt + totalDurationMs).then(() => {
          writeState({
            scheduledAlarmName: buildAlarmName(instanceId, label, sound),
          });
        });
      }
    } else {
      writeState({
        runState: "expired",
        startedAtEpoch: 0,
        pausedRemainingMs: 0,
        scheduledAlarmName: "",
      });
    }
  });

  // On mount: if the persisted state says we're running, verify the alarm
  // still exists. If the browser was fully restarted, MV2 non-persistent
  // alarms may have been dropped — recreate in that case so the timer
  // still fires at the original expiry.
  $effect(() => {
    if (runState !== "running") return;
    if (!scheduledAlarmName) return;
    if (settings.notifications === false) return;
    let cancelled = false;
    (async () => {
      const exists = await alarmExists(scheduledAlarmName);
      if (cancelled || exists) return;
      const fireAt = startedAtEpoch + totalDurationMs;
      if (fireAt <= Date.now()) return; // expiry will be handled by the $effect above
      // Recreate with the same name so the background script behaves identically.
      if (hasNotificationsApi()) {
        // parse sound from the existing name (last segment)
        const segments = scheduledAlarmName.split(":");
        const sound = segments[segments.length - 1] === "beep" ? "beep" : "none";
        const parts = scheduledAlarmName.split(":");
        const instanceId = parts[1] ?? crypto.randomUUID();
        void scheduleTimerAlarm(instanceId, label, sound, fireAt);
      }
    })();
    return () => {
      cancelled = true;
    };
  });
</script>

<div class="widget-card timer">
  {#if progressStyle === "ring"}
    <svg class="ring" viewBox="0 0 100 140" preserveAspectRatio="xMidYMin meet">
      <g transform="rotate(-90 50 50)" aria-hidden="true">
        <circle class="ring-track" cx="50" cy="50" r="45" />
        <circle
          class="ring-fill"
          cx="50"
          cy="50"
          r="45"
          style="stroke-dasharray: {2 * Math.PI * 45}; stroke-dashoffset: {2 *
            Math.PI *
            45 *
            (1 - progress)};"
        />
      </g>
      <text
        x="50"
        y="50"
        text-anchor="middle"
        dominant-baseline="central"
        class="ring-time"
        class:expired={runState === "expired"}
        aria-live="polite">{display}</text>
    </svg>
  {/if}

  <div
    class="widget-inner timer-inner"
    style="top: {padV}px; bottom: {padV}px; left: {padH}px; right: {padH}px;"
  >
    {#if progressStyle !== "ring"}
      <div class="display" class:expired={runState === "expired"} aria-live="polite">
        {display}
      </div>
    {/if}

    {#if progressStyle === "bar"}
      <div class="bar-track" aria-hidden="true">
        <div class="bar-fill" style="width: {Math.round(progress * 100)}%"></div>
      </div>
    {/if}

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
        onclick={resetTimer}
        disabled={runState === "idle" && totalDurationMs === 0}
        aria-label="Reset"
        title="Reset"
      >
        <Icon name="rotate-ccw" size={16} />
      </button>
    </div>

  </div>
</div>

<style>
  .timer-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    color: var(--widget-text, rgb(241 245 249));
  }

  .expired {
    color: rgb(248 113 113);
    fill: rgb(248 113 113);
    animation: pulse 0.8s ease-in-out infinite alternate;
  }

  @keyframes pulse {
    from {
      opacity: 0.5;
    }
    to {
      opacity: 1;
    }
  }

  /* Fallback display for bar mode (no ring SVG). */
  .display {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    color: var(--widget-accent, rgb(241 245 249));
  }

  /* Ring fills the entire card so its compositing boundary aligns with
     the card edge — prevents a visible seam in Firefox when the card
     uses backdrop-filter. */
  .ring {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  /* Time text inside the SVG — scales with the ring automatically. */
  .ring-time {
    fill: var(--widget-accent, rgb(241 245 249));
    font-size: 18px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }

  .ring-track {
    fill: none;
    stroke: rgb(51 65 85 / 0.6);
    stroke-width: 4;
  }

  .ring-fill {
    fill: none;
    stroke: rgb(59 130 246);
    stroke-width: 4;
    stroke-linecap: round;
    transition: stroke-dashoffset 100ms linear;
  }

  .bar-track {
    height: 6px;
    border-radius: 999px;
    background: rgb(51 65 85 / 0.6);
    overflow: hidden;
    flex-shrink: 0;
  }

  .bar-fill {
    height: 100%;
    background: rgb(59 130 246);
    transition: width 100ms linear;
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
</style>
