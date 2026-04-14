import {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_SETTINGS,
  DEFAULT_WIDGET_DEFAULTS,
  type BackgroundSettings,
  type GlobalSettings,
  type Theme,
  type WidgetDefaults,
  type WidgetStylePreset,
} from "./types.js";
import { BUILTIN_PRESETS } from "./presets.js";

const STORAGE_KEY = "clean-browsing:settings:v1";

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

async function loadRaw(): Promise<unknown> {
  try {
    if (hasExtensionStorage()) {
      const result = await browser!.storage!.local!.get(STORAGE_KEY);
      const value = result[STORAGE_KEY];
      if (value) return value;
      // One-time migration from pre-permission localStorage fallback.
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          await browser!.storage!.local!.set({ [STORAGE_KEY]: parsed });
          localStorage.removeItem(STORAGE_KEY);
          return parsed;
        }
      } catch (err) {
        console.warn("[settings] localStorage migration skipped", err);
      }
      return null;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("[settings] failed to load", err);
    return null;
  }
}

async function saveRaw(settings: GlobalSettings): Promise<void> {
  try {
    if (hasExtensionStorage()) {
      await browser!.storage!.local!.set({ [STORAGE_KEY]: settings });
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("[settings] failed to save", err);
  }
}

type FlatWidgetDefaults = {
  borderRadius?: number;
  shadow?: number;
  glow?: number;
  textColor?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  borderColor?: string;
};

function isFlatWidgetDefaults(value: unknown): value is FlatWidgetDefaults {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.borderRadius === "number" ||
    typeof v.borderColor === "string" ||
    typeof v.backgroundColor === "string"
  ) && !("border" in v);
}

function migrateWidgetDefaults(raw: unknown): WidgetDefaults {
  const base = structuredClone(DEFAULT_WIDGET_DEFAULTS);
  if (!raw || typeof raw !== "object") return base;
  if (isFlatWidgetDefaults(raw)) {
    const flat = raw as FlatWidgetDefaults;
    if (typeof flat.textColor === "string") base.textColor = flat.textColor;
    if (typeof flat.backgroundColor === "string") base.background.solid = flat.backgroundColor;
    if (typeof flat.backgroundOpacity === "number") base.backgroundOpacity = flat.backgroundOpacity;
    if (typeof flat.borderColor === "string") base.border.color = flat.borderColor;
    if (typeof flat.borderRadius === "number") base.border.radius = flat.borderRadius;
    if (typeof flat.shadow === "number") base.shadow.intensity = flat.shadow;
    if (typeof flat.glow === "number") base.glow.intensity = flat.glow;
    return base;
  }
  // Already nested — deep-merge over defaults so new fields get populated.
  return mergeWidgetDefaults(base, raw as Partial<WidgetDefaults>);
}

function mergeWidgetDefaults(
  base: WidgetDefaults,
  patch: Partial<WidgetDefaults> | undefined
): WidgetDefaults {
  if (!patch) return base;
  return {
    textColor: patch.textColor ?? base.textColor,
    accentColor: patch.accentColor ?? base.accentColor,
    background: {
      ...base.background,
      ...(patch.background ?? {}),
      gradient: {
        ...base.background.gradient,
        ...(patch.background?.gradient ?? {}),
      },
      image: {
        ...base.background.image,
        ...(patch.background?.image ?? {}),
      },
      url: {
        ...base.background.url,
        ...(patch.background?.url ?? {}),
      },
    },
    backgroundOpacity: patch.backgroundOpacity ?? base.backgroundOpacity,
    border: { ...base.border, ...(patch.border ?? {}) },
    glow: { ...base.glow, ...(patch.glow ?? {}) },
    shadow: { ...base.shadow, ...(patch.shadow ?? {}) },
    backdropBlur: patch.backdropBlur ?? base.backdropBlur,
    opacity: patch.opacity ?? base.opacity,
  };
}

function mergeWithDefaults(partial: unknown): GlobalSettings {
  if (!partial || typeof partial !== "object") return structuredClone(DEFAULT_SETTINGS);
  const p = partial as Partial<GlobalSettings> & { widgetDefaults?: unknown };
  const userPresets = Array.isArray(p.widgetPresets)
    ? p.widgetPresets.filter((pr): pr is WidgetStylePreset => {
        return !!pr && typeof pr === "object" && typeof (pr as WidgetStylePreset).id === "string" && !!((pr as WidgetStylePreset).style);
      })
    : [];
  return {
    theme: p.theme ?? DEFAULT_SETTINGS.theme,
    background: {
      ...DEFAULT_SETTINGS.background,
      ...(p.background ?? {}),
      gradient: {
        ...DEFAULT_SETTINGS.background.gradient,
        ...(p.background?.gradient ?? {}),
      },
      image: {
        ...DEFAULT_SETTINGS.background.image,
        ...(p.background?.image ?? {}),
      },
      url: {
        ...DEFAULT_SETTINGS.background.url,
        ...(p.background?.url ?? {}),
      },
    },
    widgetDefaults: migrateWidgetDefaults(p.widgetDefaults),
    widgetPresets: userPresets,
    schemaVersion: typeof p.schemaVersion === "number" ? p.schemaVersion : CURRENT_SCHEMA_VERSION,
  };
}

