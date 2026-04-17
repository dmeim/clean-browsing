import type { GridLayout, WidgetInstance, WidgetStyleOverrides } from "$lib/widgets/types.js";
import { getWidget } from "$lib/widgets/registry.js";
import { deepMerge } from "$lib/widgets/style/resolve.js";
import { type OverridePath, unsetAtPath } from "$lib/widgets/style/path.js";

const STORAGE_KEY = "clean-browsing:layout:v2";
const DEFAULT_COLS = 24;
const DEFAULT_ROWS = 16;
const DENSE_COLS = 48;
const DENSE_ROWS = 32;

type BrowserLike = {
  storage?: {
    local?: {
      get: (key: string) => Promise<Record<string, unknown>>;
      set: (items: Record<string, unknown>) => Promise<void>;
    };
  };
};

declare const browser: BrowserLike | undefined;

function hasExtensionStorage(): boolean {
  return typeof browser !== "undefined" && !!browser?.storage?.local;
}

async function loadRaw(): Promise<GridLayout | null> {
  if (hasExtensionStorage()) {
    const result = await browser!.storage!.local!.get(STORAGE_KEY);
    const value = result[STORAGE_KEY] as GridLayout | undefined;
    if (value) return value;
    // One-time migration from pre-permission localStorage fallback.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GridLayout;
        await browser!.storage!.local!.set({ [STORAGE_KEY]: parsed });
        localStorage.removeItem(STORAGE_KEY);
        return parsed;
      }
    } catch (err) {
      console.warn("[grid] localStorage migration skipped", err);
    }
    return null;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as GridLayout) : null;
}

