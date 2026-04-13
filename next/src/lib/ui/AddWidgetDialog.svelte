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

<Dialog.Root
  open={uiStore.addWidgetOpen}
  onOpenChange={(v) => uiStore.setAddWidgetOpen(v)}
>
  <Dialog.Content class="bg-slate-900 border-slate-700 text-slate-100">
    <Dialog.Header>
      <Dialog.Title class="text-slate-100">Add widget</Dialog.Title>
      <Dialog.Description class="text-slate-400">
        Pick a widget to drop onto the grid.
      </Dialog.Description>
    </Dialog.Header>

    <div class="grid grid-cols-2 gap-3 py-4">
      {#each widgets as widget (widget.id)}
        <button
          type="button"
          class="widget-card"
          onclick={() => handleAdd(widget.id)}
        >
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
        <div class="col-span-2 text-slate-500 text-sm text-center py-4">
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
    background: rgb(15 23 42 / 0.6);
    border: 1px solid rgb(51 65 85);
    color: rgb(241 245 249);
    cursor: pointer;
    transition: background 120ms ease, border-color 120ms ease;
  }

  .widget-card:hover {
    background: rgb(30 41 59 / 0.9);
    border-color: rgb(96 165 250);
  }

  .widget-card-name {
    font-weight: 600;
    font-size: 0.9rem;
  }

  .widget-card-desc {
    font-size: 0.75rem;
    color: rgb(148 163 184);
    margin-top: 0.15rem;
  }

  .widget-card-size {
    font-size: 0.7rem;
    color: rgb(100 116 139);
    margin-top: 0.4rem;
    font-variant-numeric: tabular-nums;
  }
</style>
