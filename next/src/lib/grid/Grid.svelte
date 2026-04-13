<script lang="ts">
  import { onMount } from "svelte";
  import { gridStore } from "./store.svelte.js";
  import GridItem from "./GridItem.svelte";

  onMount(() => {
    void gridStore.load();
  });

  const gridStyle = $derived(
    `grid-template-columns: repeat(${gridStore.layout.cols}, 1fr); ` +
    `grid-template-rows: repeat(${gridStore.layout.rows}, 1fr);`
  );
</script>

<div class="grid-root" style={gridStyle}>
  {#if gridStore.loaded}
    {#each gridStore.layout.instances as instance (instance.instanceId)}
      <GridItem {instance} />
    {/each}
  {/if}
</div>

<style>
  .grid-root {
    display: grid;
    width: 100%;
    height: 100vh;
    padding: 1rem;
    gap: 0.5rem;
    box-sizing: border-box;
  }
</style>
