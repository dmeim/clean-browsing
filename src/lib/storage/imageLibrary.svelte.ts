import { idbGet, idbSet } from "./idb.js";

const STORAGE_KEY = "clean-browsing:images:v1";

export type StoredImage = {
  id: string;
  name: string;
  dataUrl: string;
  bytes: number;
  hash: string;
  createdAt: number;
};

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

// Image dataUrls routinely exceed the ~5 MB localStorage quota (Firefox in
// particular). We persist the library in IndexedDB instead when running
// outside the extension, and migrate any pre-existing localStorage blob on
// first load so users don't lose already-uploaded images.
async function migrateFromLocalStorage(): Promise<StoredImage[] | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    await idbSet(STORAGE_KEY, parsed);
    localStorage.removeItem(STORAGE_KEY);
    return parsed as StoredImage[];
  } catch (err) {
    console.warn("[imageLibrary] localStorage migration skipped", err);
    return null;
  }
}

async function loadRaw(): Promise<StoredImage[]> {
  try {
    if (hasExtensionStorage()) {
      const result = await browser!.storage!.local!.get(STORAGE_KEY);
      const value = result[STORAGE_KEY];
      if (Array.isArray(value) && value.length > 0) {
        return value as StoredImage[];
      }
      // Extension storage is empty — try to recover from previous IDB/localStorage
      // location (pre-permission fallback path).
      const legacyIdb = await safeIdbGet<StoredImage[]>(STORAGE_KEY);
      if (Array.isArray(legacyIdb) && legacyIdb.length > 0) {
        await browser!.storage!.local!.set({ [STORAGE_KEY]: legacyIdb });
        return legacyIdb;
      }
      const legacyLs = readLocalStorageArray();
      if (legacyLs) {
        await browser!.storage!.local!.set({ [STORAGE_KEY]: legacyLs });
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        return legacyLs;
      }
      return Array.isArray(value) ? (value as StoredImage[]) : [];
    }
    const migrated = await migrateFromLocalStorage();
    if (migrated) return migrated;
    const fromIdb = await idbGet<StoredImage[]>(STORAGE_KEY);
    return Array.isArray(fromIdb) ? fromIdb : [];
  } catch (err) {
    console.error("[imageLibrary] load failed", err);
    return [];
  }
}

async function safeIdbGet<T>(key: string): Promise<T | null> {
  try {
    return await idbGet<T>(key);
  } catch {
    return null;
  }
}

function readLocalStorageArray(): StoredImage[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredImage[]) : null;
  } catch {
    return null;
  }
}

async function saveRaw(images: StoredImage[]): Promise<void> {
  if (hasExtensionStorage()) {
    await browser!.storage!.local!.set({ [STORAGE_KEY]: images });
    return;
  }
  await idbSet(STORAGE_KEY, images);
}

async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `fallback_${(h >>> 0).toString(16)}`;
}

function approxBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.floor((base64.length * 3) / 4);
}

function newId(): string {
  return `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function createStore() {
  let images = $state<StoredImage[]>([]);
  let loaded = $state(false);
  let lastError = $state<string | null>(null);
  let editSnapshot: StoredImage[] | null = null;
  let editing = false;
  let loadPromise: Promise<void> | null = null;

  async function load() {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      images = await loadRaw();
      loaded = true;
    })();
    return loadPromise;
  }

  async function ensureLoaded(): Promise<void> {
    if (loaded) return;
    await load();
  }

  async function safeSave(): Promise<void> {
    if (!loaded) {
      // Refuse to overwrite storage before the initial load has populated
      // in-memory state — otherwise a premature persist would wipe everything.
      console.warn("[imageLibrary] skipped save: not yet loaded");
      return;
    }
    try {
      await saveRaw($state.snapshot(images) as StoredImage[]);
      lastError = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastError = message;
      console.error("[imageLibrary] save failed — images will not persist", err);
      throw err;
    }
  }

  async function persist() {
    if (editing) return;
    await safeSave();
  }

  function beginEdit() {
    if (!loaded) {
      editSnapshot = null;
      editing = false;
      return;
    }
    editSnapshot = structuredClone($state.snapshot(images)) as StoredImage[];
    editing = true;
  }

  async function commitEdit() {
    editing = false;
    editSnapshot = null;
    await safeSave();
  }

  function cancelEdit() {
    if (editSnapshot) {
      images = editSnapshot;
    }
    editSnapshot = null;
    editing = false;
  }

  function get(id: string | null | undefined): StoredImage | null {
    if (!id) return null;
    return images.find((img) => img.id === id) ?? null;
  }

  async function addFromDataUrl(name: string, dataUrl: string): Promise<StoredImage> {
    await ensureLoaded();
    const hash = await sha256Hex(dataUrl);
    const existing = images.find((img) => img.hash === hash);
    if (existing) return existing;
    const record: StoredImage = {
      id: newId(),
      name: name || "Untitled",
      dataUrl,
      bytes: approxBytes(dataUrl),
      hash,
      createdAt: Date.now(),
    };
    images.push(record);
    try {
      await persist();
    } catch (err) {
      images = images.filter((img) => img.id !== record.id);
      throw err;
    }
    return record;
  }

  async function addFromFile(file: File): Promise<StoredImage> {
    const dataUrl = await fileToDataUrl(file);
    return addFromDataUrl(file.name || "Untitled", dataUrl);
  }

  function remove(id: string): void {
    images = images.filter((img) => img.id !== id);
    void persist();
  }

  function rename(id: string, name: string): void {
    const img = images.find((i) => i.id === id);
    if (!img) return;
    img.name = name;
    void persist();
  }

  async function replaceAll(next: StoredImage[]): Promise<void> {
    await ensureLoaded();
    images = next.map((img) => ({ ...img }));
    await safeSave();
  }

  return {
    get images() {
      return images;
    },
    get loaded() {
      return loaded;
    },
    get lastError() {
      return lastError;
    },
    load,
    get,
    addFromDataUrl,
    addFromFile,
    remove,
    rename,
    replaceAll,
    beginEdit,
    commitEdit,
    cancelEdit,
  };
}

export const imageLibrary = createStore();
