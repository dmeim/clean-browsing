<script lang="ts">
  import dayjs from "dayjs";
  import advancedFormat from "dayjs/plugin/advancedFormat.js";
  import type { WidgetSettingsTabProps } from "$lib/widgets/types.js";
  import type { DateSettings } from "./definition.js";

  dayjs.extend(advancedFormat);

  let { settings, updateSettings }: WidgetSettingsTabProps<DateSettings> = $props();

  const currentFormat = $derived(settings.format || "YYYY-MM-DD");

  function handleInput(event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value;
    updateSettings({ ...settings, format: value });
  }

  const examples: { token: string; label: string }[] = [
    { token: "YYYY-MM-DD", label: "ISO date" },
    { token: "MM/DD/YYYY", label: "US" },
    { token: "dddd, MMMM DD, YYYY", label: "Full weekday + date" },
    { token: "MMMM D, YYYY", label: "Full month" },
    { token: "ddd, MMM Do", label: "Weekday + ordinal" },
    { token: "[Today is] dddd", label: "With literal text" },
  ];

  function applyExample(token: string) {
    updateSettings({ ...settings, format: token });
  }

  const preview = $derived.by(() => {
    const fmt = currentFormat.trim();
    if (!fmt) return { text: "Enter a format above", valid: false };
    try {
      return { text: dayjs().format(fmt), valid: true };
    } catch {
      return { text: "Invalid format", valid: false };
    }
  });

  function exampleOutput(token: string): string {
    try {
      return dayjs().format(token);
    } catch {
      return "—";
    }
  }
</script>

<div class="form">
  <div class="section">
    <label for="date-format" class="label-row">
      <span class="label">Format string</span>
      <a
        href="https://day.js.org/docs/en/display/format"
        target="_blank"
        rel="noopener noreferrer"
        class="help-link"
      >
        Day.js docs →
      </a>
    </label>
    <input
      id="date-format"
      type="text"
      class="text-input"
      placeholder="YYYY-MM-DD"
      value={currentFormat}
      oninput={handleInput}
    />
  </div>

  <div class="section">
    <div class="label">Live preview</div>
    <div class="preview" class:invalid={!preview.valid}>
      {preview.text}
    </div>
  </div>

  <div class="section">
    <div class="label">Quick examples</div>
    <div class="examples">
      {#each examples as ex (ex.token)}
        <button
          type="button"
          class="example"
          onclick={() => applyExample(ex.token)}
          title={ex.label}
        >
          <code class="example-token">{ex.token}</code>
          <span class="example-output">{exampleOutput(ex.token)}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="section">
    <div class="label">Common tokens</div>
    <div class="tokens">
      <div><code>YYYY</code> year</div>
      <div><code>MM</code> month (01–12)</div>
      <div><code>DD</code> day (01–31)</div>
      <div><code>MMMM</code> full month</div>
      <div><code>MMM</code> short month</div>
      <div><code>dddd</code> full weekday</div>
      <div><code>ddd</code> short weekday</div>
      <div><code>Do</code> day with ordinal</div>
      <div><code>HH</code> 24-hour</div>
      <div><code>h</code> 12-hour</div>
      <div><code>mm</code> minutes</div>
      <div><code>A</code> AM/PM</div>
      <div class="tokens-full"><code>[text]</code> literal text (brackets escape)</div>
    </div>
  </div>
</div>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .label {
    font-size: 0.8rem;
    color: rgb(148 163 184);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .help-link {
    font-size: 0.72rem;
    color: rgb(96 165 250);
    text-decoration: none;
  }

  .help-link:hover {
    text-decoration: underline;
  }

  .text-input {
    width: 100%;
    padding: 0.55rem 0.75rem;
    border-radius: 0.5rem;
    background: rgb(2 6 23 / 0.7);
    border: 1px solid rgb(71 85 105);
    color: rgb(241 245 249);
    font-size: 0.95rem;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
  }

  .text-input:focus {
    outline: none;
    border-color: rgb(59 130 246);
    box-shadow: 0 0 0 2px rgb(59 130 246 / 0.25);
  }

  .preview {
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    background: rgb(34 197 94 / 0.1);
    border: 1px solid rgb(34 197 94 / 0.4);
    color: rgb(134 239 172);
    font-size: 1.05rem;
    font-weight: 500;
    text-align: center;
    min-height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview.invalid {
    background: rgb(239 68 68 / 0.1);
    border-color: rgb(239 68 68 / 0.4);
    color: rgb(252 165 165);
  }

  .examples {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
  }

  .example {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0.5rem 0.65rem;
    background: rgb(15 23 42 / 0.6);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.4rem;
    cursor: pointer;
    transition:
      background 120ms ease,
      border-color 120ms ease;
    text-align: left;
  }

  .example:hover {
    background: rgb(30 41 59 / 0.9);
    border-color: rgb(96 165 250);
  }

  .example-token {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.75rem;
    color: rgb(203 213 225);
  }

  .example-output {
    font-size: 0.7rem;
    color: rgb(148 163 184);
    margin-top: 0.15rem;
  }

  .tokens {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem 0.75rem;
    font-size: 0.75rem;
    color: rgb(148 163 184);
    padding: 0.6rem 0.75rem;
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.4rem;
  }

  .tokens-full {
    grid-column: 1 / -1;
  }

  .tokens code {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    color: rgb(226 232 240);
    background: rgb(2 6 23 / 0.6);
    padding: 0.05rem 0.3rem;
    border-radius: 0.25rem;
    margin-right: 0.3rem;
  }
</style>
