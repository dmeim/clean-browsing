<script lang="ts">
  import { onMount } from "svelte";
  import { gridStore } from "./store.svelte.js";
  import { uiStore } from "$lib/ui/uiStore.svelte.js";
  import GridItem from "./GridItem.svelte";

  onMount(() => {
    void gridStore.load();
  });

  const gridStyle = $derived(
    `grid-template-columns: repeat(${gridStore.layout.cols}, 1fr); ` +
    `grid-template-rows: repeat(${gridStore.layout.rows}, 1fr);`
  );

  const cellCount = $derived(gridStore.layout.cols * gridStore.layout.rows);
</script>

<div class="grid-root" style={gridStyle}>
  {#if uiStore.editMode}
    <div class="grid-overlay" style={gridStyle} aria-hidden="true">
      {#each Array(cellCount) as _, i (i)}
        <div class="grid-overlay-cell"></div>
      {/each}
    </div>
  {/if}
  {#if gridStore.loaded}
    {#each gridStore.layout.instances as instance (instance.instanceId)}
      <GridItem {instance} />
    {/each}
  {/if}
</div>

<style>
  .grid-root {
    position: relative;
    display: grid;
    width: 100%;
    height: 100vh;
    padding: 1rem;
    gap: 0.5rem;
    box-sizing: border-box;
  }

  .grid-overlay {
    position: absolute;
    inset: 1rem;
    display: grid;
    gap: 0.35rem;
    pointer-events: none;
    z-index: 0;
  }

  .grid-overlay-cell {
    outline: 2px solid rgb(148 163 184 / 0.45);
    border-radius: 0px;
  }
</style>
