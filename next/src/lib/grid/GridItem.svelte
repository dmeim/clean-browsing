<script lang="ts">
  import type { WidgetInstance } from "$lib/widgets/types.js";
  import { getWidget } from "$lib/widgets/registry.js";
  import { gridStore } from "./store.svelte.js";
  import { uiStore } from "$lib/ui/uiStore.svelte.js";
  import { widgetScaler } from "./widgetScaler.js";

  type Props = { instance: WidgetInstance };
  let { instance }: Props = $props();

  const def = $derived(getWidget(instance.widgetId));

  // Preview state during drag/resize. When null, render uses instance.x/y/w/h.
  let previewX = $state<number | null>(null);
  let previewY = $state<number | null>(null);
  let previewW = $state<number | null>(null);
  let previewH = $state<number | null>(null);
  let interacting = $state<"drag" | "resize" | null>(null);
  let previewValid = $state(true);

  const dispX = $derived(previewX ?? instance.x);
  const dispY = $derived(previewY ?? instance.y);
  const dispW = $derived(previewW ?? instance.w);
  const dispH = $derived(previewH ?? instance.h);

  const style = $derived(
    `grid-column: ${dispX + 1} / span ${dispW}; ` +
    `grid-row: ${dispY + 1} / span ${dispH};`
  );

  type Metrics = {
    cellStrideX: number;
    cellStrideY: number;
  };

  // Read cell size + gap from the parent grid's computed style at interaction start.
  // grid-template-columns resolves to space-separated px values; gap is separate.
  function readGridMetrics(el: HTMLElement): Metrics | null {
    const root = el.closest(".grid-root") as HTMLElement | null;
    if (!root) return null;
    const cs = getComputedStyle(root);
    const cols = cs.gridTemplateColumns.split(/\s+/).filter(Boolean);
    const rows = cs.gridTemplateRows.split(/\s+/).filter(Boolean);
    if (cols.length === 0 || rows.length === 0) return null;
    const cellW = parseFloat(cols[0]);
    const cellH = parseFloat(rows[0]);
    const colGap = parseFloat(cs.columnGap) || 0;
    const rowGap = parseFloat(cs.rowGap) || 0;
    if (!Number.isFinite(cellW) || !Number.isFinite(cellH)) return null;
    return {
      cellStrideX: cellW + colGap,
      cellStrideY: cellH + rowGap,
    };
  }

  type DragContext = {
    startPointerX: number;
    startPointerY: number;
    startCellX: number;
    startCellY: number;
    metrics: Metrics;
    lastValidX: number;
    lastValidY: number;
  };

  type ResizeContext = {
    startPointerX: number;
    startPointerY: number;
    startW: number;
    startH: number;
    metrics: Metrics;
    lastValidW: number;
    lastValidH: number;
  };

  let dragCtx: DragContext | null = null;
  let resizeCtx: ResizeContext | null = null;

  function handleDragPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    if (!uiStore.editMode) return;
    const target = event.currentTarget as HTMLElement;
    const metrics = readGridMetrics(target);
    if (!metrics) return;
    target.setPointerCapture(event.pointerId);
    dragCtx = {
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startCellX: instance.x,
      startCellY: instance.y,
      metrics,
      lastValidX: instance.x,
      lastValidY: instance.y,
    };
    interacting = "drag";
    previewX = instance.x;
    previewY = instance.y;
    previewValid = true;
    event.preventDefault();
  }

  function handleDragPointerMove(event: PointerEvent) {
    if (!dragCtx) return;
    const dx = event.clientX - dragCtx.startPointerX;
    const dy = event.clientY - dragCtx.startPointerY;
    const cellDX = Math.round(dx / dragCtx.metrics.cellStrideX);
    const cellDY = Math.round(dy / dragCtx.metrics.cellStrideY);
    const rawX = dragCtx.startCellX + cellDX;
    const rawY = dragCtx.startCellY + cellDY;
    const targetX = Math.max(0, Math.min(gridStore.layout.cols - instance.w, rawX));
    const targetY = Math.max(0, Math.min(gridStore.layout.rows - instance.h, rawY));
    previewX = targetX;
    previewY = targetY;
    const valid = gridStore.canPlace(instance.instanceId, targetX, targetY, instance.w, instance.h);
    previewValid = valid;
    if (valid) {
      dragCtx.lastValidX = targetX;
      dragCtx.lastValidY = targetY;
    }
  }

  function handleDragPointerUp(event: PointerEvent) {
    if (!dragCtx) return;
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
    const dropX = previewX ?? dragCtx.lastValidX;
    const dropY = previewY ?? dragCtx.lastValidY;
    const landed = gridStore.canPlace(instance.instanceId, dropX, dropY, instance.w, instance.h)
      ? { x: dropX, y: dropY }
      : { x: dragCtx.lastValidX, y: dragCtx.lastValidY };
    gridStore.moveWidget(instance.instanceId, landed.x, landed.y);
    dragCtx = null;
    interacting = null;
    previewX = null;
    previewY = null;
    previewValid = true;
  }

  function handleResizePointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    if (!uiStore.editMode) return;
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const metrics = readGridMetrics(target);
    if (!metrics) return;
    target.setPointerCapture(event.pointerId);
    resizeCtx = {
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startW: instance.w,
      startH: instance.h,
      metrics,
      lastValidW: instance.w,
      lastValidH: instance.h,
    };
    interacting = "resize";
    previewW = instance.w;
    previewH = instance.h;
    event.preventDefault();
  }

  function handleResizePointerMove(event: PointerEvent) {
    if (!resizeCtx) return;
    const dx = event.clientX - resizeCtx.startPointerX;
    const dy = event.clientY - resizeCtx.startPointerY;
    const cellDW = Math.round(dx / resizeCtx.metrics.cellStrideX);
    const cellDH = Math.round(dy / resizeCtx.metrics.cellStrideY);
    const minW = def?.minSize?.w ?? 1;
    const minH = def?.minSize?.h ?? 1;
    const maxW = def?.maxSize?.w ?? gridStore.layout.cols;
    const maxH = def?.maxSize?.h ?? gridStore.layout.rows;
    const clampedW = Math.max(minW, Math.min(maxW, Math.min(gridStore.layout.cols - instance.x, resizeCtx.startW + cellDW)));
    const clampedH = Math.max(minH, Math.min(maxH, Math.min(gridStore.layout.rows - instance.y, resizeCtx.startH + cellDH)));
    previewW = clampedW;
    previewH = clampedH;
    const valid = gridStore.canPlace(instance.instanceId, instance.x, instance.y, clampedW, clampedH);
    previewValid = valid;
    if (valid) {
      resizeCtx.lastValidW = clampedW;
      resizeCtx.lastValidH = clampedH;
    }
  }

  function handleResizePointerUp(event: PointerEvent) {
    if (!resizeCtx) return;
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
    const dropW = previewW ?? resizeCtx.lastValidW;
    const dropH = previewH ?? resizeCtx.lastValidH;
    const landed = gridStore.canPlace(instance.instanceId, instance.x, instance.y, dropW, dropH)
      ? { w: dropW, h: dropH }
      : { w: resizeCtx.lastValidW, h: resizeCtx.lastValidH };
    gridStore.resizeWidget(instance.instanceId, landed.w, landed.h);
    resizeCtx = null;
    interacting = null;
    previewW = null;
    previewH = null;
    previewValid = true;
  }

  function handleUpdateSettings(next: unknown) {
    gridStore.updateWidgetSettings(instance.instanceId, next);
  }

  function handleRemove(event: MouseEvent) {
    event.stopPropagation();
    gridStore.removeWidget(instance.instanceId);
  }

  function handleControlPointerDown(event: PointerEvent) {
    // Prevent the drag handler on the parent from firing when clicking a corner control.
    event.stopPropagation();
  }

  function handleOpenSettings(event: MouseEvent) {
    event.stopPropagation();
    uiStore.openWidgetSettings(instance.instanceId);
  }

  const hasSettings = $derived(!!def?.settingsComponent);
