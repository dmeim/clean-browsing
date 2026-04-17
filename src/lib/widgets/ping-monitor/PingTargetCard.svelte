<script lang="ts">
  import type { PingTarget, PingStatus } from "./definition.js";

  type Props = {
    target: PingTarget;
    slowThresholdMs: number;
  };

  let { target, slowThresholdMs }: Props = $props();

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

  const protocol = $derived.by(() => {
    try {
      const url = new URL(/^https?:\/\//i.test(target.url) ? target.url : `https://${target.url}`);
      return url.protocol === "http:" ? "HTTP" : "HTTPS";
    } catch {
      return "HTTPS";
    }
  });

  const SPARKLINE_COUNT = 20;
  const SVG_W = 100;
  const SVG_H = 24;

  const sparklinePoints = $derived.by(() => {
    const samples = target.history.slice(-SPARKLINE_COUNT);
    if (samples.length < 2) return "";

    const durations = samples.map((s) => s.durationMs).filter((d): d is number => d != null);
    const maxD = Math.max(...durations, slowThresholdMs, 1);

    return samples
      .map((s, i) => {
        const x = (i / (samples.length - 1)) * SVG_W;
        const y = s.durationMs != null ? SVG_H - (s.durationMs / maxD) * (SVG_H - 2) - 1 : 1;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  });
</script>

<div class="card">
  <div class="status-row">
    <span class="dot" style="background: {statusColor};"></span>
    <span class="delay" style="color: {statusColor};">{delayText}</span>
  </div>

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

  <span class="label-text">{target.label || target.url || "No URL"}</span>
  <span class="method-tag">{protocol} {target.method ?? "GET"}</span>
</div>

<style>
  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    padding: 0.5rem 0.6rem;
    background: rgb(15 23 42 / 0.4);
    border: 1px solid rgb(51 65 85 / 0.6);
    border-radius: 0.5rem;
    min-width: 5.5rem;
    flex: 0 1 auto;
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .delay {
    font-size: 0.95rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    white-space: nowrap;
  }

  .sparkline {
    width: 100%;
    height: 1.25rem;
    display: block;
  }

  .sparkline-placeholder {
    width: 100%;
    height: 1.25rem;
  }

  .label-text {
    font-size: 0.7rem;
    color: rgb(148 163 184);
    text-align: center;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
  }

  .method-tag {
    font-size: 0.55rem;
    color: rgb(100 116 139);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    line-height: 1;
  }
</style>
