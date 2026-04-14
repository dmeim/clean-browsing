<script lang="ts">
  import type { BackgroundSettings, BackgroundType } from "$lib/settings/types.js";
  import { imageLibrary } from "$lib/storage/imageLibrary.svelte.js";
  import ImageAdjustments, {
    type ImageAdjustmentValue,
  } from "$lib/ui/common/ImageAdjustments.svelte";

  type Props = {
    value: BackgroundSettings;
    /**
     * Subset of background types to expose. Defaults to all four. Pass a
     * narrower list when embedding inside a widget appearance editor where
     * e.g. "url" might not make sense.
     */
    types?: BackgroundType[];
    /** When true, the solid variant shows a "no opacity" hint — used when
     *  the parent container supplies its own global opacity. */
    solidOpacityHint?: string;
    /** When true, the gradient preset grid is hidden. */
    hidePresets?: boolean;
  };

  let {
    value = $bindable(),
    types = ["gradient", "solid", "image", "url"],
    solidOpacityHint,
    hidePresets = false,
  }: Props = $props();

  const BG_TYPE_LABELS: Record<BackgroundType, string> = {
    gradient: "Gradient",
    solid: "Solid",
    image: "Image upload",
    url: "Image URL",
  };

  const PRESETS: { name: string; angle: number; stops: string[] }[] = [
    { name: "Midnight", angle: 135, stops: ["#020617", "#0f172a", "#1e293b"] },
    { name: "Purple Dream", angle: 135, stops: ["#667eea", "#764ba2"] },
    { name: "Ocean", angle: 135, stops: ["#4facfe", "#00f2fe"] },
    { name: "Mint", angle: 135, stops: ["#43e97b", "#38f9d7"] },
    { name: "Sunset", angle: 135, stops: ["#fa709a", "#fee140"] },
    { name: "Peach", angle: 135, stops: ["#ff9a9e", "#fecfef"] },
    { name: "Emerald", angle: 135, stops: ["#11998e", "#38ef7d"] },
    { name: "Blood", angle: 135, stops: ["#8e0e00", "#1f1c18"] },
  ];

  let fileInput: HTMLInputElement | null = $state(null);
  let uploadError = $state("");
  let showPicker = $state(false);

  const selectedImage = $derived(imageLibrary.get(value.image.imageId));

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function setType(t: BackgroundType) {
    value.type = t;
  }

  function setGradientStop(index: number, color: string) {
    value.gradient.stops[index] = color;
  }

  function addStop() {
    if (value.gradient.stops.length < 5) value.gradient.stops.push("#ffffff");
  }

  function removeStop(index: number) {
    if (value.gradient.stops.length > 2) value.gradient.stops.splice(index, 1);
  }

  function applyPreset(preset: typeof PRESETS[number]) {
    value.type = "gradient";
    value.gradient.angle = preset.angle;
    value.gradient.stops = [...preset.stops];
  }

  async function onImageUpload(event: Event) {
    uploadError = "";
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      uploadError = "File must be an image.";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      uploadError = "Image must be under 8 MB.";
      return;
    }
    try {
      const stored = await imageLibrary.addFromFile(file);
      value.type = "image";
      value.image.imageId = stored.id;
      value.image.dataUrl = null;
    } catch {
      uploadError = "Failed to read file.";
    }
    input.value = "";
  }

  function selectLibraryImage(id: string) {
    value.type = "image";
    value.image.imageId = id;
    value.image.dataUrl = null;
    showPicker = false;
  }

  function clearImage() {
    value.image.imageId = null;
    value.image.dataUrl = null;
  }

  const imageAdjustmentValue = $derived<ImageAdjustmentValue>({
    fit: value.image.fit,
    positionX: value.image.positionX,
    positionY: value.image.positionY,
    opacity: value.image.opacity,
    padding: 0,
  });

  function applyImageAdjustments(next: ImageAdjustmentValue) {
    value.image.fit = next.fit;
    value.image.positionX = next.positionX;
    value.image.positionY = next.positionY;
    value.image.opacity = next.opacity;
  }

  const imagePreviewUrl = $derived(
    selectedImage?.dataUrl ?? value.image.dataUrl ?? null
  );

  const urlAdjustmentValue = $derived<ImageAdjustmentValue>({
    fit: value.url.fit,
    positionX: value.url.positionX,
    positionY: value.url.positionY,
    opacity: value.url.opacity,
    padding: 0,
  });

  function applyUrlAdjustments(next: ImageAdjustmentValue) {
    value.url.fit = next.fit;
    value.url.positionX = next.positionX;
    value.url.positionY = next.positionY;
    value.url.opacity = next.opacity;
  }