async function saveRaw(layout: GridLayout): Promise<void> {
  if (hasExtensionStorage()) {
    await browser!.storage!.local!.set({ [STORAGE_KEY]: layout });
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

function emptyLayout(): GridLayout {
  return { cols: DEFAULT_COLS, rows: DEFAULT_ROWS, instances: [] };
}

function newInstanceId(): string {
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function createStore() {
  let layout = $state<GridLayout>(emptyLayout());
  let loaded = $state(false);
  let editSnapshot: GridLayout | null = null;
  let editing = false;
  let loadPromise: Promise<void> | null = null;

  async function load() {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      const saved = await loadRaw();
      if (saved) {
        const migrated = migrateLayout(saved);
        layout = migrated;
        if (migrated !== saved) {
          await saveRaw($state.snapshot(layout) as GridLayout);
        }
      } else {
        layout = defaultLayout();
        loaded = true;
        await saveRaw($state.snapshot(layout) as GridLayout);
        return;
      }
      loaded = true;
    })();
    return loadPromise;
  }

  async function persist() {
    if (editing) return;
    if (!loaded) {
      console.warn("[grid] skipped save: not yet loaded");
      return;
    }
    await saveRaw($state.snapshot(layout) as GridLayout);
  }

  function beginEdit() {
    if (!loaded) {
      editSnapshot = null;
      editing = false;
      return;
    }
    editSnapshot = structuredClone($state.snapshot(layout)) as GridLayout;
    editing = true;
  }

  async function commitEdit() {
    editing = false;
    editSnapshot = null;
    if (!loaded) return;
    await saveRaw($state.snapshot(layout) as GridLayout);
  }

  function cancelEdit() {
    if (editSnapshot) {
      layout = editSnapshot;
    }
    editSnapshot = null;
    editing = false;
  }

  // Widget definitions express defaultSize/minSize/maxSize in normal-mode
  // cell units. When the grid is in dense mode (each cell is half a normal
  // cell on each axis), we scale those values by 2 so widgets keep their
  // intended physical size in either mode. setDenseGrid() already doubles
  // existing instances for the same reason.
  function denseScale(): number {
    return layout.cols >= DENSE_COLS ? 2 : 1;
  }

  function addWidget(widgetId: string, position?: { x: number; y: number }): void {
    const def = getWidget(widgetId);
    if (!def) {
      console.error(`[grid] unknown widget id "${widgetId}"`);
      return;
    }
    const m = denseScale();
    const instance: WidgetInstance = {
      instanceId: newInstanceId(),
      widgetId,
      x: position?.x ?? 0,
      y: position?.y ?? 0,
      w: def.defaultSize.w * m,
      h: def.defaultSize.h * m,
      settings: structuredClone(def.defaultSettings),
    };
    layout.instances.push(instance);
    void persist();
  }

  function removeWidget(instanceId: string): void {
    layout.instances = layout.instances.filter((i) => i.instanceId !== instanceId);
    void persist();
  }

  function updateWidgetSettings(instanceId: string, settings: unknown): void {
    const inst = layout.instances.find((i) => i.instanceId === instanceId);
    if (!inst) return;
    inst.settings = settings;
    void persist();
  }

  function updateInstanceStyleOverrides(instanceId: string, patch: WidgetStyleOverrides): void {
    const inst = layout.instances.find((i) => i.instanceId === instanceId);
    if (!inst) return;
    const current = (inst.styleOverrides ?? {}) as WidgetStyleOverrides;
    inst.styleOverrides = deepMerge(current, patch) as WidgetStyleOverrides;
    void persist();
  }

  function clearStyleOverridePath(instanceId: string, path: OverridePath): void {
    const inst = layout.instances.find((i) => i.instanceId === instanceId);
    if (!inst || !inst.styleOverrides) return;
    const next = unsetAtPath(inst.styleOverrides as object, path) as WidgetStyleOverrides;
    inst.styleOverrides = Object.keys(next as object).length === 0 ? undefined : next;
    void persist();
  }

  function clearAllStyleOverrides(instanceId: string): void {
    const inst = layout.instances.find((i) => i.instanceId === instanceId);
    if (!inst) return;
    inst.styleOverrides = undefined;
    void persist();
  }

  function rectsOverlap(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number },
  ): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function canPlace(instanceId: string, x: number, y: number, w: number, h: number): boolean {
    if (w <= 0 || h <= 0) return false;
    if (x < 0 || y < 0) return false;
    if (x + w > layout.cols || y + h > layout.rows) return false;
    const target = { x, y, w, h };
    for (const other of layout.instances) {
      if (other.instanceId === instanceId) continue;
      if (rectsOverlap(target, other)) return false;
    }
    return true;
  }

  function moveWidget(instanceId: string, x: number, y: number): boolean {
    const inst = layout.instances.find((i) => i.instanceId === instanceId);
    if (!inst) return false;
    if (!canPlace(instanceId, x, y, inst.w, inst.h)) return false;
    inst.x = x;
    inst.y = y;
    void persist();
    return true;
  }

  function resizeWidget(instanceId: string, w: number, h: number): boolean {
    const inst = layout.instances.find((i) => i.instanceId === instanceId);
    if (!inst) return false;
    const def = getWidget(inst.widgetId);
    const m = denseScale();
    const minW = (def?.minSize?.w ?? 1) * m;
    const minH = (def?.minSize?.h ?? 1) * m;
    const maxW = def?.maxSize ? def.maxSize.w * m : layout.cols;
    const maxH = def?.maxSize ? def.maxSize.h * m : layout.rows;
    const clampedW = Math.max(minW, Math.min(maxW, w));
    const clampedH = Math.max(minH, Math.min(maxH, h));
    if (!canPlace(instanceId, inst.x, inst.y, clampedW, clampedH)) return false;
    inst.w = clampedW;
    inst.h = clampedH;
    void persist();
    return true;
  }

  function findFreeSlot(w: number, h: number): { x: number; y: number } | null {
    for (let y = 0; y <= layout.rows - h; y++) {
      for (let x = 0; x <= layout.cols - w; x++) {
        if (canPlace("__probe__", x, y, w, h)) {
          return { x, y };
        }
      }
    }
    return null;
  }

  function addWidgetAuto(widgetId: string): boolean {
    const def = getWidget(widgetId);
    if (!def) return false;
    const m = denseScale();
    const slot = findFreeSlot(def.defaultSize.w * m, def.defaultSize.h * m);
    if (!slot) return false;
    addWidget(widgetId, slot);
    return true;
  }

  function resetLayout(): void {
    layout = defaultLayout();
    void persist();
  }

  function setDenseGrid(enabled: boolean): void {
    const isDense = layout.cols >= DENSE_COLS;
    if (enabled === isDense) return;

    if (enabled) {
      layout.cols = DENSE_COLS;
      layout.rows = DENSE_ROWS;
      for (const inst of layout.instances) {
        inst.x *= 2;
        inst.y *= 2;
        inst.w *= 2;
        inst.h *= 2;
      }
    } else {
      layout.cols = DEFAULT_COLS;
      layout.rows = DEFAULT_ROWS;
      const halved = layout.instances.map((inst) => ({
        inst,
        x: Math.floor(inst.x / 2),
        y: Math.floor(inst.y / 2),
        w: Math.max(1, Math.ceil(inst.w / 2)),
        h: Math.max(1, Math.ceil(inst.h / 2)),
      }));
      layout.instances = [];
      for (const item of halved) {
        const w = Math.min(DEFAULT_COLS, item.w);
        const h = Math.min(DEFAULT_ROWS, item.h);
        const x = Math.max(0, Math.min(DEFAULT_COLS - w, item.x));
        const y = Math.max(0, Math.min(DEFAULT_ROWS - h, item.y));
        Object.assign(item.inst, { x, y, w, h });
        layout.instances.push(item.inst);
        if (!canPlace(item.inst.instanceId, x, y, w, h)) {
          const slot = findFreeSlot(w, h);
          if (slot) {
            item.inst.x = slot.x;
            item.inst.y = slot.y;
          }
        }
      }
    }
    void persist();
  }

  function replaceLayout(next: GridLayout): void {
    layout = {
      cols: next.cols ?? DEFAULT_COLS,
      rows: next.rows ?? DEFAULT_ROWS,
      instances: Array.isArray(next.instances) ? next.instances : [],
    };
    void persist();
  }

  return {
    get layout() {
      return layout;
    },
    get loaded() {
      return loaded;
    },
    get isDense() {
      return layout.cols >= DENSE_COLS;
    },
    load,
    addWidget,
    addWidgetAuto,
    removeWidget,
    updateWidgetSettings,
    updateInstanceStyleOverrides,
    clearStyleOverridePath,
    clearAllStyleOverrides,
    canPlace,
    moveWidget,
    resizeWidget,
    findFreeSlot,
    resetLayout,
    replaceLayout,
    setDenseGrid,
    beginEdit,
    commitEdit,
    cancelEdit,
  };
}

