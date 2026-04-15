<script lang="ts">
  import { settingsStore } from "$lib/settings/store.svelte.js";
  import BackgroundEditor from "./BackgroundEditor.svelte";

  const theme = $derived(settingsStore.settings.theme);
</script>

<section class="panel">
  <header>
    <h3>Appearance</h3>
    <p>Theme and page background.</p>
  </header>

  <div class="group">
    <div class="group-title">Theme</div>
    <div class="theme-toggle">
      <button
        class="toggle-btn"
        class:active={theme === "light"}
        onclick={() => settingsStore.setTheme("light")}
      >
        Light
      </button>
      <button
        class="toggle-btn"
        class:active={theme === "dark"}
        onclick={() => settingsStore.setTheme("dark")}
      >
        Dark
      </button>
    </div>
  </div>

  <div class="group">
    <BackgroundEditor bind:value={settingsStore.settings.background} />
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
  .theme-toggle {
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
