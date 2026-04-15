import { zip, unzip, type Unzipped, type Zippable } from "fflate";
import type { GlobalSettings, WidgetStylePreset } from "./types.js";
import type { GridLayout, WidgetInstance } from "$lib/widgets/types.js";
import type { StoredImage } from "$lib/storage/imageLibrary.svelte.js";

export type ExportedImageManifest = {
  id: string;
  name: string;
  hash: string;
  bytes: number;
  createdAt: number;
  file: string;
  mime: string;
};

export type ExportBundleV1 = {
  version: 1;
  settings: GlobalSettings;
  layout: GridLayout;
};

export type ExportBundleV2 = {
  version: 2;
  exportedAt: string;
  settings: GlobalSettings;
  layout: GridLayout;
  images: ExportedImageManifest[];
};

export type ParsedImport = {
  settings?: GlobalSettings;
  layout?: GridLayout;
  images?: StoredImage[];
  warnings: string[];
};

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

function extFromMime(mime: string): string {
  return MIME_EXT[mime.toLowerCase()] ?? "bin";
}

function mimeFromDataUrl(dataUrl: string): string {
  const m = /^data:([^;,]+)[;,]/.exec(dataUrl);
  return m ? m[1] : "application/octet-stream";
}

/** Decode a data URL into its raw bytes + mime. */
export function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; mime: string } {
  const mime = mimeFromDataUrl(dataUrl);
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return { bytes: new Uint8Array(), mime };
  const header = dataUrl.slice(0, comma);
  const payload = dataUrl.slice(comma + 1);
  if (header.includes(";base64")) {
    const binary = atob(payload);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return { bytes: out, mime };
  }
  // Rare: URL-encoded text payload.
  const text = decodeURIComponent(payload);
  return { bytes: new TextEncoder().encode(text), mime };
}

/** Encode raw bytes + mime into a base64 data URL (used on import rehydration). */
export function bytesToDataUrl(bytes: Uint8Array, mime: string): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, Math.min(i + chunk, bytes.length))),
    );
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

/** Walk settings + layout and return every image ID actually referenced. */
export function collectReferencedImageIds(
  settings: GlobalSettings,
  layout: GridLayout,
): Set<string> {
  const ids = new Set<string>();
  const add = (id: string | null | undefined) => {
    if (typeof id === "string" && id.length > 0) ids.add(id);
  };
  add(settings.background.image.imageId);
  add(settings.widgetDefaults.background.image.imageId);
  for (const preset of settings.widgetPresets as WidgetStylePreset[]) {
    add(preset.style?.background?.image?.imageId);
  }
  for (const instance of layout.instances as WidgetInstance[]) {
    if (instance.widgetId === "picture") {
      const picSettings = instance.settings as { imageId?: string } | null | undefined;
      add(picSettings?.imageId);
    }
    add(instance.styleOverrides?.background?.image?.imageId);
  }
  return ids;
}

