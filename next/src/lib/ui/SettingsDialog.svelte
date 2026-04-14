<script lang="ts">
  import { untrack } from "svelte";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { uiStore } from "./uiStore.svelte.js";
  import { settingsStore } from "$lib/settings/store.svelte.js";
  import { imageLibrary } from "$lib/storage/imageLibrary.svelte.js";
  import { gridStore } from "$lib/grid/store.svelte.js";
  import ConfigurationSettings from "./settings/ConfigurationSettings.svelte";
  import AppearanceSettings from "./settings/AppearanceSettings.svelte";
  import WidgetsSettings from "./settings/WidgetsSettings.svelte";
  import StorageSettings from "./settings/StorageSettings.svelte";

  type TabId = "configuration" | "appearance" | "widgets" | "storage";

  const TABS: { id: TabId; label: string; icon: string }[] = [
    {
      id: "configuration",
      label: "Configuration",
      icon: "M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36-1.41 1.41M7.05 16.95l-1.41 1.41m12.72 0-1.41-1.41M7.05 7.05 5.64 5.64M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: "M12 3a9 9 0 1 0 9 9c0-1.66-3-2-3-4s2.34-1 2-3c-.37-2.2-4-5-8-5z M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M12 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M16 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    },
    {
      id: "widgets",
      label: "Widgets",
      icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    },
    {
      id: "storage",
      label: "Storage",
      icon: "M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z M4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7 M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5",
    },
  ];

  let active = $state<TabId>("configuration");
  let committed = false;

  $effect(() => {
    const isOpen = uiStore.settingsOpen;
    if (!isOpen) return;
    untrack(() => {
      settingsStore.beginEdit();
      imageLibrary.beginEdit();
      gridStore.beginEdit();
      committed = false;
      active = "configuration";
    });
  });

  async function handleSave() {
    committed = true;
    await Promise.all([
      settingsStore.commitEdit(),
      imageLibrary.commitEdit(),
      gridStore.commitEdit(),
    ]);
    uiStore.setSettingsOpen(false);
  }

  function handleCancel() {
    if (!committed) {
      settingsStore.cancelEdit();
      imageLibrary.cancelEdit();
      gridStore.cancelEdit();
    }
    committed = false;
    uiStore.setSettingsOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      uiStore.setSettingsOpen(true);
      return;
    }
    handleCancel();
  }
</script>

<Dialog.Root open={uiStore.settingsOpen} onOpenChange={handleOpenChange}>
  <Dialog.Content
    class="!max-w-4xl !w-[calc(100vw-2rem)] !p-0 !gap-0 bg-background border-border text-foreground overflow-hidden flex flex-col !max-h-[min(90vh,760px)] !h-[min(90vh,760px)]"
  >
    <div class="header">
      <Dialog.Title class="title">Settings</Dialog.Title>
      <Dialog.Description class="description">
        Configure global preferences, appearance, and storage.
      </Dialog.Description>
    </div>

    <div class="layout">
      <nav class="tablist" aria-label="Settings sections">
        {#each TABS as tab}
          <button
            class="tab"
            class:active={active === tab.id}
            onclick={() => (active = tab.id)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d={tab.icon} />
            </svg>
            <span>{tab.label}</span>
          </button>
        {/each}
      </nav>

      <div class="content">
        {#if active === "configuration"}
          <ConfigurationSettings />
        {:else if active === "appearance"}
          <AppearanceSettings />
        {:else if active === "widgets"}
          <WidgetsSettings />
        {:else if active === "storage"}
          <StorageSettings />
        {/if}
      </div>
    </div>

    <div class="footer">
      <button class="btn" onclick={handleCancel}>Cancel</button>
      <button class="btn btn-primary" onclick={handleSave}>Save</button>
    </div>
  </Dialog.Content>
</Dialog.Root>

<style>
  .header {
    padding: 1rem 1.25rem 0.75rem;
    border-bottom: 1px solid var(--ui-panel-border);
  }
  :global(.title) {
    font-size: 1.0625rem !important;
    font-weight: 600 !important;
    color: var(--ui-btn-fg-strong) !important;
    margin: 0 !important;
  }
  :global(.description) {
    font-size: 0.8125rem !important;
    color: var(--ui-muted-fg) !important;
    margin-top: 0.125rem !important;
  }

  .layout {
    display: grid;
    grid-template-columns: 190px 1fr;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .tablist {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.75rem 0.5rem;
    background: var(--ui-inset-bg);
    border-right: 1px solid var(--ui-panel-border);
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid transparent;
    background: transparent;
    color: var(--ui-muted-fg);
    font-size: 0.8125rem;
    text-align: left;
    cursor: pointer;
    transition: all 120ms ease;
  }
  .tab svg {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }
  .tab:hover {
    background: var(--ui-subtle-bg);
    color: var(--ui-fg);
  }
  .tab.active {
    background: var(--ui-accent-soft-bg);
    border-color: var(--ui-accent-soft-border);
    color: var(--ui-accent-soft-fg);
  }

  .content {
    padding: 1rem 1.25rem 1.25rem;
    overflow-y: auto;
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--ui-panel-border);
    background: var(--ui-inset-bg);
  }
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    background: var(--ui-subtle-bg);
    border: 1px solid var(--ui-panel-border);
    color: var(--ui-fg);
    font-size: 0.8125rem;
    cursor: pointer;
    transition: background 120ms ease, border-color 120ms ease;
  }
  .btn:hover {
    background: var(--ui-subtle-bg-hover);
  }
  .btn-primary {
    background: var(--ui-accent);
    border-color: var(--ui-accent);
    color: var(--ui-accent-fg);
  }
  .btn-primary:hover {
    background: var(--ui-accent-hover);
    border-color: var(--ui-accent-hover);
  }

  @media (max-width: 640px) {
    .layout {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
    }
    .tablist {
      flex-direction: row;
      overflow-x: auto;
      border-right: none;
      border-bottom: 1px solid var(--ui-panel-border);
    }
    .tab {
      flex-shrink: 0;
    }
  }
</style>
