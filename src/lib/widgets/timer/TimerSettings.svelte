<script lang="ts">
  import type { WidgetSettingsProps } from "$lib/widgets/types.js";
  import type { TimerSettings, TimerPreset } from "./definition.js";
  import { DEFAULT_PRESETS } from "./definition.js";
  import { msToHms, hmsToMs } from "$lib/widgets/_shared/time.js";
  import Icon from "$lib/widgets/_shared/Icon.svelte";

  let { settings, updateSettings }: WidgetSettingsProps<TimerSettings> = $props();

  const normalized = $derived<TimerSettings>({
    runState: settings.runState ?? "idle",
    startedAtEpoch: settings.startedAtEpoch ?? 0,
    totalDurationMs: settings.totalDurationMs ?? 0,
    pausedRemainingMs: settings.pausedRemainingMs ?? 0,
    scheduledAlarmName: settings.scheduledAlarmName ?? "",
    label: settings.label ?? "Timer",
    defaultDurationMs: settings.defaultDurationMs ?? 5 * 60_000,
    notifications: settings.notifications ?? true,
    sound: settings.sound ?? "beep",
    progressStyle: settings.progressStyle ?? "ring",
    autoReset: settings.autoReset ?? false,
    presets: settings.presets ?? DEFAULT_PRESETS,
    paddingV: settings.paddingV ?? 8,
    paddingH: settings.paddingH ?? 8,
  });

  function set<K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) {
    updateSettings({ ...normalized, [key]: value });
  }

  const hms = $derived(msToHms(normalized.defaultDurationMs));

  function setDuration(part: "hours" | "minutes" | "seconds", raw: string) {
    const value = Math.max(0, Number(raw) || 0);
    const next = { ...hms, [part]: value };
    set("defaultDurationMs", hmsToMs(next.hours, next.minutes, next.seconds));
  }

  function updatePreset(index: number, patch: Partial<TimerPreset>) {
    const next = normalized.presets.map((p, i) => (i === index ? { ...p, ...patch } : p));
    set("presets", next);
  }

  function removePreset(index: number) {
    set(
      "presets",
      normalized.presets.filter((_, i) => i !== index),
    );
  }

  function addPreset() {
    set("presets", [...normalized.presets, { label: "New preset", durationMs: 60_000 }]);
  }

  function presetHms(preset: TimerPreset) {
    return msToHms(preset.durationMs);
  }

  function updatePresetDuration(index: number, part: "hours" | "minutes" | "seconds", raw: string) {
    const current = presetHms(normalized.presets[index]);
    const value = Math.max(0, Number(raw) || 0);
    const next = { ...current, [part]: value };
    updatePreset(index, { durationMs: hmsToMs(next.hours, next.minutes, next.seconds) });
  }
</script>