async function fflateZip(input: Zippable): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    zip(input, { level: 0 }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

async function fflateUnzip(input: Uint8Array): Promise<Unzipped> {
  return new Promise((resolve, reject) => {
    unzip(input, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

/**
 * Build a ZIP export containing config.json + images/<id>.<ext> for every
 * referenced image. Unreferenced images are dropped (implicit GC).
 */
export async function buildZipExport(
  settings: GlobalSettings,
  layout: GridLayout,
  allImages: readonly StoredImage[],
): Promise<Uint8Array> {
  const referenced = collectReferencedImageIds(settings, layout);
  const byId = new Map(allImages.map((img) => [img.id, img]));

  const imagesDir: Record<string, Uint8Array> = {};
  const manifest: ExportedImageManifest[] = [];

  for (const id of referenced) {
    const img = byId.get(id);
    if (!img) continue;
    const { bytes, mime } = dataUrlToBytes(img.dataUrl);
    const ext = extFromMime(mime);
    const file = `${img.id}.${ext}`;
    imagesDir[file] = bytes;
    manifest.push({
      id: img.id,
      name: img.name,
      hash: img.hash,
      bytes: img.bytes,
      createdAt: img.createdAt,
      file,
      mime,
    });
  }

  const bundle: ExportBundleV2 = {
    version: 2,
    exportedAt: new Date().toISOString(),
    settings,
    layout,
    images: manifest,
  };

  const configBytes = new TextEncoder().encode(JSON.stringify(bundle, null, 2));

  const tree: Zippable = {
    "config.json": configBytes,
    images: imagesDir,
  };

  return fflateZip(tree);
}

/** Parse a JSON-only (v1) or embedded v2 text blob. */
export function parseJsonImport(text: string): ParsedImport {
  const warnings: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON: ${(err as Error).message}`);
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("JSON must be an object.");
  }
  const obj = parsed as {
    settings?: GlobalSettings;
    layout?: GridLayout;
  };
  if (!obj.settings && !obj.layout) {
    throw new Error("No `settings` or `layout` field found.");
  }
  return {
    settings: obj.settings,
    layout: obj.layout,
    warnings,
  };
}

/** Parse a ZIP export and rehydrate the image library entries. */
export async function parseZipImport(bytes: Uint8Array): Promise<ParsedImport> {
  const warnings: string[] = [];
  const entries = await fflateUnzip(bytes);

  const configEntry = entries["config.json"];
  if (!configEntry) throw new Error("ZIP is missing config.json.");

  const text = new TextDecoder().decode(configEntry);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid config.json: ${(err as Error).message}`);
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("config.json must be an object.");
  }

  const bundle = parsed as Partial<ExportBundleV2>;
  const bundleSettings = bundle.settings as GlobalSettings | undefined;
  const bundleLayout = bundle.layout as GridLayout | undefined;
  if (!bundleSettings && !bundleLayout) {
    throw new Error("config.json has no settings or layout.");
  }

  const rehydrated: StoredImage[] = [];
  const manifest = Array.isArray(bundle.images) ? bundle.images : [];
  for (const entry of manifest) {
    const filename = `images/${entry.file}`;
    const fileBytes = entries[filename];
    if (!fileBytes) {
      warnings.push(`Missing image file ${filename} referenced by manifest (id=${entry.id}).`);
      continue;
    }
    const dataUrl = bytesToDataUrl(fileBytes, entry.mime || "application/octet-stream");
    rehydrated.push({
      id: entry.id,
      name: entry.name ?? "Untitled",
      dataUrl,
      bytes: fileBytes.byteLength,
      hash: entry.hash ?? "",
      createdAt: typeof entry.createdAt === "number" ? entry.createdAt : Date.now(),
    });
  }

  // Optional integrity check: referenced IDs must exist in the rehydrated set.
  if (bundleSettings && bundleLayout) {
    const referenced = collectReferencedImageIds(bundleSettings, bundleLayout);
    const have = new Set(rehydrated.map((i) => i.id));
    const missing: string[] = [];
    for (const id of referenced) {
      if (!have.has(id)) missing.push(id);
    }
    if (missing.length > 0) {
      warnings.push(
        `${missing.length} image reference(s) could not be restored: ${missing.join(", ")}`,
      );
    }
  }

  return {
    settings: bundleSettings,
    layout: bundleLayout,
    images: rehydrated,
    warnings,
  };
}

export function downloadBlob(
  data: string | Uint8Array | ArrayBuffer,
  mime: string,
  filename: string,
): void {
  // Explicitly convert Uint8Array -> ArrayBuffer to avoid
  // SharedArrayBuffer-related typing friction with BlobPart.
  const payload: BlobPart =
    data instanceof Uint8Array
      ? (data.slice().buffer as ArrayBuffer)
      : (data as string | ArrayBuffer);
  const blob = new Blob([payload], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function isoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
