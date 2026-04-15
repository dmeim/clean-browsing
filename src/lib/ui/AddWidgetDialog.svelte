<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { listWidgets } from "$lib/widgets/registry.js";
  import { gridStore } from "$lib/grid/store.svelte.js";
  import { uiStore } from "./uiStore.svelte.js";

  const widgets = $derived(listWidgets());

  function handleAdd(widgetId: string) {
    const ok = gridStore.addWidgetAuto(widgetId);
    if (!ok) {
      console.warn(`[add-widget] no free slot for "${widgetId}"`);
      return;
    }
    uiStore.setAddWidgetOpen(false);
  }
</script>

<Dialog.Root open={uiStore.addWidgetOpen} onOpenChange={(v) => uiStore.setAddWidgetOpen(v)}>
  <Dialog.Content class="bg-background border-border text-foreground">
    <Dialog.Header>
      <Dialog.Title>Add widget</Dialog.Title>
      <Dialog.Description>Pick a widget to drop onto the grid.</Dialog.Description>
    </Dialog.Header>

    <div class="grid grid-cols-2 gap-3 py-4">
      {#each widgets as widget (widget.id)}
        <button type="button" class="widget-card" onclick={() => handleAdd(widget.id)}>
          <div class="widget-card-name">{widget.name}</div>
          {#if widget.description}
            <div class="widget-card-desc">{widget.description}</div>
          {/if}
          <div class="widget-card-size">
            {widget.defaultSize.w} × {widget.defaultSize.h}
          </div>
        </button>
      {/each}

      {#if widgets.length === 0}
        <div class="col-span-2 py-4 text-center text-sm" style="color: var(--ui-subtle-fg);">
          No widgets registered yet.
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>

<style>
  .widget-card {
    text-align: left;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    background: var(--ui-panel-bg);
    border: 1px solid var(--ui-panel-border);
    color: var(--ui-btn-fg-strong);
    cursor: pointer;
    transition:
      background 120ms ease,
      border-color 120ms ease;
  }

  .widget-card:hover {
    background: var(--ui-subtle-bg);
    border-color: var(--ui-focus);
  }

  .widget-card-name {
    font-weight: 600;
    font-size: 0.9rem;
  }

  .widget-card-desc {
    font-size: 0.75rem;
    color: var(--ui-muted-fg);
    margin-top: 0.15rem;
  }

  .widget-card-size {
    font-size: 0.7rem;
    color: var(--ui-subtle-fg);
    margin-top: 0.4rem;
    font-variant-numeric: tabular-nums;
  }
</style>
