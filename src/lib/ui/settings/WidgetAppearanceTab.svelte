<script lang="ts">
  import type { WidgetSettingsTabProps } from "$lib/widgets/types.js";
  import type { WidgetDefaults, WidgetStylePreset } from "$lib/settings/types.js";
  import WidgetAppearanceEditor from "./WidgetAppearanceEditor.svelte";
  import WidgetPresetBar from "./WidgetPresetBar.svelte";
  import WidgetPreviewTile from "./WidgetPreviewTile.svelte";
  import PaddingControl from "./PaddingControl.svelte";

  // This tab is generic over any widget's settings shape. TypeScript
  // generics are invariant, so widening to `any` lets every widget's
  // definition drop this component into its settingsTabs array without
  // casting. Widgets that don't define paddingV/paddingH (like Picture,
  // which uses a single inner image padding) get a tab without the
  // padding section.
  // TypeScript generics are invariant, so widening to `any` lets every
  // widget's definition drop this component into its settingsTabs array
  // without a cast. The paddedSettings derived below narrows safely for
  // internal use.
  let {
    settings,
    updateSettings,
    workingStyle = $bindable(),
    setWorkingStyle,
    hasOverrides,
    resetOverrides,
  }: WidgetSettingsTabProps<any> = $props();

  const paddedSettings = $derived(settings as { paddingV?: number; paddingH?: number });
  const showPadding = $derived(
    paddedSettings.paddingV !== undefined || paddedSettings.paddingH !== undefined,
  );
  const padV = $derived(paddedSettings.paddingV ?? 0);
  const padH = $derived(paddedSettings.paddingH ?? 0);

  function applyPreset(preset: WidgetStylePreset) {
    setWorkingStyle($state.snapshot(preset.style) as WidgetDefaults);
  }
</script>

<div class="tab-body">
  {#if showPadding}
    <section class="group">
      <h3 class="group-title">Padding</h3>
      <PaddingControl
        paddingV={padV}
        paddingH={padH}
        onChange={(p) =>
          updateSettings({ ...settings, paddingV: p.paddingV, paddingH: p.paddingH })}
      />
    </section>
  {/if}

  <section class="group">
    <label class="row disabled-row" title="Coming soon">
      <span class="row-label">Inherit global appearance</span>
      <input type="checkbox" checked disabled />
    </label>
    <p class="hint">
      When disabled in a future release, this widget will use its own appearance overrides instead
      of the global defaults.
    </p>
  </section>

  {#if workingStyle}
    <section class="group">
      <h3 class="group-title">
        Widget appearance
        {#if hasOverrides}
          <span class="badge">custom</span>
        {/if}
      </h3>
      <WidgetPresetBar onApply={applyPreset} allowSave={false} />
      <WidgetPreviewTile style={workingStyle} label="Preview" />
      {#if hasOverrides}
        <button type="button" class="reset-all" onclick={resetOverrides}>
          Reset to global defaults
        </button>
      {/if}
      <WidgetAppearanceEditor bind:value={workingStyle} />
    </section>
  {/if}
</div>

<style>
  .tab-body {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .group-title {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ui-muted-fg);
    display: flex;
    align-items: center;
    gap: 0.5rem;
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

  .row.disabled-row {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .row-label {
    font-size: 0.875rem;
    color: rgb(226 232 240);
  }

  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    accent-color: rgb(59 130 246);
  }

  .hint {
    margin: 0.25rem 0 0;
    font-size: 0.7rem;
    color: rgb(148 163 184);
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

  .reset-all {
    align-self: flex-start;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    background: var(--ui-subtle-bg);
    border: 1px solid var(--ui-border-soft);
    border-radius: 0.375rem;
    color: var(--ui-fg);
    cursor: pointer;
  }

  .reset-all:hover {
    background: var(--ui-subtle-bg-hover);
  }
</style>
