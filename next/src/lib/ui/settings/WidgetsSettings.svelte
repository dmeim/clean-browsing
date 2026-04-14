<script lang="ts">
  import { settingsStore } from "$lib/settings/store.svelte.js";
  import type { WidgetStylePreset } from "$lib/settings/types.js";
  import WidgetAppearanceEditor from "./WidgetAppearanceEditor.svelte";
  import WidgetPreviewTile from "./WidgetPreviewTile.svelte";
  import WidgetPresetBar from "./WidgetPresetBar.svelte";

  function applyPreset(preset: WidgetStylePreset) {
    settingsStore.applyPresetToDefaults(preset);
  }
</script>

<section class="panel">
  <header>
    <h3>Widgets</h3>
    <p>Global appearance defaults applied to every widget. Override individual widgets from their own settings.</p>
  </header>

  <WidgetPresetBar onApply={applyPreset} />

  <WidgetPreviewTile style={settingsStore.settings.widgetDefaults} label="Live preview" />

  <WidgetAppearanceEditor bind:value={settingsStore.settings.widgetDefaults} />
</section>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
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
</style>
