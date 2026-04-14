<script lang="ts">
  import dayjs from "dayjs";
  import advancedFormat from "dayjs/plugin/advancedFormat.js";
  import type { WidgetProps } from "$lib/widgets/types.js";
  import type { DateSettings } from "./definition.js";
  import { fitText } from "$lib/grid/fitText.js";

  dayjs.extend(advancedFormat);

  let { settings }: WidgetProps<DateSettings> = $props();

  let now = $state(dayjs());

  $effect(() => {
    // Tick every minute — aligns to the next minute boundary for accuracy.
    const msUntilNextMinute = 60_000 - (Date.now() % 60_000);
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const timeoutId = setTimeout(() => {
      now = dayjs();
      intervalId = setInterval(() => {
        now = dayjs();
      }, 60_000);
    }, msUntilNextMinute);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  });

  const formatted = $derived.by(() => {
    const fmt = settings.format || "YYYY-MM-DD";
    try {
      return now.format(fmt);
    } catch {
      return "Invalid format";
    }
  });

  const padV = $derived(settings.paddingV ?? 0);
  const padH = $derived(settings.paddingH ?? 0);
</script>

<div class="widget-card date-widget">
  <div
    class="widget-inner date-inner"
    style="top: {padV}px; bottom: {padV}px; left: {padH}px; right: {padH}px;"
  >
    <span class="date-text" use:fitText>{formatted}</span>
  </div>
</div>

<style>
  .date-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .date-text {
    font-size: 1rem;
    font-weight: 500;
    color: var(--widget-accent, rgb(241 245 249));
    letter-spacing: 0.01em;
    white-space: nowrap;
    line-height: 1;
  }
</style>
