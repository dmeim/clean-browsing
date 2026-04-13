<script lang="ts">
  import type { WidgetSettingsProps } from "$lib/widgets/types.js";
  import type { PictureFit, PictureSettings } from "./definition.js";

  let { settings, updateSettings }: WidgetSettingsProps<PictureSettings> = $props();

  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB upload limit

  let errorMsg = $state<string | null>(null);
  let isDragging = $state(false);
  let fileInputEl: HTMLInputElement;

  function set<K extends keyof PictureSettings>(key: K, value: PictureSettings[K]) {
    updateSettings({ ...settings, [key]: value });
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
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
      const dataUrl = await fileToDataUrl(file);
      set("imageDataUrl", dataUrl);
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : "Failed to read image.";
    }
  }

  function handleFileChange(event: Event) {
    const files = (event.currentTarget as HTMLInputElement).files;
    void handleFile(files?.[0]);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
    void handleFile(event.dataTransfer?.files?.[0]);
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  function triggerUpload() {
    fileInputEl?.click();
  }

  function clearImage() {
    set("imageDataUrl", "");
    if (fileInputEl) fileInputEl.value = "";
  }

  function handleRangeInput(event: Event, key: keyof PictureSettings) {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    set(key, value as never);
  }

  function handleFitChange(event: Event) {
    set("fit", (event.currentTarget as HTMLSelectElement).value as PictureFit);
  }
</script>

<div class="form">
  <div class="section">
    <div class="label">Image</div>
    <div
      class="dropzone"
      class:dragging={isDragging}
      class:has-image={!!settings.imageDataUrl}
      role="button"
      tabindex="0"
      onclick={triggerUpload}
      onkeydown={(e) => (e.key === "Enter" || e.key === " ") && triggerUpload()}
      ondrop={handleDrop}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
    >
      {#if settings.imageDataUrl}
        <img class="preview" src={settings.imageDataUrl} alt="" />
      {:else}
        <div class="dropzone-inner">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m17 8-5-5-5 5" />
            <path d="M12 3v12" />
          </svg>
          <div>Click or drop an image here</div>
          <div class="hint-small">PNG, JPG, WebP, GIF · max 5 MB</div>
        </div>
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

    {#if settings.imageDataUrl}
      <div class="button-row">
        <button type="button" class="btn" onclick={triggerUpload}>Replace</button>
        <button type="button" class="btn btn-danger" onclick={clearImage}>Clear</button>
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

  .dropzone {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 10rem;
    padding: 0.75rem;
    background: rgb(2 6 23 / 0.5);
    border: 2px dashed rgb(71 85 105);
    border-radius: 0.5rem;
    color: rgb(148 163 184);
    cursor: pointer;
    transition: border-color 120ms ease, background 120ms ease;
    overflow: hidden;
  }

  .dropzone:hover,
  .dropzone:focus-visible,
  .dropzone.dragging {
    border-color: rgb(59 130 246);
    background: rgb(15 23 42 / 0.8);
    outline: none;
  }

  .dropzone.has-image {
    padding: 0;
    border-style: solid;
    border-color: rgb(51 65 85);
  }

  .dropzone-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
  }

  .preview {
    width: 100%;
    max-height: 12rem;
    object-fit: contain;
    display: block;
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
  }

  .btn {
    flex: 1;
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
</style>
