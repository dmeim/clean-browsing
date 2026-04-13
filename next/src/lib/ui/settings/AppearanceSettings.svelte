<script lang="ts">
  import { settingsStore } from "$lib/settings/store.svelte.js";
  import { imageLibrary } from "$lib/storage/imageLibrary.svelte.js";
  import type { BackgroundType } from "$lib/settings/types.js";

  const bg = $derived(settingsStore.settings.background);
  const theme = $derived(settingsStore.settings.theme);
  const selectedImage = $derived(imageLibrary.get(bg.image.imageId));

  let fileInput: HTMLInputElement | null = $state(null);
  let uploadError = $state("");
  let showPicker = $state(false);

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const BG_TYPES: { value: BackgroundType; label: string }[] = [
    { value: "gradient", label: "Gradient" },
    { value: "solid", label: "Solid" },
    { value: "image", label: "Image upload" },
    { value: "url", label: "Image URL" },
  ];

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

  function setType(t: BackgroundType) {
    settingsStore.updateBackground((b) => {
      b.type = t;
    });
  }

  function setSolid(color: string) {
    settingsStore.updateBackground((b) => {
      b.solid = color;
    });
  }

  function setGradientStop(index: number, color: string) {
    settingsStore.updateBackground((b) => {
      b.gradient.stops[index] = color;
    });
  }

  function setAngle(value: number) {
    settingsStore.updateBackground((b) => {
      b.gradient.angle = value;
    });
  }

  function addStop() {
    settingsStore.updateBackground((b) => {
      if (b.gradient.stops.length < 5) b.gradient.stops.push("#ffffff");
    });
  }

  function removeStop(index: number) {
    settingsStore.updateBackground((b) => {
      if (b.gradient.stops.length > 2) b.gradient.stops.splice(index, 1);
    });
  }

  function applyPreset(preset: typeof PRESETS[number]) {
    settingsStore.updateBackground((b) => {
      b.type = "gradient";
      b.gradient.angle = preset.angle;
      b.gradient.stops = [...preset.stops];
    });
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
      settingsStore.updateBackground((b) => {
        b.type = "image";
        b.image.imageId = stored.id;
        b.image.dataUrl = null;
      });
    } catch {
      uploadError = "Failed to read file.";
    }
    input.value = "";
  }

  function selectLibraryImage(id: string) {
    settingsStore.updateBackground((b) => {
      b.type = "image";
      b.image.imageId = id;
      b.image.dataUrl = null;
    });
    showPicker = false;
  }

  function clearImage() {
    settingsStore.updateBackground((b) => {
      b.image.imageId = null;
      b.image.dataUrl = null;
    });
  }

  function setImageOpacity(value: number) {
    settingsStore.updateBackground((b) => {
      b.image.opacity = value;
    });
  }

  function setUrl(href: string) {
    settingsStore.updateBackground((b) => {
      b.url.href = href;
    });
  }

  function setUrlOpacity(value: number) {
    settingsStore.updateBackground((b) => {
      b.url.opacity = value;
    });
  }
</script>