<div class="form">
  <div class="row stack">
    <label for="timer-label" class="label">Label</label>
    <input
      id="timer-label"
      type="text"
      class="text-input"
      value={normalized.label}
      oninput={(e) => set("label", (e.currentTarget as HTMLInputElement).value)}
    />
    <span class="hint">Shown in the notification when the timer expires.</span>
  </div>

  <div class="row stack">
    <span class="label">Default duration</span>
    <div class="hms">
      <label class="hms-field">
        <input
          type="number"
          min="0"
          max="23"
          step="1"
          class="text-input"
          value={hms.hours}
          oninput={(e) => setDuration("hours", (e.currentTarget as HTMLInputElement).value)}
        />
        <span class="hms-unit">h</span>
      </label>
      <label class="hms-field">
        <input
          type="number"
          min="0"
          max="59"
          step="1"
          class="text-input"
          value={hms.minutes}
          oninput={(e) => setDuration("minutes", (e.currentTarget as HTMLInputElement).value)}
        />
        <span class="hms-unit">m</span>
      </label>
      <label class="hms-field">
        <input
          type="number"
          min="0"
          max="59"
          step="1"
          class="text-input"
          value={hms.seconds}
          oninput={(e) => setDuration("seconds", (e.currentTarget as HTMLInputElement).value)}
        />
        <span class="hms-unit">s</span>
      </label>
    </div>
    <span class="hint">Used when the primary Start button is pressed with no preset.</span>
  </div>

  <label class="row">
    <span class="label">Notifications</span>
    <input
      type="checkbox"
      checked={normalized.notifications}
      onchange={(e) => set("notifications", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>

  <div class="row stack">
    <span class="label">Alert sound</span>
    <div class="segmented" role="radiogroup" aria-label="Alert sound">
      <button
        type="button"
        role="radio"
        aria-checked={normalized.sound === "none"}
        class="seg"
        class:selected={normalized.sound === "none"}
        onclick={() => set("sound", "none")}
      >
        None
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={normalized.sound === "beep"}
        class="seg"
        class:selected={normalized.sound === "beep"}
        onclick={() => set("sound", "beep")}
      >
        Beep
      </button>
    </div>
    <span class="hint"
      >Beep plays when the widget is in a foreground tab. The OS notification sound always plays on
      expiry regardless of this setting.</span
    >
  </div>

  <div class="row stack">
    <span class="label">Progress style</span>
    <div class="segmented" role="radiogroup" aria-label="Progress style">
      <button
        type="button"
        role="radio"
        aria-checked={normalized.progressStyle === "ring"}
        class="seg"
        class:selected={normalized.progressStyle === "ring"}
        onclick={() => set("progressStyle", "ring")}
      >
        Ring
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={normalized.progressStyle === "bar"}
        class="seg"
        class:selected={normalized.progressStyle === "bar"}
        onclick={() => set("progressStyle", "bar")}
      >
        Bar
      </button>
    </div>
  </div>

  <label class="row">
    <span class="label">Auto-reset on expiry</span>
    <input
      type="checkbox"
      checked={normalized.autoReset}
      onchange={(e) => set("autoReset", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>

  <div class="row stack">
    <span class="label">Presets</span>
    <div class="presets-list">
      {#each normalized.presets as preset, i (i)}
        {@const p = presetHms(preset)}
        <div class="preset-row">
          <input
            type="text"
            class="text-input preset-label"
            value={preset.label}
            placeholder="Label"
            oninput={(e) => updatePreset(i, { label: (e.currentTarget as HTMLInputElement).value })}
          />
          <input
            type="number"
            min="0"
            max="23"
            step="1"
            class="text-input preset-num"
            value={p.hours}
            oninput={(e) =>
              updatePresetDuration(i, "hours", (e.currentTarget as HTMLInputElement).value)}
          />
          <span class="hms-unit">h</span>
          <input
            type="number"
            min="0"
            max="59"
            step="1"
            class="text-input preset-num"
            value={p.minutes}
            oninput={(e) =>
              updatePresetDuration(i, "minutes", (e.currentTarget as HTMLInputElement).value)}
          />
          <span class="hms-unit">m</span>
          <input
            type="number"
            min="0"
            max="59"
            step="1"
            class="text-input preset-num"
            value={p.seconds}
            oninput={(e) =>
              updatePresetDuration(i, "seconds", (e.currentTarget as HTMLInputElement).value)}
          />
          <span class="hms-unit">s</span>
          <button
            type="button"
            class="icon-btn"
            aria-label="Remove preset"
            onclick={() => removePreset(i)}
          >
            <Icon name="trash-2" size={14} />
          </button>
        </div>
      {/each}
      <button type="button" class="btn" onclick={addPreset}>Add preset</button>
    </div>
  </div>

  <div class="row stack">
    <div class="label-row">
      <span class="label">Vertical padding</span>
      <span class="value">{normalized.paddingV}px</span>
    </div>
    <input
      type="range"
      min="0"
      max="80"
      step="1"
      value={normalized.paddingV}
      oninput={(e) => set("paddingV", Number((e.currentTarget as HTMLInputElement).value))}
    />
  </div>

  <div class="row stack">
    <div class="label-row">
      <span class="label">Horizontal padding</span>
      <span class="value">{normalized.paddingH}px</span>
    </div>
    <input
      type="range"
      min="0"
      max="80"
      step="1"
      value={normalized.paddingH}
      oninput={(e) => set("paddingH", Number((e.currentTarget as HTMLInputElement).value))}
    />
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

  .label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .value {
    font-size: 0.75rem;
    color: rgb(148 163 184);
    font-variant-numeric: tabular-nums;
  }

  .hint {
    font-size: 0.7rem;
    color: rgb(148 163 184);
  }

  input[type="range"] {
    width: 100%;
    accent-color: rgb(59 130 246);
    cursor: pointer;
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

  .hms {
    display: flex;
    gap: 0.5rem;
  }

  .hms-field {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .hms-unit {
    font-size: 0.75rem;
    color: rgb(148 163 184);
  }

  .segmented {
    display: flex;
    gap: 0.25rem;
    padding: 0.2rem;
    background: rgb(2 6 23 / 0.6);
    border-radius: 0.375rem;
    border: 1px solid rgb(71 85 105);
  }

  .seg {
    flex: 1;
    padding: 0.35rem 0.5rem;
    border-radius: 0.25rem;
    background: transparent;
    border: none;
    color: rgb(203 213 225);
    font-size: 0.8rem;
    cursor: pointer;
  }

  .seg.selected {
    background: rgb(59 130 246 / 0.25);
    color: rgb(241 245 249);
  }

  .presets-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .preset-row {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .preset-label {
    flex: 1;
    min-width: 0;
  }

  .preset-num {
    width: 3ch;
    padding: 0.3rem 0.35rem;
    text-align: center;
  }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border: 1px solid rgb(71 85 105);
    background: rgb(15 23 42 / 0.5);
    color: rgb(203 213 225);
    border-radius: 0.375rem;
    cursor: pointer;
  }

  .icon-btn:hover {
    background: rgb(30 41 59 / 0.8);
  }

  .btn {
    padding: 0.45rem 0.6rem;
    border-radius: 0.375rem;
    background: rgb(2 6 23 / 0.6);
    border: 1px solid rgb(71 85 105);
    color: rgb(226 232 240);
    font-size: 0.8rem;
    cursor: pointer;
  }

  .btn:hover {
    background: rgb(30 41 59 / 0.8);
  }
</style>
