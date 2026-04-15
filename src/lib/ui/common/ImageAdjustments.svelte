<script lang="ts" module>
  import type { ImageFit } from "$lib/settings/types.js";

  export type ImageAdjustmentValue = {
    fit: ImageFit;
    positionX: number;
    positionY: number;
    opacity: number;
    padding: number;
  };
</script>

<script lang="ts">
  import { imageLayerCss } from "$lib/settings/backgroundCss.js";

  type Props = {
    value: ImageAdjustmentValue;
    onChange: (next: ImageAdjustmentValue) => void;
    /** When true, render the padding slider (Picture widget only). */
    showPadding?: boolean;
    /** Data URL used to render the live preview thumbnail. */
    previewUrl?: string | null;
    /** Lower bound for the opacity slider. Picture widget uses 10; backgrounds use 0. */
    opacityMin?: number;
  };

  let {
    value,
    onChange,
    showPadding = false,
    previewUrl = null,
    opacityMin = 0,
  }: Props = $props();

  const previewCss = $derived(
    previewUrl
      ? imageLayerCss(previewUrl, value.fit, value.positionX, value.positionY)
      : ""
  );

  function patch(part: Partial<ImageAdjustmentValue>) {
    onChange({ ...value, ...part });
  }

  function onFit(event: Event) {
    patch({ fit: (event.currentTarget as HTMLSelectElement).value as ImageFit });
  }

  function onRange(event: Event, key: keyof ImageAdjustmentValue) {
    const n = Number((event.currentTarget as HTMLInputElement).value);
    patch({ [key]: n } as Partial<ImageAdjustmentValue>);
  }
</script>

<div class="adjustments">
  {#if previewUrl}
    <div class="preview-frame">
      <div
        class="preview-image"
        style:background={previewCss}
        style:opacity={value.opacity / 100}
      ></div>
    </div>
  {/if}

  <div class="section">
    <label for="img-fit" class="label">Image fit</label>
    <select id="img-fit" class="select" value={value.fit} onchange={onFit}>
      <option value="cover">Cover — fill frame, may crop</option>
      <option value="contain">Contain — fit inside, letterbox</option>
      <option value="fill">Fill — stretch to fit</option>
      <option value="none">None — original size</option>
    </select>
  </div>

  <div class="section">
    <label for="img-opacity" class="label-row">
      <span class="label">Opacity</span>
      <span class="value">{value.opacity}%</span>
    </label>
    <input
      id="img-opacity"
      type="range"
      min={opacityMin}
      max="100"
      step="5"
      value={value.opacity}
      oninput={(e) => onRange(e, "opacity")}
    />
  </div>

  {#if showPadding}
    <div class="section">
      <label for="img-padding" class="label-row">
        <span class="label">Padding</span>
        <span class="value">{value.padding}px</span>
      </label>
      <input
        id="img-padding"
        type="range"
        min="0"
        max="30"
        step="1"
        value={value.padding}
        oninput={(e) => onRange(e, "padding")}
      />
    </div>
  {/if}

  <div class="section">
    <div class="label">Image position</div>
    <div class="grid-2">
      <div>
        <div class="label-row small">
          <span>Horizontal</span>
          <span class="value">{value.positionX}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={value.positionX}
          oninput={(e) => onRange(e, "positionX")}
        />
      </div>
      <div>
        <div class="label-row small">
          <span>Vertical</span>
          <span class="value">{value.positionY}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={value.positionY}
          oninput={(e) => onRange(e, "positionY")}
        />
      </div>
    </div>
    <div class="hint-small">Choose which part of the image shows in the frame.</div>
  </div>
</div>

<style>
  .adjustments {
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
    color: var(--ui-muted-fg);
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
    color: var(--ui-muted-fg);
  }
  .value {
    font-size: 0.75rem;
    color: var(--ui-btn-fg);
    font-variant-numeric: tabular-nums;
  }
  .select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: var(--ui-input-bg);
    border: 1px solid var(--ui-border-soft);
    color: var(--ui-btn-fg-strong);
    font-size: 0.9rem;
  }
  .select:focus {
    outline: none;
    border-color: var(--ui-focus);
  }
  input[type="range"] {
    width: 100%;
    accent-color: var(--ui-focus);
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  .hint-small {
    font-size: 0.7rem;
    color: var(--ui-subtle-fg);
  }
  .preview-frame {
    width: 100%;
    height: 6rem;
    border: 1px solid var(--ui-panel-border);
    border-radius: 0.5rem;
    overflow: hidden;
    background:
      linear-gradient(45deg, var(--ui-subtle-bg) 25%, transparent 25%),
      linear-gradient(-45deg, var(--ui-subtle-bg) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--ui-subtle-bg) 75%),
      linear-gradient(-45deg, transparent 75%, var(--ui-subtle-bg) 75%);
    background-size: 12px 12px;
    background-position: 0 0, 0 6px, 6px -6px, -6px 0;
    background-color: var(--ui-deep-bg);
  }
  .preview-image {
    width: 100%;
    height: 100%;
    transition: background 120ms ease, opacity 120ms ease;
  }
</style>
