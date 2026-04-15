<script lang="ts">
  import type { WidgetStylePreset } from "$lib/settings/types.js";
  import { settingsStore } from "$lib/settings/store.svelte.js";
  import { imageLibrary } from "$lib/storage/imageLibrary.svelte.js";
  import { widgetBackgroundCss } from "$lib/widgets/style/resolve.js";

  type Props = {
    onApply: (preset: WidgetStylePreset) => void;
    allowSave?: boolean;
  };

  let { onApply, allowSave = true }: Props = $props();

  let savingName = $state<string | null>(null);
  let draftName = $state("");

  const presets = $derived(settingsStore.allPresets());

  function startSave() {
    draftName = "";
    savingName = "";
  }

  function commitSave() {
    if (savingName === null) return;
    const name = draftName.trim();
    if (!name) {
      savingName = null;
      return;
    }
    settingsStore.addPreset(name);
    savingName = null;
    draftName = "";
  }

  function cancelSave() {
    savingName = null;
    draftName = "";
  }

  function handleDelete(id: string, event: MouseEvent) {
    event.stopPropagation();
    settingsStore.deletePreset(id);
  }

  function swatchFor(preset: WidgetStylePreset): string {
    return widgetBackgroundCss(preset.style, (id) => imageLibrary.get(id)?.dataUrl ?? null);
  }
</script>

<div class="preset-bar">
  <div class="chips">
    {#each presets as preset (preset.id)}
      <div class="chip-wrap" class:user={!preset.builtin}>
        <button type="button" class="chip-main" onclick={() => onApply(preset)} title={preset.name}>
          <span class="swatch" style="background: {swatchFor(preset)};"></span>
          <span class="name">{preset.name}</span>
        </button>
        {#if !preset.builtin}
          <button
            type="button"
            class="trash"
            aria-label="Delete preset"
            onclick={(e) => handleDelete(preset.id, e)}>×</button
          >
        {/if}
      </div>
    {/each}
  </div>
  {#if allowSave}
    {#if savingName === null}
      <button type="button" class="save-btn" onclick={startSave}>+ Save as preset…</button>
    {:else}
      <div class="save-row">
        <input
          type="text"
          placeholder="Preset name"
          bind:value={draftName}
          onkeydown={(e) => {
            if (e.key === "Enter") commitSave();
            if (e.key === "Escape") cancelSave();
          }}
        />
        <button type="button" class="btn btn-primary" onclick={commitSave}>Save</button>
        <button type="button" class="btn" onclick={cancelSave}>Cancel</button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .preset-bar {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  .chips {
    display: flex;
    gap: 0.375rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }
  .chip-wrap {
    display: flex;
    align-items: center;
    gap: 0.125rem;
    border: 1px solid var(--ui-panel-border);
    background: var(--ui-panel-bg);
    border-radius: 9999px;
    flex-shrink: 0;
    padding: 0 0.25rem 0 0;
  }
  .chip-wrap:hover {
    border-color: var(--ui-accent-teal);
  }
  .chip-main {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.375rem 0.625rem;
    background: transparent;
    border: none;
    color: var(--ui-fg);
    font-size: 0.75rem;
    cursor: pointer;
    border-radius: 9999px;
  }
  .swatch {
    display: inline-block;
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 9999px;
    border: 1px solid var(--ui-border-soft);
  }
  .name {
    white-space: nowrap;
  }
  .trash {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.1rem;
    height: 1.1rem;
    border: none;
    background: transparent;
    color: var(--ui-muted-fg);
    cursor: pointer;
    border-radius: 9999px;
    font-size: 0.9rem;
    line-height: 1;
    padding: 0;
  }
  .trash:hover {
    background: var(--ui-danger-bg);
    color: var(--ui-danger-fg);
  }
  .save-btn {
    align-self: flex-start;
    padding: 0.25rem 0.625rem;
    font-size: 0.75rem;
    background: transparent;
    border: 1px dashed var(--ui-border-soft);
    border-radius: 0.375rem;
    color: var(--ui-muted-fg);
    cursor: pointer;
  }
  .save-btn:hover {
    border-color: var(--ui-accent-teal);
    color: var(--ui-fg);
  }
  .save-row {
    display: flex;
    gap: 0.375rem;
  }
  .save-row input {
    flex: 1;
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
    background: var(--ui-input-bg);
    border: 1px solid var(--ui-panel-border);
    border-radius: 0.375rem;
    color: var(--ui-fg);
  }
  .save-row input:focus {
    outline: none;
    border-color: var(--ui-focus);
  }
  .btn {
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
    background: var(--ui-subtle-bg);
    border: 1px solid var(--ui-panel-border);
    color: var(--ui-fg);
    font-size: 0.8125rem;
    cursor: pointer;
  }
  .btn-primary {
    background: var(--ui-accent);
    border-color: var(--ui-accent);
    color: var(--ui-accent-fg);
  }
</style>
