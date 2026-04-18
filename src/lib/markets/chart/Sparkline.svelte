<script lang="ts">
  import type { ChangeColor } from "../format.js";

  type Props = {
    data: number[];
    color: ChangeColor;
  };

  let { data, color }: Props = $props();

  function lineColorFor(c: ChangeColor): string {
    switch (c) {
      case "up":
        return "#4f8a5c";
      case "down":
        return "#dc2626";
      default:
        return "#94a3b8";
    }
  }

  const VW = 1000;
  const VH = 100;
  const PAD = 2;

  const points = $derived.by(() => {
    if (data.length < 2) return "";
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * VW;
        const y = PAD + ((max - v) / range) * (VH - PAD * 2);
        return `${x},${y}`;
      })
      .join(" ");
  });
</script>

{#if points}
  <svg class="sparkline" viewBox="0 0 {VW} {VH}" preserveAspectRatio="none" aria-hidden="true">
    <polyline
      {points}
      fill="none"
      stroke={lineColorFor(color)}
      stroke-width="1.5"
      stroke-linejoin="round"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
{/if}

<style>
  .sparkline {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
