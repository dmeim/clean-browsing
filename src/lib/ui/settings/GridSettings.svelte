<script lang="ts">
  import { gridStore } from "$lib/grid/store.svelte.js";

  const isDense = $derived(gridStore.isDense);
</script>

<section class="panel">
  <header>
    <h3>Grid</h3>
    <p>Control the number of cells available for widget placement.</p>
  </header>

  <div class="group">
    <div class="group-title">Density</div>
    <div class="group-help">
      Dense mode doubles the grid to 48×32 for finer placement. Existing widgets are rescaled so the
      layout looks the same. Switching back halves them and re-packs any that would otherwise
      collide.
    </div>
    <div class="density-toggle">
      <button
        class="toggle-btn"
        class:active={!isDense}
        onclick={() => gridStore.setDenseGrid(false)}
      >
        Normal · 24×16
      </button>
      <button
        class="toggle-btn"
        class:active={isDense}
        onclick={() => gridStore.setDenseGrid(true)}
      >
        Dense · 48×32
      </button>
    </div>
  </div>
</section>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ui-btn-fg-strong);
  }
  header p {
    margin: 0.125rem 0 0;
    font-size: 0.8125rem;
    color: var(--ui-muted-fg);
  }
  .group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--ui-panel-bg);
    border: 1px solid var(--ui-panel-border);
    border-radius: 0.5rem;
  }
  .group-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ui-muted-fg);
  }
  .group-help {
    font-size: 0.8125rem;
    color: var(--ui-muted-fg);
    line-height: 1.4;
  }
  .density-toggle {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }
  .toggle-btn {
    padding: 0.375rem 0.875rem;
    border-radius: 0.375rem;
    background: var(--ui-subtle-bg);
    border: 1px solid var(--ui-panel-border);
    color: var(--ui-btn-fg);
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 120ms ease;
  }
  .toggle-btn:hover {
    background: var(--ui-subtle-bg-hover);
  }
  .toggle-btn.active {
    background: var(--ui-accent);
    border-color: var(--ui-accent);
    color: var(--ui-accent-fg);
  }
</style>
