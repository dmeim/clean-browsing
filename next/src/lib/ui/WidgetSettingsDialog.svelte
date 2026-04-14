<script lang="ts">
  import { untrack } from "svelte";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { gridStore } from "$lib/grid/store.svelte.js";
  import { imageLibrary } from "$lib/storage/imageLibrary.svelte.js";
  import { getWidget } from "$lib/widgets/registry.js";
  import { settingsStore } from "$lib/settings/store.svelte.js";
  import {
    diffAgainst,
    resolveWidgetStyle,
  } from "$lib/widgets/style/resolve.js";
  import type { WidgetDefaults, WidgetStylePreset } from "$lib/settings/types.js";
  import type { WidgetStyleOverrides } from "$lib/widgets/types.js";
  import WidgetAppearanceEditor from "./settings/WidgetAppearanceEditor.svelte";
  import WidgetPreviewTile from "./settings/WidgetPreviewTile.svelte";
  import WidgetPresetBar from "./settings/WidgetPresetBar.svelte";
  import { uiStore } from "./uiStore.svelte.js";

  const instance = $derived(
    uiStore.widgetSettingsInstanceId
      ? gridStore.layout.instances.find(
          (i) => i.instanceId === uiStore.widgetSettingsInstanceId
        )
      : undefined
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
        workingStyle = structuredClone(
          resolveWidgetStyle(
            settingsStore.settings.widgetDefaults,
            instance.styleOverrides
          )
        ) as WidgetDefaults;
      }
    });
  });

  // Diff workingStyle against globals and stamp into the instance's
  // styleOverrides on every edit. Runs only while the dialog is open and
  // a working buffer exists.
  $effect(() => {
    if (!isOpen || !workingStyle || !instance) return;
    // Track every nested field by snapshotting.
    const snap = $state.snapshot(workingStyle) as WidgetDefaults;
    untrack(() => {
      const baseSnap = $state.snapshot(
        settingsStore.settings.widgetDefaults
      ) as WidgetDefaults;
      const diff = diffAgainst(baseSnap, snap) as WidgetStyleOverrides | undefined;
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
    workingStyle = structuredClone(
      settingsStore.settings.widgetDefaults
    ) as WidgetDefaults;
  }

  function applyPreset(preset: WidgetStylePreset) {
    workingStyle = structuredClone(preset.style) as WidgetDefaults;
  }

  const hasOverrides = $derived(!!instance?.styleOverrides && Object.keys(instance.styleOverrides).length > 0);
</script>

<Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
  <Dialog.Content
    class="bg-slate-900 border-slate-700 text-slate-100 !p-0 !gap-0 flex flex-col !max-h-[min(90vh,680px)]"
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
        <p class="text-sm text-slate-400">
          This widget has no configurable settings beyond appearance.
        </p>
      {/if}
    </div>

    <div class="footer">
      <button class="btn" onclick={handleCancel}>Cancel</button>
      <button class="btn btn-primary" onclick={handleSave}>Save</button>
    </div>
  </Dialog.Content>
</Dialog.Root>

<style>
  .header {
    padding: 1rem 1.25rem 0.75rem;
    border-bottom: 1px solid rgb(51 65 85);
  }
  :global(.title) {
    font-size: 1.0625rem !important;
    font-weight: 600 !important;
    color: rgb(241 245 249) !important;
    margin: 0 !important;
  }
  :global(.description) {
    font-size: 0.8125rem !important;
    color: rgb(148 163 184) !important;
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
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
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
    color: rgb(226 232 240);
    font-size: 0.875rem;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
  .appearance-header:hover {
    background: rgb(30 41 59 / 0.5);
  }
  .chev {
    display: inline-block;
    width: 0.875rem;
    color: rgb(148 163 184);
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
    background: rgb(234 179 8 / 0.2);
    color: rgb(253 224 71);
    border: 1px solid rgb(234 179 8 / 0.4);
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
    background: rgb(30 41 59);
    border: 1px solid rgb(71 85 105);
    border-radius: 0.375rem;
    color: rgb(226 232 240);
    cursor: pointer;
  }
  .reset-all:hover {
    background: rgb(51 65 85);
  }
  .footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-top: 1px solid rgb(51 65 85);
    background: rgb(2 6 23 / 0.4);
  }
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    background: rgb(30 41 59);
    border: 1px solid rgb(51 65 85);
    color: rgb(226 232 240);
    font-size: 0.8125rem;
    cursor: pointer;
  }
  .btn:hover {
    background: rgb(51 65 85);
  }
  .btn-primary {
    background: rgb(37 99 235);
    border-color: rgb(37 99 235);
    color: white;
  }
  .btn-primary:hover {
    background: rgb(29 78 216);
  }
</style>