export function buildBackgroundCss(
  bg: BackgroundSettings,
  resolveImage: (id: string | null | undefined) => string | null = () => null
): string {
  switch (bg.type) {
    case "solid":
      return bg.solid;
    case "gradient": {
      const stops = bg.gradient.stops.filter(Boolean).join(", ");
      return `linear-gradient(${bg.gradient.angle}deg, ${stops})`;
    }
    case "image": {
      const resolved = resolveImage(bg.image.imageId) ?? bg.image.dataUrl;
      return resolved
        ? `center / cover no-repeat url("${resolved}")`
        : DEFAULT_SETTINGS.background.solid;
    }
    case "url":
      return bg.url.href
        ? `center / cover no-repeat url("${bg.url.href}")`
        : DEFAULT_SETTINGS.background.solid;
  }
}

function applyThemeToDom(settings: GlobalSettings): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (settings.theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

function createStore() {
  let settings = $state<GlobalSettings>(structuredClone(DEFAULT_SETTINGS));
  let loaded = $state(false);
  let editSnapshot: GlobalSettings | null = null;
  let editing = false;
  let loadPromise: Promise<void> | null = null;

  async function load() {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      const saved = await loadRaw();
      settings = mergeWithDefaults(saved);
      loaded = true;
      applyThemeToDom($state.snapshot(settings) as GlobalSettings);
    })();
    return loadPromise;
  }

  async function persist() {
    const snap = $state.snapshot(settings) as GlobalSettings;
    applyThemeToDom(snap);
    if (editing) return;
    if (!loaded) {
      console.warn("[settings] skipped save: not yet loaded");
      return;
    }
    await saveRaw(snap);
  }

  function beginEdit() {
    if (!loaded) {
      editSnapshot = null;
      editing = false;
      return;
    }
    editSnapshot = structuredClone($state.snapshot(settings)) as GlobalSettings;
    editing = true;
  }

  async function commitEdit() {
    editing = false;
    editSnapshot = null;
    if (!loaded) return;
    await saveRaw($state.snapshot(settings) as GlobalSettings);
  }

  function cancelEdit() {
    if (editSnapshot) {
      settings = mergeWithDefaults(editSnapshot);
      applyThemeToDom($state.snapshot(settings) as GlobalSettings);
    }
    editSnapshot = null;
    editing = false;
  }

  function setTheme(theme: Theme) {
    settings.theme = theme;
    void persist();
  }

  function updateBackground(updater: (bg: BackgroundSettings) => void) {
    updater(settings.background);
    void persist();
  }

  function updateWidgetDefaults(updater: (w: WidgetDefaults) => void) {
    updater(settings.widgetDefaults);
    void persist();
  }

  function replaceWidgetDefaults(next: WidgetDefaults) {
    settings.widgetDefaults = mergeWidgetDefaults(
      structuredClone(DEFAULT_WIDGET_DEFAULTS),
      next
    );
    void persist();
  }

  function addPreset(name: string): WidgetStylePreset {
    const id = `user:${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const preset: WidgetStylePreset = {
      id,
      name: name.trim() || "Untitled preset",
      style: structuredClone($state.snapshot(settings.widgetDefaults) as WidgetDefaults),
    };
    settings.widgetPresets.push(preset);
    void persist();
    return preset;
  }

  function deletePreset(id: string) {
    settings.widgetPresets = settings.widgetPresets.filter((p) => p.id !== id);
    void persist();
  }

  function applyPresetToDefaults(preset: WidgetStylePreset) {
    settings.widgetDefaults = mergeWidgetDefaults(
      structuredClone(DEFAULT_WIDGET_DEFAULTS),
      preset.style
    );
    void persist();
  }

  function allPresets(): WidgetStylePreset[] {
    const userIds = new Set(settings.widgetPresets.map((p) => p.id));
    const builtins = BUILTIN_PRESETS.filter((p) => !userIds.has(p.id));
    return [...builtins, ...settings.widgetPresets];
  }

  function replaceAll(next: GlobalSettings) {
    settings = mergeWithDefaults(next);
    void persist();
  }

  function reset() {
    settings = structuredClone(DEFAULT_SETTINGS);
    void persist();
  }

  return {
    get settings() {
      return settings;
    },
    get loaded() {
      return loaded;
    },
    load,
    persist,
    setTheme,
    updateBackground,
    updateWidgetDefaults,
    replaceWidgetDefaults,
    addPreset,
    deletePreset,
    applyPresetToDefaults,
    allPresets,
    replaceAll,
    reset,
    beginEdit,
    commitEdit,
    cancelEdit,
  };
}

export const settingsStore = createStore();
