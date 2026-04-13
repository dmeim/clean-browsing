<script lang="ts">
  import type { WidgetSettingsProps } from "$lib/widgets/types.js";
  import type { ClockSettings } from "./definition.js";

  let { settings, updateSettings }: WidgetSettingsProps<ClockSettings> = $props();

  // Normalize any legacy instance missing the new fields so the form
  // always has a complete ClockSettings shape to work with.
  const normalized = $derived<ClockSettings>({
    format24h: settings.format24h ?? false,
    showSeconds: settings.showSeconds ?? true,
    showAmPm: settings.showAmPm ?? true,
    flashing: settings.flashing ?? false,
    daylightSavings: settings.daylightSavings ?? true,
    locale: settings.locale ?? "auto",
  });

  function set<K extends keyof ClockSettings>(key: K, value: ClockSettings[K]) {
    updateSettings({ ...normalized, [key]: value });
  }

  function handleLocaleInput(event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value.trim();
    set("locale", value === "" ? "auto" : value);
  }
</script>

<div class="form">
  <label class="row">
    <span class="label">24-hour format</span>
    <input
      type="checkbox"
      checked={normalized.format24h}
      onchange={(e) => set("format24h", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>

  <label class="row">
    <span class="label">Show seconds</span>
    <input
      type="checkbox"
      checked={normalized.showSeconds}
      onchange={(e) => set("showSeconds", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>

  {#if !normalized.format24h}
    <label class="row">
      <span class="label">Show AM/PM</span>
      <input
        type="checkbox"
        checked={normalized.showAmPm}
        onchange={(e) => set("showAmPm", (e.currentTarget as HTMLInputElement).checked)}
      />
    </label>
  {/if}

  <label class="row">
    <span class="label">Flashing separator</span>
    <input
      type="checkbox"
      checked={normalized.flashing}
      onchange={(e) => set("flashing", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>

  <label class="row">
    <span class="label">Use daylight savings</span>
    <input
      type="checkbox"
      checked={normalized.daylightSavings}
      onchange={(e) => set("daylightSavings", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>

  <div class="row stack">
    <label for="clock-locale" class="label">Locale</label>
    <input
      id="clock-locale"
      type="text"
      class="text-input"
      placeholder="auto"
      value={normalized.locale === "auto" ? "" : normalized.locale}
      onchange={handleLocaleInput}
    />
    <span class="hint">e.g. <code>en-US</code>, <code>de-DE</code>, <code>ja-JP</code>. Blank = browser default.</span>
  </div>
</div>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .row.stack {
    flex-direction: column;
    align-items: stretch;
    gap: 0.4rem;
    cursor: default;
  }

  .label {
    font-size: 0.875rem;
    color: rgb(226 232 240);
  }

  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    accent-color: rgb(59 130 246);
    cursor: pointer;
  }

  .text-input {
    width: 100%;
    padding: 0.4rem 0.6rem;
    border-radius: 0.375rem;
    background: rgb(2 6 23 / 0.6);
    border: 1px solid rgb(71 85 105);
    color: rgb(241 245 249);
    font-size: 0.85rem;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
  }

  .text-input:focus {
    outline: none;
    border-color: rgb(59 130 246);
  }

  .hint {
    font-size: 0.7rem;
    color: rgb(148 163 184);
  }

  .hint code {
    background: rgb(15 23 42);
    padding: 0.05rem 0.3rem;
    border-radius: 0.25rem;
    color: rgb(203 213 225);
  }
</style>
