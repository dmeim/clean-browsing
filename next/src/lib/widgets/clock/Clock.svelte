<script lang="ts">
  import type { WidgetProps } from "$lib/widgets/types.js";
  import type { ClockSettings } from "./definition.js";

  let { settings }: WidgetProps<ClockSettings> = $props();

  let now = $state(new Date());

  $effect(() => {
    const id = setInterval(() => {
      now = new Date();
    }, 1000);
    return () => clearInterval(id);
  });

  function isDST(d: Date): boolean {
    const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
    const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
    const stdOffset = Math.max(jan, jul);
    return d.getTimezoneOffset() < stdOffset;
  }

  const timeString = $derived.by(() => {
    let effective = now;
    // Fallback handling for legacy instances that lack the new fields.
    const dst = settings.daylightSavings ?? true;
    const flashing = settings.flashing ?? false;
    const localePref = settings.locale ?? "auto";
    const showAmPm = settings.showAmPm ?? true;

    if (dst === false && isDST(effective)) {
      effective = new Date(effective.getTime() - 3_600_000);
    }

    const locale =
      localePref && localePref !== "auto" ? localePref : navigator.language;

    const opts: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "numeric",
      hour12: !settings.format24h,
    };
    if (settings.showSeconds) opts.second = "numeric";

    // Use formatToParts so we can filter out the dayPeriod (AM/PM) cleanly
    // across locales when the user disables it.
    let parts: Intl.DateTimeFormatPart[];
    try {
      parts = new Intl.DateTimeFormat(locale, opts).formatToParts(effective);
    } catch {
      parts = new Intl.DateTimeFormat(navigator.language, opts).formatToParts(effective);
    }

    const hideAmPm = !settings.format24h && !showAmPm;
    let formatted = parts
      .filter((p) => !(hideAmPm && p.type === "dayPeriod"))
      .map((p) => p.value)
      .join("")
      .replace(/\s+/g, " ")
      .trim();

    if (flashing) {
      const sep = effective.getSeconds() % 2 === 0 ? ":" : " ";
      formatted = formatted.replace(/:/g, sep);
    }

    return formatted;
  });
</script>

<div class="clock">
  <span class="time">{timeString}</span>
</div>

<style>
  .clock {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: rgb(15 23 42 / 0.6);
    border: 1px solid rgb(51 65 85 / 0.5);
    border-radius: 0.75rem;
    backdrop-filter: blur(12px);
  }

  .time {
    font-size: clamp(1.5rem, 4vw, 3rem);
    font-weight: 600;
    color: rgb(241 245 249);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }
</style>
