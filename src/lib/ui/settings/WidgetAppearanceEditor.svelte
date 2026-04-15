<script lang="ts">
  import type { BorderStyle, WidgetDefaults } from "$lib/settings/types.js";
  import { isBackgroundTranslucent } from "$lib/widgets/style/resolve.js";
  import BackgroundEditor from "./BackgroundEditor.svelte";

  export type SectionKey = "colors" | "background" | "border" | "glow" | "shadow" | "effects";

  type Props = {
    value: WidgetDefaults;
    /** Section keys currently overridden (parent-supplied; only meaningful in override mode). */
    overriddenSections?: Set<SectionKey>;
    /** Called when the user clicks "Reset" on a section header. */
    onResetSection?: (section: SectionKey) => void;
  };

  let { value = $bindable(), overriddenSections, onResetSection }: Props = $props();

  const BORDER_STYLES: BorderStyle[] = ["solid", "dashed", "dotted", "none"];

  let openSections = $state<Record<SectionKey, boolean>>({
    colors: true,
    background: true,
    border: true,
    glow: false,
    shadow: false,
    effects: true,
  });

  function toggleSection(key: SectionKey) {
    openSections[key] = !openSections[key];
  }

  function isOverridden(key: SectionKey): boolean {
    return overriddenSections?.has(key) ?? false;
  }

  function handleReset(key: SectionKey, event: MouseEvent) {
    event.stopPropagation();
    onResetSection?.(key);
  }

  const blurHint = $derived(
    value.backdropBlur > 0 && !isBackgroundTranslucent(value)
      ? "Backdrop blur is only visible when the background is translucent."
      : null,
  );
</script>

