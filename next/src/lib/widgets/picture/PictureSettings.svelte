<script lang="ts">
  import type { WidgetSettingsProps } from "$lib/widgets/types.js";
  import type { PictureFit, PictureSettings } from "./definition.js";
  import { imageLibrary } from "$lib/storage/imageLibrary.svelte.js";

  let { settings, updateSettings }: WidgetSettingsProps<PictureSettings> = $props();

  const MAX_BYTES = 5 * 1024 * 1024;

  let errorMsg = $state<string | null>(null);
  let fileInputEl: HTMLInputElement | null = $state(null);
  let showPicker = $state(false);

  const selectedImage = $derived(imageLibrary.get(settings.imageId));
  const previewDataUrl = $derived(selectedImage?.dataUrl ?? settings.imageDataUrl ?? "");
  const hasImage = $derived(!!previewDataUrl);

  function set<K extends keyof PictureSettings>(key: K, value: PictureSettings[K]) {
    updateSettings({ ...settings, [key]: value });
  }

  function selectFromLibrary(id: string) {
    updateSettings({ ...settings, imageId: id, imageDataUrl: "" });
    showPicker = false;
  }

  async function handleFile(file: File | null | undefined) {
    errorMsg = null;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      errorMsg = "Please select an image file.";
      return;
    }
    if (file.size > MAX_BYTES) {
      errorMsg = "Image is too large (5 MB max).";
      return;
    }
    try {
      const stored = await imageLibrary.addFromFile(file);
      updateSettings({ ...settings, imageId: stored.id, imageDataUrl: "" });
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : "Failed to read image.";
    }
  }

  function handleFileChange(event: Event) {
    const files = (event.currentTarget as HTMLInputElement).files;
    void handleFile(files?.[0]);
    if (fileInputEl) fileInputEl.value = "";
  }

  function triggerUpload() {
    fileInputEl?.click();
  }

  function clearImage() {
    updateSettings({ ...settings, imageId: "", imageDataUrl: "" });
  }

  function handleRangeInput(event: Event, key: keyof PictureSettings) {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    set(key, value as never);
  }

  function handleFitChange(event: Event) {
    set("fit", (event.currentTarget as HTMLSelectElement).value as PictureFit);
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
</script>

<div class="form">
  <div class="section">
    <div class="label">Image</div>

    {#if hasImage}
      <div class="preview-frame">
        <img class="preview" src={previewDataUrl} alt="" />
      </div>
      {#if selectedImage}
        <div class="meta">{selectedImage.name} · {formatBytes(selectedImage.bytes)}</div>
      {:else}
        <div class="meta meta-warn">Legacy image (not in library)</div>
      {/if}
    {:else}
      <div class="empty">No image selected.</div>
    {/if}

    <div class="button-row">
      <button type="button" class="btn" onclick={() => (showPicker = !showPicker)}>
        {showPicker ? "Hide library" : "Pick from library"}
      </button>
      <button type="button" class="btn" onclick={triggerUpload}>Upload new</button>
      {#if hasImage}
        <button type="button" class="btn btn-danger" onclick={clearImage}>Clear</button>
      {/if}
    </div>

    <input
      bind:this={fileInputEl}
      type="file"
      accept="image/*"
      class="hidden"
      onchange={handleFileChange}
    />

    {#if errorMsg}
      <div class="error">{errorMsg}</div>
    {/if}

    {#if showPicker}
      <div class="library">
        {#if imageLibrary.images.length === 0}
          <div class="lib-empty">Library is empty. Upload an image to get started.</div>
        {:else}
          <div class="lib-grid">
            {#each imageLibrary.images as img (img.id)}
              <button
                type="button"
                class="lib-item"
                class:selected={img.id === settings.imageId}
                title="{img.name} · {formatBytes(img.bytes)}"
                onclick={() => selectFromLibrary(img.id)}
              >
                <img src={img.dataUrl} alt={img.name} />
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <div class="section">
    <label for="pic-fit" class="label">Image fit</label>
    <select id="pic-fit" class="select" value={settings.fit} onchange={handleFitChange}>
      <option value="cover">Cover — fill frame, may crop</option>
      <option value="contain">Contain — fit inside, letterbox</option>
      <option value="fill">Fill — stretch to fit</option>
      <option value="none">None — original size</option>
    </select>
  </div>

  <div class="section">
    <label for="pic-opacity" class="label-row">
      <span class="label">Opacity</span>
      <span class="value">{settings.opacity}%</span>
    </label>
    <input
      id="pic-opacity"
      type="range"
      min="10"
      max="100"
      step="5"
      value={settings.opacity}
      oninput={(e) => handleRangeInput(e, "opacity")}
    />
  </div>

  <div class="section">
    <label for="pic-padding" class="label-row">
      <span class="label">Padding</span>
      <span class="value">{settings.padding}px</span>
    </label>
    <input
      id="pic-padding"
      type="range"
      min="0"
      max="30"
      step="1"
      value={settings.padding}
      oninput={(e) => handleRangeInput(e, "padding")}
    />
  </div>

  <div class="section">
    <div class="label">Image position</div>
    <div class="grid-2">
      <div>
        <div class="label-row small">
          <span>Horizontal</span>
          <span class="value">{settings.positionX}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={settings.positionX}
          oninput={(e) => handleRangeInput(e, "positionX")}
        />
      </div>
      <div>
        <div class="label-row small">
          <span>Vertical</span>
          <span class="value">{settings.positionY}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={settings.positionY}
          oninput={(e) => handleRangeInput(e, "positionY")}
        />
      </div>
    </div>
    <div class="hint-small">Choose which part of the image shows in the frame.</div>
  </div>
</div>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }
  .section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .label {
    font-size: 0.8rem;
    color: rgb(148 163 184);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
  }
  .label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .label-row.small {
    font-size: 0.75rem;
    color: rgb(148 163 184);
  }
  .value {
    font-size: 0.75rem;
    color: rgb(203 213 225);
    font-variant-numeric: tabular-nums;
  }
  .preview-frame {
    padding: 0;
    background: rgb(2 6 23 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.5rem;
    overflow: hidden;
    max-height: 12rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .preview {
    width: 100%;
    max-height: 12rem;
    object-fit: contain;
    display: block;
  }
  .meta {
    font-size: 0.72rem;
    color: rgb(148 163 184);
  }
  .meta-warn {
    color: rgb(250 204 21);
  }
  .empty {
    padding: 1rem;
    text-align: center;
    font-size: 0.8rem;
    color: rgb(148 163 184);
    border: 1px dashed rgb(71 85 105);
    border-radius: 0.5rem;
  }
  .hidden {
    display: none;
  }
  .hint-small {
    font-size: 0.7rem;
    color: rgb(100 116 139);
  }
  .error {
    font-size: 0.75rem;
    color: rgb(252 165 165);
    background: rgb(239 68 68 / 0.12);
    border: 1px solid rgb(239 68 68 / 0.4);
    padding: 0.4rem 0.6rem;
    border-radius: 0.375rem;
  }
  .button-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .btn {
    padding: 0.4rem 0.75rem;
    border-radius: 0.375rem;
    background: rgb(30 41 59);
    border: 1px solid rgb(71 85 105);
    color: rgb(226 232 240);
    font-size: 0.8rem;
    cursor: pointer;
  }
  .btn:hover {
    background: rgb(51 65 85);
  }
  .btn-danger {
    background: rgb(127 29 29 / 0.6);
    border-color: rgb(185 28 28);
    color: rgb(254 202 202);
  }
  .btn-danger:hover {
    background: rgb(185 28 28 / 0.7);
  }
  .select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: rgb(2 6 23 / 0.7);
    border: 1px solid rgb(71 85 105);
    color: rgb(241 245 249);
    font-size: 0.9rem;
  }
  .select:focus {
    outline: none;
    border-color: rgb(59 130 246);
  }
  input[type="range"] {
    width: 100%;
    accent-color: rgb(59 130 246);
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  .library {
    padding: 0.5rem;
    background: rgb(2 6 23 / 0.4);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.5rem;
  }
  .lib-empty {
    padding: 0.5rem;
    text-align: center;
    font-size: 0.75rem;
    color: rgb(148 163 184);
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
    border: 1px solid rgb(51 65 85);
    border-radius: 0.375rem;
    background: rgb(2 6 23);
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
    border-color: rgb(148 163 184);
    transform: scale(1.02);
  }
  .lib-item.selected {
    border-color: rgb(59 130 246);
    box-shadow: 0 0 0 1px rgb(59 130 246);
  }
</style>