// One-shot migrations applied to layouts loaded from storage. Returns the
// same reference if nothing changed, or a new layout if any instance was
// dropped or rewritten.
function migrateLayout(saved: GridLayout): GridLayout {
  const filtered = saved.instances.filter((inst) => {
    if (inst.widgetId !== "ping-monitor") return true;
    const s = inst.settings as Record<string, unknown> | null | undefined;
    // v1.5.0 ping-monitor stored `targets: PingTarget[]`; v1.5.1 stores a
    // single `target`. Drop the old shape — see release notes.
    if (s && Array.isArray((s as { targets?: unknown }).targets)) return false;
    return true;
  });
  if (filtered.length === saved.instances.length) return saved;
  console.info(
    `[grid] dropped ${saved.instances.length - filtered.length} legacy multi-target ping-monitor instance(s)`,
  );
  return { ...saved, instances: filtered };
}

function defaultLayout(): GridLayout {
  return {
    cols: DEFAULT_COLS,
    rows: DEFAULT_ROWS,
    instances: [
      {
        instanceId: "default_clock",
        widgetId: "clock",
        x: 10,
        y: 6,
        w: 4,
        h: 2,
        settings: { format24h: false, showSeconds: false },
      },
      {
        instanceId: "default_clock_2",
        widgetId: "clock",
        x: 2,
        y: 2,
        w: 4,
        h: 2,
        settings: { format24h: true, showSeconds: true },
      },
    ],
  };
}

export const gridStore = createStore();