</script>

<div
  class="grid-item"
  class:edit-mode={uiStore.editMode}
  class:jiggle={uiStore.editMode && !interacting}
  class:dragging={interacting === "drag"}
  class:resizing={interacting === "resize"}
  class:invalid={interacting !== null && !previewValid}
  {style}
  role="group"
  aria-label={def ? `${def.name} widget` : "widget"}
  onpointerdown={handleDragPointerDown}
  onpointermove={handleDragPointerMove}
  onpointerup={handleDragPointerUp}
  onpointercancel={handleDragPointerUp}
>
  <div class="grid-item-inner" use:widgetScaler>
    {#if def}
      {@const Widget = def.component}
      <Widget settings={instance.settings} updateSettings={handleUpdateSettings} />
    {:else}
      <div class="grid-item-missing">
        Unknown widget: <code>{instance.widgetId}</code>
      </div>
    {/if}
  </div>

  {#if uiStore.editMode}
    <button
      class="remove-btn"
      type="button"
      aria-label="Remove widget"
      onpointerdown={handleControlPointerDown}
      onclick={handleRemove}
    >
      <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
        <path
          d="M6 6 L18 18 M18 6 L6 18"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          fill="none"
        />
      </svg>
    </button>

    {#if hasSettings}
      <button
        class="settings-btn"
        type="button"
        aria-label="Widget settings"
        onpointerdown={handleControlPointerDown}
        onclick={handleOpenSettings}
      >
        <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    {/if}

    <div
      class="resize-handle"
      onpointerdown={handleResizePointerDown}
      onpointermove={handleResizePointerMove}
      onpointerup={handleResizePointerUp}
      onpointercancel={handleResizePointerUp}
      aria-label="Resize widget"
      role="button"
      tabindex="-1"
    ></div>
  {/if}
</div>

<style>
  .grid-item {
    position: relative;
    min-width: 0;
    min-height: 0;
    display: flex;
    cursor: default;
    touch-action: auto;
    transition: box-shadow 120ms ease;
  }

  .grid-item.edit-mode {
    cursor: grab;
    touch-action: none;
  }

  .grid-item.dragging,
  .grid-item.resizing {
    cursor: grabbing;
    z-index: 10;
    box-shadow: 0 10px 40px rgb(0 0 0 / 0.45);
    animation: none !important;
    opacity: 0.92;
  }

  .grid-item.invalid {
    outline: 2px solid rgb(239 68 68 / 0.9);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgb(239 68 68 / 0.25), 0 10px 40px rgb(0 0 0 / 0.45);
  }

  @keyframes jiggle {
    0%   { transform: rotate(-0.6deg); }
    50%  { transform: rotate(0.6deg); }
    100% { transform: rotate(-0.6deg); }
  }

  .grid-item.jiggle {
    animation: jiggle 0.22s ease-in-out infinite;
    transform-origin: center;
  }

  .grid-item-inner {
    width: 100%;
    height: 100%;
  }

  /* In edit mode, block pointer events on the widget body so clicks
     land on the draggable parent instead of the widget's own controls. */
  .grid-item.edit-mode .grid-item-inner {
    pointer-events: none;
  }

  .remove-btn {
    position: absolute;
    top: -6px;
    left: -6px;
    width: 20px;
    height: 20px;
    border-radius: 9999px;
    background: rgb(220 38 38);
    color: white;
    border: 2px solid rgb(15 23 42);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
    z-index: 20;
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.4);
  }

  .remove-btn:hover {
    background: rgb(239 68 68);
  }

  .settings-btn {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    border-radius: 9999px;
    background: rgb(71 85 105);
    color: rgb(226 232 240);
    border: 2px solid rgb(15 23 42);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
    z-index: 20;
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.4);
  }

  .settings-btn:hover {
    background: rgb(100 116 139);
    color: white;
  }

  .grid-item-missing {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border: 1px dashed rgb(239 68 68 / 0.5);
    border-radius: 0.5rem;
    color: rgb(252 165 165);
    font-size: 0.75rem;
  }

  .resize-handle {
    position: absolute;
    right: 2px;
    bottom: 2px;
    width: 14px;
    height: 14px;
    cursor: se-resize;
    border-right: 2px solid rgb(148 163 184 / 0.6);
    border-bottom: 2px solid rgb(148 163 184 / 0.6);
    border-bottom-right-radius: 0.4rem;
    opacity: 0;
    transition: opacity 120ms ease;
  }

  .grid-item:hover .resize-handle,
  .grid-item.resizing .resize-handle {
    opacity: 1;
  }
</style>
