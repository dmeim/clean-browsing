<script lang="ts">
  import type { WidgetSettingsTabProps } from "$lib/widgets/types.js";
  import type { NotesSettings, NotesFontFamily } from "./definition.js";

  let { settings, updateSettings }: WidgetSettingsTabProps<NotesSettings> = $props();

  const normalized = $derived<NotesSettings>({
    content: settings.content ?? "",
    fontFamily: settings.fontFamily ?? "sans",
    fontSize: settings.fontSize ?? 14,
    maxCharacters: settings.maxCharacters ?? 0,
    showCounter: settings.showCounter ?? false,
    paddingV: settings.paddingV ?? 12,
    paddingH: settings.paddingH ?? 16,
  });

  function set<K extends keyof NotesSettings>(key: K, value: NotesSettings[K]) {
    updateSettings({ ...normalized, [key]: value });
  }

  function exportNote() {
    const blob = new Blob([normalized.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "note.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

<div class="form">
  <div class="row stack">
    <label for="notes-font-family" class="label">Font family</label>
    <select
      id="notes-font-family"
      class="select"
      value={normalized.fontFamily}
      onchange={(e) =>
        set("fontFamily", (e.currentTarget as HTMLSelectElement).value as NotesFontFamily)}
    >
      <option value="sans">Sans</option>
      <option value="serif">Serif</option>
      <option value="mono">Mono</option>
    </select>
  </div>

  <div class="row stack">
    <div class="label-row">
      <span class="label">Font size</span>
      <span class="value">{normalized.fontSize}px</span>
    </div>
    <input
      type="range"
      min="12"
      max="24"
      step="1"
      value={normalized.fontSize}
      oninput={(e) => set("fontSize", Number((e.currentTarget as HTMLInputElement).value))}
    />
  </div>

  <div class="row stack">
    <label for="notes-max-chars" class="label">Max characters</label>
    <input
      id="notes-max-chars"
      type="number"
      class="text-input"
      min="0"
      step="100"
      value={normalized.maxCharacters}
      oninput={(e) =>
        set("maxCharacters", Math.max(0, Number((e.currentTarget as HTMLInputElement).value) || 0))}
    />
    <span class="hint">0 = unlimited.</span>
  </div>

  <label class="row">
    <span class="label">Show counter</span>
    <input
      type="checkbox"
      checked={normalized.showCounter}
      onchange={(e) => set("showCounter", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>

  <div class="row stack">
    <span class="label">Export</span>
    <button type="button" class="export-btn" onclick={exportNote}>Download as .md</button>
    <span class="hint">Saves the current note content to a Markdown file.</span>
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

  .select,
  .text-input {
    width: 100%;
    padding: 0.4rem 0.6rem;
    border-radius: 0.375rem;
    background: rgb(2 6 23 / 0.6);
    border: 1px solid rgb(71 85 105);
    color: rgb(241 245 249);
    font-size: 0.85rem;
  }

  .select:focus,
  .text-input:focus {
    outline: none;
    border-color: rgb(59 130 246);
  }

  .export-btn {
    align-self: flex-start;
    padding: 0.4rem 0.75rem;
    border-radius: 0.375rem;
    background: rgb(59 130 246);
    border: 1px solid rgb(59 130 246);
    color: rgb(241 245 249);
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .export-btn:hover {
    background: rgb(37 99 235);
    border-color: rgb(37 99 235);
  }

  .hint {
    font-size: 0.7rem;
    color: rgb(148 163 184);
  }
</style>