{#snippet sectionHeader(key: SectionKey, title: string)}
  <div class="section-header" class:open={openSections[key]}>
    <button
      type="button"
      class="section-toggle"
      onclick={() => toggleSection(key)}
      aria-expanded={openSections[key]}
    >
      <span class="chev">{openSections[key] ? "▾" : "▸"}</span>
      <span class="section-title">{title}</span>
    </button>
    {#if isOverridden(key)}
      <span class="badge">custom</span>
      {#if onResetSection}
        <button
          type="button"
          class="reset-btn"
          onclick={(e) => handleReset(key, e)}
          title="Reset to global default"
        >
          Reset
        </button>
      {/if}
    {/if}
  </div>
{/snippet}

<div class="editor">
  <!-- Colors -->
  <section class="group">
    {@render sectionHeader("colors", "Colors")}
    {#if openSections.colors}
      <div class="group-body">
        <div class="row2">
          <label class="field">
            <span>Text</span>
            <div class="color-row">
              <input type="color" bind:value={value.textColor} />
              <input type="text" bind:value={value.textColor} />
            </div>
          </label>
          <label class="field">
            <span>Accent</span>
            <div class="color-row">
              <input type="color" bind:value={value.accentColor} />
              <input type="text" bind:value={value.accentColor} />
            </div>
          </label>
        </div>
      </div>
    {/if}
  </section>

  <!-- Background -->
  <section class="group">
    {@render sectionHeader("background", "Background")}
    {#if openSections.background}
      <div class="group-body">
        <BackgroundEditor
          bind:value={value.background}
          solidOpacityHint="Overall background opacity is controlled below."
        />
        <label class="slider-label">
          <span>Background opacity: {value.backgroundOpacity}%</span>
          <input type="range" min="0" max="100" bind:value={value.backgroundOpacity} />
        </label>
      </div>
    {/if}
  </section>

  <!-- Border -->
  <section class="group">
    {@render sectionHeader("border", "Border")}
    {#if openSections.border}
      <div class="group-body">
        <label class="field">
          <span>Color</span>
          <div class="color-row">
            <input type="color" bind:value={value.border.color} />
            <input type="text" bind:value={value.border.color} />
          </div>
        </label>
        <label class="field">
          <span>Style</span>
          <select class="select" bind:value={value.border.style}>
            {#each BORDER_STYLES as s (s)}
              <option value={s}>{s}</option>
            {/each}
          </select>
        </label>
        <label class="slider-label">
          <span>Thickness: {value.border.width}px</span>
          <input type="range" min="0" max="8" bind:value={value.border.width} />
        </label>
        <label class="slider-label">
          <span>Radius: {value.border.radius}px</span>
          <input type="range" min="0" max="48" bind:value={value.border.radius} />
        </label>
      </div>
    {/if}
  </section>

  <!-- Glow -->
  <section class="group">
    {@render sectionHeader("glow", "Glow")}
    {#if openSections.glow}
      <div class="group-body">
        <label class="field">
          <span>Color</span>
          <div class="color-row">
            <input type="color" bind:value={value.glow.color} />
            <input type="text" bind:value={value.glow.color} />
          </div>
        </label>
        <label class="slider-label">
          <span>Intensity: {value.glow.intensity}</span>
          <input type="range" min="0" max="100" bind:value={value.glow.intensity} />
        </label>
      </div>
    {/if}
  </section>

  <!-- Shadow -->
  <section class="group">
    {@render sectionHeader("shadow", "Shadow")}
    {#if openSections.shadow}
      <div class="group-body">
        <label class="field">
          <span>Color</span>
          <div class="color-row">
            <input type="color" bind:value={value.shadow.color} />
            <input type="text" bind:value={value.shadow.color} />
          </div>
        </label>
        <label class="slider-label">
          <span>Intensity: {value.shadow.intensity}</span>
          <input type="range" min="0" max="100" bind:value={value.shadow.intensity} />
        </label>
        <div class="row2">
          <label class="slider-label">
            <span>Offset X: {value.shadow.offsetX}px</span>
            <input type="range" min="-24" max="24" bind:value={value.shadow.offsetX} />
          </label>
          <label class="slider-label">
            <span>Offset Y: {value.shadow.offsetY}px</span>
            <input type="range" min="-24" max="24" bind:value={value.shadow.offsetY} />
          </label>
        </div>
      </div>
    {/if}
  </section>

  <!-- Effects -->
  <section class="group">
    {@render sectionHeader("effects", "Effects")}
    {#if openSections.effects}
      <div class="group-body">
        <label class="slider-label">
          <span>Backdrop blur: {value.backdropBlur}px</span>
          <input type="range" min="0" max="32" bind:value={value.backdropBlur} />
        </label>
        {#if blurHint}
          <p class="hint">{blurHint}</p>
        {/if}
        <label class="slider-label">
          <span
            >Widget opacity: {value.opacity}%
            <span class="subtle">(fades the whole tile including contents)</span></span
          >
          <input type="range" min="0" max="100" bind:value={value.opacity} />
        </label>
      </div>
    {/if}
  </section>
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .group {
    background: var(--ui-panel-bg);
    border: 1px solid var(--ui-panel-border);
    border-radius: 0.5rem;
    overflow: hidden;
  }
  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.5rem 0 0;
  }
  .section-header:hover {
    background: var(--ui-subtle-bg);
  }
  .section-toggle {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 0.75rem;
    background: transparent;
    border: none;
    color: var(--ui-fg);
    font-size: 0.8125rem;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
  .section-title {
    flex: 1;
  }
  .chev {
    display: inline-block;
    width: 0.875rem;
    color: var(--ui-muted-fg);
    font-size: 0.75rem;
  }
  .badge {
    font-size: 0.625rem;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    border-radius: 9999px;
    background: var(--ui-badge-bg);
    color: var(--ui-badge-fg);
    border: 1px solid var(--ui-badge-border);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .reset-btn {
    font-size: 0.6875rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    background: var(--ui-subtle-bg);
    border: 1px solid var(--ui-border-soft);
    color: var(--ui-btn-fg);
    cursor: pointer;
  }
  .reset-btn:hover {
    background: var(--ui-subtle-bg-hover);
  }
  .group-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0 0.75rem 0.75rem;
  }
  .row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: var(--ui-muted-fg);
  }
  .color-row {
    display: flex;
    gap: 0.375rem;
    align-items: center;
  }
  .color-row input[type="color"] {
    width: 2rem;
    height: 1.75rem;
    border: 1px solid var(--ui-panel-border);
    border-radius: 0.375rem;
    background: transparent;
    cursor: pointer;
    padding: 0;
  }
  .color-row input[type="text"] {
    flex: 1;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-family: ui-monospace, Menlo, monospace;
    background: var(--ui-input-bg);
    border: 1px solid var(--ui-panel-border);
    border-radius: 0.375rem;
    color: var(--ui-fg);
  }
  .color-row input[type="text"]:focus {
    outline: none;
    border-color: var(--ui-focus);
  }
  .select {
    padding: 0.375rem 0.5rem;
    background: var(--ui-input-bg);
    border: 1px solid var(--ui-panel-border);
    border-radius: 0.375rem;
    color: var(--ui-fg);
    font-size: 0.8125rem;
  }
  .slider-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: var(--ui-btn-fg);
  }
  .slider-label input[type="range"] {
    width: 100%;
    accent-color: var(--ui-focus);
  }
  .subtle {
    color: var(--ui-subtle-fg);
    font-weight: 400;
  }
  .hint {
    margin: 0;
    font-size: 0.6875rem;
    color: var(--ui-badge-fg);
  }
</style>
