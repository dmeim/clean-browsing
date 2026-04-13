<script lang="ts">
  import "$lib/widgets/index.js";
  import Grid from "$lib/grid/Grid.svelte";
  import Toolbar from "$lib/ui/Toolbar.svelte";
  import SettingsDialog from "$lib/ui/SettingsDialog.svelte";
  import AddWidgetDialog from "$lib/ui/AddWidgetDialog.svelte";
  import WidgetSettingsDialog from "$lib/ui/WidgetSettingsDialog.svelte";
  import { uiStore } from "$lib/ui/uiStore.svelte.js";

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

<main class="shell">
  <Grid />
  <Toolbar />
  <SettingsDialog />
  <AddWidgetDialog />
  <WidgetSettingsDialog />
</main>

<style>
  .shell {
    min-height: 100vh;
    background: linear-gradient(135deg, rgb(2 6 23), rgb(15 23 42), rgb(30 41 59));
    color: rgb(241 245 249);
  }
</style>
