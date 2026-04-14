<script lang="ts">
  import type { WidgetDefaults } from "$lib/settings/types.js";
  import { imageLibrary } from "$lib/storage/imageLibrary.svelte.js";
  import { widgetStyleToInlineStyle } from "$lib/widgets/style/resolve.js";

  type Props = {
    style: WidgetDefaults;
    label?: string;
  };

  let { style, label = "Preview" }: Props = $props();

  const vars = $derived(
    widgetStyleToInlineStyle(style, (id) => imageLibrary.get(id)?.dataUrl ?? null)
  );
</script>

<div class="preview-wrap">
  <div class="label">{label}</div>
  <div class="preview-host">
    <div class="widget-card preview-card" style={vars}>
      <div class="preview-inner">
        <div class="primary">42</div>
        <div class="secondary">Primary value</div>
        <div class="caption">Secondary label</div>
      </div>
    </div>
  </div>
</div>

<style>
  .preview-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  .label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ui-muted-fg);
  }
  .preview-host {
    padding: 1rem;
    background: var(--ui-page-bg);
    border: 1px solid var(--ui-panel-border);
    border-radius: 0.5rem;
    display: grid;
    place-items: center;
  }
  .preview-card {
    width: 260px;
    height: 140px;
  }
  .preview-inner {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.75rem;
    text-align: center;
  }
  .primary {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
    color: var(--widget-accent, rgb(241 245 249));
    font-variant-numeric: tabular-nums;
  }
  .secondary {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--widget-accent, rgb(241 245 249));
  }
  .caption {
    font-size: 0.75rem;
    color: var(--widget-text, rgb(148 163 184));
  }
</style>
