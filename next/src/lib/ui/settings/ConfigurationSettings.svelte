<script lang="ts">
  import { settingsStore } from "$lib/settings/store.svelte.js";
  import { gridStore } from "$lib/grid/store.svelte.js";
  import { imageLibrary } from "$lib/storage/imageLibrary.svelte.js";
  import type { GlobalSettings } from "$lib/settings/types.js";
  import type { GridLayout } from "$lib/widgets/types.js";
  import {
    buildZipExport,
    parseJsonImport,
    parseZipImport,
    downloadBlob,
    isoDate,
    type ParsedImport,
  } from "$lib/settings/exportBundle.js";

  type JsonBundle = {
    version: 1;
    settings: GlobalSettings;
    layout: GridLayout;
  };

  let jsonText = $state("");
  let status = $state<{ kind: "ok" | "err" | "warn" | "none"; message: string }>({
    kind: "none",
    message: "",
  });

  let fileInput: HTMLInputElement | null = $state(null);

  function snapshot(): { settings: GlobalSettings; layout: GridLayout } {
    return {
      settings: $state.snapshot(settingsStore.settings) as GlobalSettings,
      layout: $state.snapshot(gridStore.layout) as GridLayout,
    };
  }

  function buildJsonBundle(): JsonBundle {
    const snap = snapshot();
    return { version: 1, ...snap };
  }

  function fillTextarea() {
    jsonText = JSON.stringify(buildJsonBundle(), null, 2);
    status = { kind: "ok", message: "Current configuration loaded into editor." };
  }

  async function copyToClipboard() {
    const text = JSON.stringify(buildJsonBundle(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      status = { kind: "ok", message: "Copied to clipboard." };
    } catch {
      jsonText = text;
      status = { kind: "ok", message: "Clipboard blocked — copied into editor below." };
    }
  }

  function downloadJson() {
    const text = JSON.stringify(buildJsonBundle(), null, 2);
    downloadBlob(text, "application/json", `clean-browsing-${isoDate()}.json`);
    status = { kind: "ok", message: "JSON download started." };
  }

  async function downloadZip() {
    try {
      const snap = snapshot();
      const zipped = await buildZipExport(snap.settings, snap.layout, imageLibrary.images);
      downloadBlob(zipped, "application/zip", `clean-browsing-${isoDate()}.zip`);
      const refCount = countImageRefs(snap.settings, snap.layout);
      status = {
        kind: "ok",
        message: `ZIP download started (${refCount} image${refCount === 1 ? "" : "s"} bundled).`,
      };
    } catch (err) {
      status = { kind: "err", message: `Failed to build ZIP: ${(err as Error).message}` };
    }
  }

  function countImageRefs(settings: GlobalSettings, layout: GridLayout): number {
    // Lightweight duplicate of collectReferencedImageIds so the status line can
    // show a count without importing the walker explicitly here.
    const ids = new Set<string>();
    const add = (id: string | null | undefined) => {
      if (typeof id === "string" && id.length > 0) ids.add(id);
    };
    add(settings.background.image.imageId);
    add(settings.widgetDefaults.background.image.imageId);
    for (const preset of settings.widgetPresets) {
      add(preset.style?.background?.image?.imageId);
    }
    for (const inst of layout.instances) {
      if (inst.widgetId === "picture") {
        add((inst.settings as { imageId?: string } | null | undefined)?.imageId);
      }
      add(inst.styleOverrides?.background?.image?.imageId);
    }
    return ids.size;
  }

  async function applyParsed(parsed: ParsedImport, source: string) {
    if (parsed.images) {
      await imageLibrary.replaceAll(parsed.images);
    }
    if (parsed.settings) settingsStore.replaceAll(parsed.settings);
    if (parsed.layout) gridStore.replaceLayout(parsed.layout);
    if (parsed.warnings.length > 0) {
      status = {
        kind: "warn",
        message: `${source} imported with warnings: ${parsed.warnings.join(" ")}`,
      };
    } else {
      status = { kind: "ok", message: `${source} imported.` };
    }
  }

  async function importFromTextarea() {
    if (!jsonText.trim()) {
      status = { kind: "err", message: "Paste JSON into the editor first." };
      return;
    }
    try {
      const parsed = parseJsonImport(jsonText);
      await applyParsed(parsed, "Configuration");
    } catch (err) {
      status = { kind: "err", message: (err as Error).message };
    }
  }

  async function handleJsonFile(file: File) {
    const text = await file.text();
    jsonText = text;
    const parsed = parseJsonImport(text);
    await applyParsed(parsed, file.name);
  }

  async function handleZipFile(file: File) {
    const buffer = await file.arrayBuffer();
    const parsed = await parseZipImport(new Uint8Array(buffer));
    await applyParsed(parsed, file.name);
  }

  async function onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.name.toLowerCase().endsWith(".zip")) {
        await handleZipFile(file);
      } else {
        await handleJsonFile(file);
      }
    } catch (err) {
      status = { kind: "err", message: `Import failed: ${(err as Error).message}` };
    }
    input.value = "";
  }
