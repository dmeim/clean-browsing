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
    color: rgb(241 245 249);
  }
  header p {
    margin: 0.125rem 0 0;
    font-size: 0.8125rem;
    color: rgb(148 163 184);
  }
  .group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.5rem;
  }
  .group-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgb(148 163 184);
  }
  .theme-toggle {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }
  .toggle-btn {
    padding: 0.375rem 0.875rem;
    border-radius: 0.375rem;
    background: rgb(30 41 59);
    border: 1px solid rgb(51 65 85);
    color: rgb(203 213 225);
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 120ms ease;
  }
  .toggle-btn:hover {
    background: rgb(51 65 85);
  }
  .toggle-btn.active {
    background: rgb(37 99 235);
    border-color: rgb(37 99 235);
    color: white;
  }
</style>