</script>

<div class="bg-editor">
  <div class="group-title">Background type</div>
  <div class="type-row">
    {#each types as t}
      <button
        class="toggle-btn"
        class:active={value.type === t}
        type="button"
        onclick={() => setType(t)}
      >
        {BG_TYPE_LABELS[t]}
      </button>
    {/each}
  </div>

  {#if value.type === "gradient"}
    <div class="group-title">Gradient stops</div>
    <div class="stops">
      {#each value.gradient.stops as stop, i (i)}
        <div class="stop">
          <input
            type="color"
            value={stop}
            oninput={(e) => setGradientStop(i, (e.currentTarget as HTMLInputElement).value)}
          />
          <input
            type="text"
            value={stop}
            oninput={(e) => setGradientStop(i, (e.currentTarget as HTMLInputElement).value)}
          />
          {#if value.gradient.stops.length > 2}
            <button class="icon-btn" type="button" title="Remove stop" onclick={() => removeStop(i)}>×</button>
          {/if}
        </div>
      {/each}
    </div>
    {#if value.gradient.stops.length < 5}
      <button class="btn" type="button" onclick={addStop}>+ Add stop</button>
    {/if}

    <label class="slider-label">
      <span>Angle: {value.gradient.angle}°</span>
      <input
        type="range"
        min="0"
        max="360"
        bind:value={value.gradient.angle}
      />
    </label>

    {#if !hidePresets}
      <div class="group-title">Presets</div>
      <div class="presets">
        {#each PRESETS as preset}
          <button
            class="preset"
            type="button"
            title={preset.name}
            style="background: linear-gradient({preset.angle}deg, {preset.stops.join(', ')});"
            onclick={() => applyPreset(preset)}
            aria-label={preset.name}
          ></button>
        {/each}
      </div>
    {/if}
  {/if}

  {#if value.type === "solid"}
    <div class="group-title">Solid color</div>
    <div class="stop">
      <input type="color" bind:value={value.solid} />
      <input type="text" bind:value={value.solid} />
    </div>
    {#if solidOpacityHint}
      <p class="hint">{solidOpacityHint}</p>
    {/if}
  {/if}

  {#if value.type === "image"}
    <div class="group-title">Image</div>
    <div class="row">
      <button class="btn" type="button" onclick={() => (showPicker = !showPicker)}>
        {showPicker ? "Hide library" : "Pick from library"}
      </button>
      <button class="btn btn-primary" type="button" onclick={() => fileInput?.click()}>Upload new</button>
      {#if selectedImage || value.image.dataUrl}
        <button class="btn" type="button" onclick={clearImage}>Remove</button>
      {/if}
      <input
        bind:this={fileInput}
        type="file"
        accept="image/*"
        onchange={onImageUpload}
        hidden
      />
    </div>
    {#if uploadError}
      <p class="status err">{uploadError}</p>
    {/if}

    {#if showPicker}
      <div class="library">
        {#if imageLibrary.images.length === 0}
          <div class="lib-empty">Library is empty. Upload an image to get started.</div>
        {:else}
          <div class="lib-grid">
            {#each imageLibrary.images as img (img.id)}
              <button
                class="lib-item"
                type="button"
                class:selected={img.id === value.image.imageId}
                title="{img.name} · {formatBytes(img.bytes)}"
                onclick={() => selectLibraryImage(img.id)}
              >
                <img src={img.dataUrl} alt={img.name} />
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    {#if selectedImage}
      <div class="meta">{selectedImage.name} · {formatBytes(selectedImage.bytes)}</div>
    {:else if value.image.dataUrl}
      <div class="meta meta-warn">Legacy image (not in library)</div>
    {/if}

    {#if imagePreviewUrl}
      <ImageAdjustments
        value={imageAdjustmentValue}
        onChange={applyImageAdjustments}
        previewUrl={imagePreviewUrl}
      />
    {/if}
  {/if}

  {#if value.type === "url"}
    <div class="group-title">Image URL</div>
    <input
      class="text-input"
      type="url"
      placeholder="https://example.com/photo.jpg"
      bind:value={value.url.href}
    />
    {#if value.url.href}
      <ImageAdjustments
        value={urlAdjustmentValue}
        onChange={applyUrlAdjustments}
        previewUrl={value.url.href}
      />
    {/if}
  {/if}
</div>

<style>
  .bg-editor {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .group-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ui-muted-fg);
  }
  .type-row {
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
  .stops {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  .stop {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .stop input[type="color"] {
    width: 2.5rem;
    height: 2rem;
    border: 1px solid var(--ui-panel-border);
    border-radius: 0.375rem;
    background: transparent;
    cursor: pointer;
  }
  .stop input[type="text"],
  .text-input {
    flex: 1;
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
    font-family: ui-monospace, Menlo, monospace;
    background: var(--ui-input-bg);
    border: 1px solid var(--ui-panel-border);
    border-radius: 0.375rem;
    color: var(--ui-fg);
  }
  .text-input {
    font-family: inherit;
  }
  .stop input[type="text"]:focus,
  .text-input:focus {
    outline: none;
    border-color: var(--ui-focus);
  }
  .icon-btn {
    width: 1.75rem;
    height: 1.75rem;
    display: grid;
    place-items: center;
    border-radius: 0.375rem;
    background: transparent;
    border: 1px solid var(--ui-panel-border);
    color: var(--ui-muted-fg);
    cursor: pointer;
  }
  .icon-btn:hover {
    background: var(--ui-danger-bg);
    border-color: var(--ui-danger-border);
    color: var(--ui-danger-fg);
  }
  .slider-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8125rem;
    color: var(--ui-btn-fg);
  }
  .slider-label input[type="range"] {
    width: 100%;
    accent-color: var(--ui-focus);
  }
  .presets {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }
  .preset {
    height: 2.5rem;
    border-radius: 0.375rem;
    border: 1px solid var(--ui-panel-border);
    cursor: pointer;
    transition: transform 120ms ease;
  }
  .preset:hover {
    transform: scale(1.03);
    border-color: var(--ui-muted-fg);
  }
  .row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .btn {
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
    background: var(--ui-subtle-bg);
    border: 1px solid var(--ui-panel-border);
    color: var(--ui-fg);
    font-size: 0.8125rem;
    cursor: pointer;
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
  }
  .status {
    margin: 0;
    font-size: 0.8125rem;
  }
  .status.err {
    color: var(--ui-error);
  }
  .hint {
    margin: 0;
    font-size: 0.75rem;
    color: var(--ui-muted-fg);
  }
  .meta {
    font-size: 0.75rem;
    color: var(--ui-muted-fg);
  }
  .meta-warn {
    color: var(--ui-warning);
  }
  .library {
    padding: 0.5rem;
    background: var(--ui-inset-bg);
    border: 1px solid var(--ui-panel-border);
    border-radius: 0.375rem;
  }
  .lib-empty {
    padding: 0.5rem;
    text-align: center;
    font-size: 0.75rem;
    color: var(--ui-muted-fg);
  }
  .lib-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: 0.375rem;
    max-height: 12rem;
    overflow-y: auto;
  }
  .lib-item {
    padding: 0;
    aspect-ratio: 1;
    border: 1px solid var(--ui-panel-border);
    border-radius: 0.375rem;
    background: var(--ui-deep-bg);
    cursor: pointer;
    overflow: hidden;
    transition: border-color 120ms ease, transform 120ms ease;
  }
  .lib-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .lib-item:hover {
    border-color: var(--ui-muted-fg);
    transform: scale(1.02);
  }
  .lib-item.selected {
    border-color: var(--ui-focus);
    box-shadow: 0 0 0 1px var(--ui-focus);
  }
</style>