</script>

<section class="panel">
  <header>
    <h3>Configuration</h3>
    <p>Export or import your settings, layout, and image library.</p>
  </header>

  <div class="row">
    <button class="btn" onclick={fillTextarea}>Load current</button>
    <button class="btn" onclick={copyToClipboard}>Copy to clipboard</button>
    <button class="btn" onclick={downloadJson}>Download JSON</button>
    <button class="btn btn-primary" onclick={downloadZip}>Download ZIP (with images)</button>
  </div>

  <textarea
    bind:value={jsonText}
    placeholder="Paste configuration JSON here, or click Load current to populate."
    spellcheck="false"
    rows="14"
  ></textarea>

  <div class="row">
    <button class="btn btn-primary" onclick={importFromTextarea}>Import from editor</button>
    <button class="btn" onclick={() => fileInput?.click()}>Import from file…</button>
    <input
      bind:this={fileInput}
      type="file"
      accept="application/json,application/zip,.json,.zip"
      onchange={onFileChange}
      hidden
    />
  </div>

  <p class="hint">
    JSON exports include settings and layout only. ZIP exports bundle every referenced image
    so picture widgets and image backgrounds restore exactly.
  </p>

  {#if status.kind !== "none"}
    <p class="status" class:err={status.kind === "err"} class:warn={status.kind === "warn"}>
      {status.message}
    </p>
  {/if}
</section>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }
  header h3 {
    font-size: 1rem;
    font-weight: 600;
    color: rgb(241 245 249);
    margin: 0;
  }
  header p {
    margin: 0.125rem 0 0;
    font-size: 0.8125rem;
    color: rgb(148 163 184);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  textarea {
    width: 100%;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.75rem;
    line-height: 1.5;
    padding: 0.75rem;
    border-radius: 0.5rem;
    background: rgb(2 6 23 / 0.6);
    border: 1px solid rgb(51 65 85);
    color: rgb(226 232 240);
    resize: vertical;
  }
  textarea:focus {
    outline: none;
    border-color: rgb(59 130 246);
  }
  .btn {
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
    background: rgb(30 41 59);
    border: 1px solid rgb(51 65 85);
    color: rgb(226 232 240);
    font-size: 0.8125rem;
    cursor: pointer;
    transition: background 120ms ease, border-color 120ms ease;
  }
  .btn:hover {
    background: rgb(51 65 85);
    border-color: rgb(71 85 105);
  }
  .btn-primary {
    background: rgb(37 99 235);
    border-color: rgb(37 99 235);
    color: white;
  }
  .btn-primary:hover {
    background: rgb(29 78 216);
    border-color: rgb(29 78 216);
  }
  .hint {
    margin: 0;
    font-size: 0.75rem;
    color: rgb(100 116 139);
    line-height: 1.5;
  }
  .status {
    margin: 0;
    font-size: 0.8125rem;
    color: rgb(134 239 172);
  }
  .status.warn {
    color: rgb(250 204 21);
  }
  .status.err {
    color: rgb(248 113 113);
  }
</style>
