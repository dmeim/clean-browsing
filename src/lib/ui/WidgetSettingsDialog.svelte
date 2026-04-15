<script lang="ts">
  import { untrack } from "svelte";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { gridStore } from "$lib/grid/store.svelte.js";
  import { imageLibrary } from "$lib/storage/imageLibrary.svelte.js";
  import { getWidget } from "$lib/widgets/registry.js";
  import { settingsStore } from "$lib/settings/store.svelte.js";
  import { diffAgainst, resolveWidgetStyle } from "$lib/widgets/style/resolve.js";
  import type { WidgetDefaults, WidgetStylePreset } from "$lib/settings/types.js";
  import type { WidgetStyleOverrides } from "$lib/widgets/types.js";
  import WidgetAppearanceEditor from "./settings/WidgetAppearanceEditor.svelte";
  import WidgetPreviewTile from "./settings/WidgetPreviewTile.svelte";
  import WidgetPresetBar from "./settings/WidgetPresetBar.svelte";
  import { uiStore } from "./uiStore.svelte.js";

  const instance = $derived(
    uiStore.widgetSettingsInstanceId
      ? gridStore.layout.instances.find((i) => i.instanceId === uiStore.widgetSettingsInstanceId)
      : undefined,
  );

  const def = $derived(instance ? getWidget(instance.widgetId) : undefined);
  const isOpen = $derived(uiStore.widgetSettingsInstanceId !== null);

  let committed = false;
  let appearanceOpen = $state(false);
  let workingStyle = $state<WidgetDefaults | null>(null);

  $effect(() => {
    const open = isOpen;
    if (!open) return;
    untrack(() => {
      gridStore.beginEdit();
      imageLibrary.beginEdit();
      committed = false;
      appearanceOpen = false;
      if (instance) {
        // $state.snapshot unwraps Svelte 5 reactive proxies to plain objects.
        // structuredClone would throw "Proxy object could not be cloned" in
        // Firefox when resolveWidgetStyle returns the raw defaults proxy (which
        // happens whenever the instance has no styleOverrides yet).
        const resolved = resolveWidgetStyle(
          settingsStore.settings.widgetDefaults,
          instance.styleOverrides,
        );
        workingStyle = $state.snapshot(resolved) as WidgetDefaults;
      }
    });
  });

  // Diff workingStyle against globals and stamp into the instance's
  // styleOverrides on every edit. Runs only while the dialog is open and
  // a working buffer exists. Skips redundant writes so repeated no-op runs
  // can't trigger downstream reactivity cascades.
  $effect(() => {
    if (!isOpen || !workingStyle || !instance) return;
    // Track every nested field by snapshotting.
    const snap = $state.snapshot(workingStyle) as WidgetDefaults;
    untrack(() => {
      const baseSnap = $state.snapshot(settingsStore.settings.widgetDefaults) as WidgetDefaults;
      const diff = diffAgainst(baseSnap, snap) as WidgetStyleOverrides | undefined;
      const currentOverrides = instance.styleOverrides;
      const nextJson = JSON.stringify(diff ?? null);
      const currentJson = JSON.stringify(currentOverrides ?? null);
      if (nextJson === currentJson) return;
      if (!diff || Object.keys(diff).length === 0) {
        if (instance.styleOverrides) {
          gridStore.clearAllStyleOverrides(instance.instanceId);
        }
      } else {
        instance.styleOverrides = diff;
      }
    });
  });

  async function handleSave() {
    committed = true;
    await Promise.all([gridStore.commitEdit(), imageLibrary.commitEdit()]);
    workingStyle = null;
    uiStore.closeWidgetSettings();
  }

  function handleCancel() {
    if (!committed) {
      gridStore.cancelEdit();
      imageLibrary.cancelEdit();
    }
    committed = false;
    workingStyle = null;
    uiStore.closeWidgetSettings();
  }

  function handleOpenChange(next: boolean) {
    if (next) return;
    handleCancel();
  }

  function handleUpdate(nextSettings: unknown) {
    if (!instance) return;
    gridStore.updateWidgetSettings(instance.instanceId, nextSettings);
  }

  function resetOverrides() {
    if (!instance) return;
    workingStyle = $state.snapshot(settingsStore.settings.widgetDefaults) as WidgetDefaults;
  }

  function applyPreset(preset: WidgetStylePreset) {
    workingStyle = $state.snapshot(preset.style) as WidgetDefaults;
  }

  const hasOverrides = $derived(
    !!instance?.styleOverrides && Object.keys(instance.styleOverrides).length > 0,
  );
