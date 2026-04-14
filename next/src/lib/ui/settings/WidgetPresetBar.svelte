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
        <button
          type="button"
          class="chip-main"
          onclick={() => onApply(preset)}
          title={preset.name}
        >
          <span class="swatch" style="background: {swatchFor(preset)};"></span>
          <span class="name">{preset.name}</span>
        </button>
        {#if !preset.builtin}
          <button
            type="button"
            class="trash"
            aria-label="Delete preset"
            onclick={(e) => handleDelete(preset.id, e)}
          >×</button>
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
    border: 1px solid rgb(51 65 85);
    background: rgb(15 23 42 / 0.6);
    border-radius: 9999px;
    flex-shrink: 0;
    padding: 0 0.25rem 0 0;
  }
  .chip-wrap:hover {
    border-color: rgb(94 234 212);
  }
  .chip-main {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.375rem 0.625rem;
    background: transparent;
    border: none;
    color: rgb(226 232 240);
    font-size: 0.75rem;
    cursor: pointer;
    border-radius: 9999px;
  }
  .swatch {
    display: inline-block;
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 9999px;
    border: 1px solid rgb(71 85 105);
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
    color: rgb(148 163 184);
    cursor: pointer;
    border-radius: 9999px;
    font-size: 0.9rem;
    line-height: 1;
    padding: 0;
  }
  .trash:hover {
    background: rgb(127 29 29 / 0.4);
    color: rgb(254 226 226);
  }
  .save-btn {
    align-self: flex-start;
    padding: 0.25rem 0.625rem;
    font-size: 0.75rem;
    background: transparent;
    border: 1px dashed rgb(71 85 105);
    border-radius: 0.375rem;
    color: rgb(148 163 184);
    cursor: pointer;
  }
  .save-btn:hover {
    border-color: rgb(94 234 212);
    color: rgb(226 232 240);
  }
  .save-row {
    display: flex;
    gap: 0.375rem;
  }
  .save-row input {
    flex: 1;
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
    background: rgb(2 6 23 / 0.6);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.375rem;
    color: rgb(226 232 240);
  }
  .save-row input:focus {
    outline: none;
    border-color: rgb(59 130 246);
  }
  .btn {
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
    background: rgb(30 41 59);
    border: 1px solid rgb(51 65 85);
    color: rgb(226 232 240);
    font-size: 0.8125rem;
    cursor: pointer;
  }
  .btn-primary {
    background: rgb(37 99 235);
    border-color: rgb(37 99 235);
    color: white;
  }
</style>
