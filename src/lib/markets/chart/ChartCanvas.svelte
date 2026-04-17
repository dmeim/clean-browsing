<script lang="ts">
  import { onMount } from "svelte";
  import {
    createChart,
    AreaSeries,
    ColorType,
    LineStyle,
    type IChartApi,
    type ISeriesApi,
    type IPriceLine,
    type Time,
  } from "lightweight-charts";
  import type { HistoryPoint } from "../types.js";
  import type { ChangeColor } from "../format.js";

  type Props = {
    data: HistoryPoint[];
    color: ChangeColor;
    /** Optional dashed reference line (e.g. previous close on a 1D chart). */
    referenceLine?: number | null;
  };

  let { data, color, referenceLine = null }: Props = $props();

  let container: HTMLDivElement;
  let chart: IChartApi | null = null;
  let series: ISeriesApi<"Area"> | null = null;
  let priceLine: IPriceLine | null = null;

  type ColorTriad = { line: string; top: string; bottom: string };

  function colorsFor(c: ChangeColor): ColorTriad {
    switch (c) {
      case "up":
        return {
          line: "#4f8a5c",
          top: "rgba(79, 138, 92, 0.4)",
          bottom: "rgba(79, 138, 92, 0.02)",
        };
      case "down":
        return {
          line: "#dc2626",
          top: "rgba(220, 38, 38, 0.4)",
          bottom: "rgba(220, 38, 38, 0.02)",
        };
      default:
        return {
          line: "#94a3b8",
          top: "rgba(148, 163, 184, 0.3)",
          bottom: "rgba(148, 163, 184, 0.02)",
        };
    }
  }

  onMount(() => {
    const initialColors = colorsFor(color);
    chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(148, 163, 184, 0.85)",
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { visible: false, borderVisible: false },
      leftPriceScale: { visible: false, borderVisible: false },
      timeScale: { visible: false, borderVisible: false },
      crosshair: {
        vertLine: {
          color: "rgba(148, 163, 184, 0.4)",
          width: 1,
          style: LineStyle.Dashed,
          labelVisible: false,
        },
        horzLine: { visible: false },
      },
      handleScroll: false,
      handleScale: false,
    });

    series = chart.addSeries(AreaSeries, {
      lineColor: initialColors.line,
      topColor: initialColors.top,
      bottomColor: initialColors.bottom,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    series.setData(toSeriesData(data));
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (!chart || !container) return;
      chart.applyOptions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      priceLine = null;
      series = null;
      chart?.remove();
      chart = null;
    };
  });

  function toSeriesData(points: HistoryPoint[]) {
    return points.map((p) => ({ time: p.t as Time, value: p.price }));
  }

  $effect(() => {
    if (!series || !chart) return;
    series.setData(toSeriesData(data));
    chart.timeScale().fitContent();
  });

  $effect(() => {
    if (!series) return;
    const colors = colorsFor(color);
    series.applyOptions({
      lineColor: colors.line,
      topColor: colors.top,
      bottomColor: colors.bottom,
    });
  });

  $effect(() => {
    if (!series) return;
    if (priceLine) {
      series.removePriceLine(priceLine);
      priceLine = null;
    }
    if (referenceLine != null && Number.isFinite(referenceLine)) {
      priceLine = series.createPriceLine({
        price: referenceLine,
        color: "rgba(148, 163, 184, 0.55)",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: false,
        title: "",
      });
    }
  });
</script>

<div bind:this={container} class="chart-canvas"></div>

<style>
  .chart-canvas {
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    position: relative;
  }
</style>
