<script lang="ts">
  import "$lib/widgets/index.js";
  import Grid from "$lib/grid/Grid.svelte";
  import Toolbar from "$lib/ui/Toolbar.svelte";
  import SettingsDialog from "$lib/ui/SettingsDialog.svelte";
  import AddWidgetDialog from "$lib/ui/AddWidgetDialog.svelte";
  import WidgetSettingsDialog from "$lib/ui/WidgetSettingsDialog.svelte";
  import { uiStore } from "$lib/ui/uiStore.svelte.js";
  import { settingsStore, buildBackgroundCss } from "$lib/settings/store.svelte.js";
  import { imageLibrary } from "$lib/storage/imageLibrary.svelte.js";

  void settingsStore.load();
  void imageLibrary.load();

  const resolvedBackground = $derived(
    buildBackgroundCss(
      settingsStore.settings.background,
      (id) => imageLibrary.get(id)?.dataUrl ?? null,
    ),
  );

  const backgroundOpacity = $derived.by(() => {
    const bg = settingsStore.settings.background;
    if (bg.type === "image") return bg.image.opacity / 100;
    if (bg.type === "url") return bg.url.opacity / 100;
    return 1;
  });

  $effect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && uiStore.editMode) {
        uiStore.exitEditMode();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
</script>

<div
  class="app-background"
  style:background={resolvedBackground}
  style:opacity={backgroundOpacity}
  aria-hidden="true"
></div>

<main class="shell">
  <Grid />
  <Toolbar />
  <SettingsDialog />
  <AddWidgetDialog />
  <WidgetSettingsDialog />
</main>

<style>
  .app-background {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }

  .shell {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    color: var(--ui-page-fg);
  }

  :global(html) {
    min-height: 100%;
    background: var(--ui-page-bg);
  }

  :global(body) {
    min-height: 100vh;
    margin: 0;
    background: transparent;
  }
</style>
