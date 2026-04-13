<script lang="ts">
  import dayjs from "dayjs";
  import advancedFormat from "dayjs/plugin/advancedFormat.js";
  import type { WidgetProps } from "$lib/widgets/types.js";
  import type { DateSettings } from "./definition.js";

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
</script>

<div class="date-widget">
  <span class="date-text">{formatted}</span>
</div>

<style>
  .date-widget {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: rgb(15 23 42 / 0.6);
    border: 1px solid rgb(51 65 85 / 0.5);
    border-radius: 0.75rem;
    backdrop-filter: blur(12px);
    padding: 0.5rem 0.75rem;
    text-align: center;
  }

  .date-text {
    font-size: clamp(1rem, 2.5vw, 1.75rem);
    font-weight: 500;
    color: rgb(241 245 249);
    letter-spacing: 0.01em;
  }
</style>
