<script lang="ts">
  import { uiStore } from "./uiStore.svelte.js";
  import { settingsStore } from "$lib/settings/store.svelte.js";

  const isDark = $derived(settingsStore.settings.theme === "dark");

  function toggleTheme() {
    settingsStore.setTheme(isDark ? "light" : "dark");
  }
</script>

<div class="toolbar">
  {#if uiStore.editMode}
    <button
      type="button"
      class="tb-btn tb-btn-accent"
      aria-label="Add widget"
      onclick={uiStore.openAddWidget}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M12 5 L12 19 M5 12 L19 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      </svg>
    </button>
  {/if}

  <button
    type="button"
    class="tb-btn"
    class:active={uiStore.editMode}
    aria-label="Toggle edit mode"
    aria-pressed={uiStore.editMode}
    onclick={uiStore.toggleEditMode}
  >
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M4 20 L4 16 L16 4 L20 8 L8 20 Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
        fill="none"
      />
    </svg>
  </button>

  <button
    type="button"
    class="tb-btn"
    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    title={isDark ? "Light mode" : "Dark mode"}
    onclick={toggleTheme}
  >
    {#if isDark}
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    {/if}
  </button>

  <button
    type="button"
    class="tb-btn"
    aria-label="Settings"
    onclick={uiStore.openSettings}
  >
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  </button>
</div>

<style>
  .toolbar {
    position: fixed;
    top: 1rem;
    right: 1rem;
    display: flex;
    gap: 0.5rem;
    z-index: 100;
  }

  .tb-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background: var(--ui-btn-bg);
    color: var(--ui-btn-fg);
    border: 1px solid var(--ui-btn-border);
    cursor: pointer;
    backdrop-filter: blur(12px);
    transition: background 120ms ease, color 120ms ease, transform 120ms ease;
  }

  .tb-btn:hover {
    background: var(--ui-btn-bg-hover);
    color: var(--ui-btn-fg-strong);
  }

  .tb-btn:active {
    transform: scale(0.95);
  }

  .tb-btn.active {
    background: var(--brand-blue);
    color: var(--ui-accent-fg);
    border-color: var(--brand-blue);
  }

  .tb-btn-accent {
    background: var(--brand-green);
    color: var(--ui-accent-fg);
    border-color: var(--brand-green);
  }

  .tb-btn-accent:hover {
    background: #a8d6af;
    color: var(--ui-accent-fg);
  }
</style>
