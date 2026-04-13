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

async function loadRaw(): Promise<StoredImage[]> {
  try {
    if (hasExtensionStorage()) {
      const result = await browser!.storage!.local!.get(STORAGE_KEY);
      const value = result[STORAGE_KEY];
      return Array.isArray(value) ? (value as StoredImage[]) : [];
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredImage[]) : [];
  } catch (err) {
    console.error("[imageLibrary] load failed", err);
    return [];
  }
}

async function saveRaw(images: StoredImage[]): Promise<void> {
  try {
    if (hasExtensionStorage()) {
      await browser!.storage!.local!.set({ [STORAGE_KEY]: images });
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  } catch (err) {
    console.error("[imageLibrary] save failed", err);
  }
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
  let editSnapshot: StoredImage[] | null = null;
  let editing = false;

  async function load() {
    images = await loadRaw();
    loaded = true;
  }

  async function persist() {
    if (editing) return;
    await saveRaw($state.snapshot(images) as StoredImage[]);
  }

  function beginEdit() {
    editSnapshot = structuredClone($state.snapshot(images)) as StoredImage[];
    editing = true;
  }

  async function commitEdit() {
    editing = false;
    editSnapshot = null;
    await saveRaw($state.snapshot(images) as StoredImage[]);
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
    void persist();
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

  return {
    get images() {
      return images;
    },
    get loaded() {
      return loaded;
    },
    load,
    get,
    addFromDataUrl,
    addFromFile,
    remove,
    rename,
    beginEdit,
    commitEdit,
    cancelEdit,
  };
}

export const imageLibrary = createStore();
