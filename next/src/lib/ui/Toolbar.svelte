<script lang="ts">
  import { uiStore } from "./uiStore.svelte.js";
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
    background: rgb(15 23 42 / 0.7);
    color: rgb(203 213 225);
    border: 1px solid rgb(51 65 85 / 0.6);
    cursor: pointer;
    backdrop-filter: blur(12px);
    transition: background 120ms ease, color 120ms ease, transform 120ms ease;
  }

  .tb-btn:hover {
    background: rgb(30 41 59 / 0.9);
    color: rgb(241 245 249);
  }

  .tb-btn:active {
    transform: scale(0.95);
  }

  .tb-btn.active {
    background: rgb(59 130 246 / 0.85);
    color: white;
    border-color: rgb(96 165 250);
  }

  .tb-btn-accent {
    background: rgb(34 197 94 / 0.85);
    color: white;
    border-color: rgb(74 222 128);
  }

  .tb-btn-accent:hover {
    background: rgb(22 163 74 / 0.95);
    color: white;
  }
</style>