</script>

<Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
  <Dialog.Content
    class="bg-background border-border text-foreground flex !max-h-[min(90vh,680px)] flex-col !gap-0 !p-0"
  >
    <div class="header">
      <Dialog.Title class="title">
        {def ? `${def.name} settings` : "Widget settings"}
      </Dialog.Title>
      {#if def?.description}
        <Dialog.Description class="description">
          {def.description}
        </Dialog.Description>
      {/if}
    </div>

    <div class="body">
      {#if instance && workingStyle}
        <section class="appearance-section">
          <button
            type="button"
            class="appearance-header"
            class:open={appearanceOpen}
            onclick={() => (appearanceOpen = !appearanceOpen)}
          >
            <span class="chev">{appearanceOpen ? "▾" : "▸"}</span>
            <span class="title-text">Appearance</span>
            {#if hasOverrides}
              <span class="badge">custom</span>
            {/if}
          </button>

          {#if appearanceOpen}
            <div class="appearance-body">
              <WidgetPresetBar onApply={applyPreset} allowSave={false} />
              <WidgetPreviewTile style={workingStyle} label="Preview" />
              {#if hasOverrides}
                <button type="button" class="reset-all" onclick={resetOverrides}>
                  Reset to global defaults
                </button>
              {/if}
              <WidgetAppearanceEditor bind:value={workingStyle} />
            </div>
          {/if}
        </section>
      {/if}

      {#if instance && def?.settingsComponent}
        {@const SettingsForm = def.settingsComponent}
        <SettingsForm settings={instance.settings} updateSettings={handleUpdate} />
      {:else if instance && !def?.settingsComponent}
        <p class="text-sm" style="color: var(--ui-muted-fg);">
          This widget has no configurable settings beyond appearance.
        </p>
      {/if}
    </div>

    <div class="footer">
      <button type="button" class="btn" onclick={handleCancel}>Cancel</button>
      <button type="button" class="btn btn-primary" onclick={handleSave}>Save</button>
    </div>
  </Dialog.Content>
</Dialog.Root>

<style>
  .header {
    padding: 1rem 1.25rem 0.75rem;
    border-bottom: 1px solid var(--ui-panel-border);
  }
  :global(.title) {
    font-size: 1.0625rem !important;
    font-weight: 600 !important;
    color: var(--ui-btn-fg-strong) !important;
    margin: 0 !important;
  }
  :global(.description) {
    font-size: 0.8125rem !important;
    color: var(--ui-muted-fg) !important;
    margin-top: 0.125rem !important;
  }
  .body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 1rem 1.25rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .appearance-section {
    background: var(--ui-panel-bg);
    border: 1px solid var(--ui-panel-border);
    border-radius: 0.5rem;
    overflow: hidden;
  }
  .appearance-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem 0.875rem;
    background: transparent;
    border: none;
    color: var(--ui-fg);
    font-size: 0.875rem;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
  .appearance-header:hover {
    background: var(--ui-subtle-bg);
  }
  .chev {
    display: inline-block;
    width: 0.875rem;
    color: var(--ui-muted-fg);
    font-size: 0.75rem;
  }
  .title-text {
    flex: 1;
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
  .appearance-body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0 0.75rem 0.875rem;
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
  .footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--ui-panel-border);
    background: var(--ui-inset-bg);
  }
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    background: var(--ui-subtle-bg);
    border: 1px solid var(--ui-panel-border);
    color: var(--ui-fg);
    font-size: 0.8125rem;
    cursor: pointer;
  }
  .btn:hover {
    background: var(--ui-subtle-bg-hover);
  }
  .btn-primary {
    background: var(--ui-accent);
    border-color: var(--ui-accent);
    color: var(--ui-accent-fg);
  }
  .btn-primary:hover {
    background: var(--ui-accent-hover);
  }
</style>
