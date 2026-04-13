<script lang="ts">
  import type { WidgetProps } from "$lib/widgets/types.js";
  import type { PictureSettings } from "./definition.js";
  import { imageLibrary } from "$lib/storage/imageLibrary.svelte.js";

  let { settings }: WidgetProps<PictureSettings> = $props();

  const resolvedDataUrl = $derived(
    imageLibrary.get(settings.imageId)?.dataUrl ?? settings.imageDataUrl ?? ""
  );
  const hasImage = $derived(!!resolvedDataUrl);

  const imgStyle = $derived(
    `object-fit: ${settings.fit}; ` +
    `object-position: ${settings.positionX}% ${settings.positionY}%; ` +
    `opacity: ${settings.opacity / 100};`
  );

  const innerStyle = $derived(`inset: ${settings.padding}px;`);
</script>

<div class="picture">
  <div class="inner" style={innerStyle}>
    {#if hasImage}
      <img class="image" src={resolvedDataUrl} alt="" style={imgStyle} />
    {:else}
      <div class="placeholder">
        <div class="placeholder-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>
        <div class="placeholder-text">No image — open settings to add one</div>
      </div>
    {/if}
  </div>
</div>

<style>
  .picture {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 0.75rem;
    overflow: hidden;
    background: rgb(15 23 42 / 0.6);
    border: 1px solid rgb(51 65 85 / 0.5);
    backdrop-filter: blur(12px);
  }

  .inner {
    position: absolute;
    overflow: hidden;
    border-radius: inherit;
  }

  .image {
    width: 100%;
    height: 100%;
    display: block;
    transition: opacity 200ms ease;
  }

  .placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: rgb(148 163 184);
    background: rgb(2 6 23 / 0.35);
    border: 2px dashed rgb(71 85 105);
    border-radius: 0.5rem;
    padding: 0.75rem;
    text-align: center;
  }

  .placeholder-icon {
    color: rgb(100 116 139);
  }

  .placeholder-text {
    font-size: 0.75rem;
    line-height: 1.2;
  }
</style>
