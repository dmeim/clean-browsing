import {
  DEFAULT_SETTINGS,
  type BackgroundSettings,
  type GlobalSettings,
  type Theme,
  type WidgetDefaults,
} from "./types.js";

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

async function loadRaw(): Promise<GlobalSettings | null> {
  try {
    if (hasExtensionStorage()) {
      const result = await browser!.storage!.local!.get(STORAGE_KEY);
      const value = result[STORAGE_KEY] as GlobalSettings | undefined;
      if (value) return value;
      // One-time migration from pre-permission localStorage fallback.
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as GlobalSettings;
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
    return raw ? (JSON.parse(raw) as GlobalSettings) : null;
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

function mergeWithDefaults(partial: Partial<GlobalSettings> | null): GlobalSettings {
  if (!partial) return structuredClone(DEFAULT_SETTINGS);
  return {
    theme: partial.theme ?? DEFAULT_SETTINGS.theme,
    background: {
      ...DEFAULT_SETTINGS.background,
      ...(partial.background ?? {}),
      gradient: {
        ...DEFAULT_SETTINGS.background.gradient,
        ...(partial.background?.gradient ?? {}),
      },
      image: {
        ...DEFAULT_SETTINGS.background.image,
        ...(partial.background?.image ?? {}),
      },
      url: {
        ...DEFAULT_SETTINGS.background.url,
        ...(partial.background?.url ?? {}),
      },
    },
    widgetDefaults: {
      ...DEFAULT_SETTINGS.widgetDefaults,
      ...(partial.widgetDefaults ?? {}),
    },
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
    replaceAll,
    reset,
    beginEdit,
    commitEdit,
    cancelEdit,
  };
}

export const settingsStore = createStore();
