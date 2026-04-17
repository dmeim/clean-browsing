<script lang="ts">
  import type { ChangeColor } from "../format.js";

  type Props = {
    data: number[];
    color: ChangeColor;
  };

  let { data, color }: Props = $props();
  let canvas: HTMLCanvasElement;

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

  $effect(() => {
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 1;

    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = (i / (data.length - 1)) * w;
      const y = pad + ((max - data[i]) / range) * (h - pad * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = lineColorFor(color);
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  });
</script>

<canvas bind:this={canvas} class="sparkline" aria-hidden="true"></canvas>

<style>
  .sparkline {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
