<script lang="ts">
  import { untrack } from "svelte";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { gridStore } from "$lib/grid/store.svelte.js";
  import { imageLibrary } from "$lib/storage/imageLibrary.svelte.js";
  import { getWidget } from "$lib/widgets/registry.js";
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

  $effect(() => {
    const open = isOpen;
    if (!open) return;
    untrack(() => {
      gridStore.beginEdit();
      imageLibrary.beginEdit();
      committed = false;
    });
  });

  async function handleSave() {
    committed = true;
    await Promise.all([gridStore.commitEdit(), imageLibrary.commitEdit()]);
    uiStore.closeWidgetSettings();
  }

  function handleCancel() {
    if (!committed) {
      gridStore.cancelEdit();
      imageLibrary.cancelEdit();
    }
    committed = false;
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
      {#if instance && def?.settingsComponent}
        {@const SettingsForm = def.settingsComponent}
        <SettingsForm settings={instance.settings} updateSettings={handleUpdate} />
      {:else if instance}
        <p class="text-sm text-slate-400">
          This widget has no configurable settings.
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