<section class="panel">
  <header>
    <h3>Appearance</h3>
    <p>Theme and page background.</p>
  </header>

  <div class="group">
    <div class="group-title">Theme</div>
    <div class="theme-toggle">
      <button
        class="toggle-btn"
        class:active={theme === "light"}
        onclick={() => settingsStore.setTheme("light")}
      >
        Light
      </button>
      <button
        class="toggle-btn"
        class:active={theme === "dark"}
        onclick={() => settingsStore.setTheme("dark")}
      >
        Dark
      </button>
    </div>
  </div>

  <div class="group">
    <div class="group-title">Background type</div>
    <div class="type-row">
      {#each BG_TYPES as t}
        <button
          class="toggle-btn"
          class:active={bg.type === t.value}
          onclick={() => setType(t.value)}
        >
          {t.label}
        </button>
      {/each}
    </div>
  </div>

  {#if bg.type === "gradient"}
    <div class="group">
      <div class="group-title">Gradient stops</div>
      <div class="stops">
        {#each bg.gradient.stops as stop, i (i)}
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
            {#if bg.gradient.stops.length > 2}
              <button class="icon-btn" title="Remove stop" onclick={() => removeStop(i)}>×</button>
            {/if}
          </div>
        {/each}
      </div>
      {#if bg.gradient.stops.length < 5}
        <button class="btn" onclick={addStop}>+ Add stop</button>
      {/if}

      <label class="slider-label">
        <span>Angle: {bg.gradient.angle}°</span>
        <input
          type="range"
          min="0"
          max="360"
          value={bg.gradient.angle}
          oninput={(e) => setAngle(Number((e.currentTarget as HTMLInputElement).value))}
        />
      </label>

      <div class="group-title" style="margin-top: 0.5rem">Presets</div>
      <div class="presets">
        {#each PRESETS as preset}
          <button
            class="preset"
            title={preset.name}
            style="background: linear-gradient({preset.angle}deg, {preset.stops.join(', ')});"
            onclick={() => applyPreset(preset)}
          ></button>
        {/each}
      </div>
    </div>
  {/if}

  {#if bg.type === "solid"}
    <div class="group">
      <div class="group-title">Solid color</div>
      <div class="stop">
        <input
          type="color"
          value={bg.solid}
          oninput={(e) => setSolid((e.currentTarget as HTMLInputElement).value)}
        />
        <input
          type="text"
          value={bg.solid}
          oninput={(e) => setSolid((e.currentTarget as HTMLInputElement).value)}
        />
      </div>
    </div>
  {/if}

  {#if bg.type === "image"}
    <div class="group">
      <div class="group-title">Image</div>
      <div class="row">
        <button class="btn" onclick={() => (showPicker = !showPicker)}>
          {showPicker ? "Hide library" : "Pick from library"}
        </button>
        <button class="btn btn-primary" onclick={() => fileInput?.click()}>Upload new</button>
        {#if selectedImage || bg.image.dataUrl}
          <button class="btn" onclick={clearImage}>Remove</button>
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
                  class:selected={img.id === bg.image.imageId}
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
        <img class="preview" src={selectedImage.dataUrl} alt="Background preview" />
      {:else if bg.image.dataUrl}
        <div class="meta meta-warn">Legacy image (not in library)</div>
        <img class="preview" src={bg.image.dataUrl} alt="Background preview" />
      {/if}

      {#if selectedImage || bg.image.dataUrl}
        <label class="slider-label">
          <span>Opacity: {bg.image.opacity}%</span>
          <input
            type="range"
            min="0"
            max="100"
            value={bg.image.opacity}
            oninput={(e) => setImageOpacity(Number((e.currentTarget as HTMLInputElement).value))}
          />
        </label>
      {/if}
    </div>
  {/if}

  {#if bg.type === "url"}
    <div class="group">
      <div class="group-title">Image URL</div>
      <input
        class="text-input"
        type="url"
        placeholder="https://example.com/photo.jpg"
        value={bg.url.href}
        oninput={(e) => setUrl((e.currentTarget as HTMLInputElement).value)}
      />
      <label class="slider-label">
        <span>Opacity: {bg.url.opacity}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value={bg.url.opacity}
          oninput={(e) => setUrlOpacity(Number((e.currentTarget as HTMLInputElement).value))}
        />
      </label>
    </div>
  {/if}
</section>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
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
  .group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.5rem;
  }
  .group-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgb(148 163 184);
  }
  .theme-toggle,
  .type-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }
  .toggle-btn {
    padding: 0.375rem 0.875rem;
    border-radius: 0.375rem;
    background: rgb(30 41 59);
    border: 1px solid rgb(51 65 85);
    color: rgb(203 213 225);
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 120ms ease;
  }
  .toggle-btn:hover {
    background: rgb(51 65 85);
  }
  .toggle-btn.active {
    background: rgb(37 99 235);
    border-color: rgb(37 99 235);
    color: white;
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
    border: 1px solid rgb(51 65 85);
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
    background: rgb(2 6 23 / 0.6);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.375rem;
    color: rgb(226 232 240);
  }
  .text-input {
    font-family: inherit;
  }
  .stop input[type="text"]:focus,
  .text-input:focus {
    outline: none;
    border-color: rgb(59 130 246);
  }
  .icon-btn {
    width: 1.75rem;
    height: 1.75rem;
    display: grid;
    place-items: center;
    border-radius: 0.375rem;
    background: transparent;
    border: 1px solid rgb(51 65 85);
    color: rgb(148 163 184);
    cursor: pointer;
  }
  .icon-btn:hover {
    background: rgb(127 29 29 / 0.4);
    border-color: rgb(153 27 27);
    color: rgb(254 226 226);
  }
  .slider-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8125rem;
    color: rgb(203 213 225);
  }
  .slider-label input[type="range"] {
    width: 100%;
    accent-color: rgb(59 130 246);
  }
  .presets {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }
  .preset {
    height: 2.5rem;
    border-radius: 0.375rem;
    border: 1px solid rgb(51 65 85);
    cursor: pointer;
    transition: transform 120ms ease;
  }
  .preset:hover {
    transform: scale(1.03);
    border-color: rgb(148 163 184);
  }
  .preview {
    max-width: 100%;
    max-height: 8rem;
    object-fit: cover;
    border-radius: 0.375rem;
    border: 1px solid rgb(51 65 85);
  }
  .row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .btn {
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
    background: rgb(30 41 59);
    border: 1px solid rgb(51 65 85);
    color: rgb(226 232 240);
    font-size: 0.8125rem;
    cursor: pointer;
  }
  .btn:hover {
    background: rgb(51 65 85);
  }
  .btn-primary {
    background: rgb(37 99 235);
    border-color: rgb(37 99 235);
    color: white;
  }
  .btn-primary:hover {
    background: rgb(29 78 216);
  }
  .status {
    margin: 0;
    font-size: 0.8125rem;
  }
  .status.err {
    color: rgb(248 113 113);
  }
  .meta {
    font-size: 0.75rem;
    color: rgb(148 163 184);
  }
  .meta-warn {
    color: rgb(250 204 21);
  }
  .library {
    padding: 0.5rem;
    background: rgb(2 6 23 / 0.4);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.375rem;
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
