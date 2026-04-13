<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { gridStore } from "$lib/grid/store.svelte.js";
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

  function handleOpenChange(next: boolean) {
    if (!next) uiStore.closeWidgetSettings();
  }

  function handleUpdate(nextSettings: unknown) {
    if (!instance) return;
    gridStore.updateWidgetSettings(instance.instanceId, nextSettings);
  }
</script>

<Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
  <Dialog.Content class="bg-slate-900 border-slate-700 text-slate-100">
    <Dialog.Header>
      <Dialog.Title class="text-slate-100">
        {def ? `${def.name} settings` : "Widget settings"}
      </Dialog.Title>
      {#if def?.description}
        <Dialog.Description class="text-slate-400">
          {def.description}
        </Dialog.Description>
      {/if}
    </Dialog.Header>

    <div class="py-4">
      {#if instance && def?.settingsComponent}
        {@const SettingsForm = def.settingsComponent}
        <SettingsForm settings={instance.settings} updateSettings={handleUpdate} />
      {:else if instance}
        <p class="text-sm text-slate-400">
          This widget has no configurable settings.
        </p>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
