<script lang="ts">
  import { settingsStore } from "$lib/settings/store.svelte.js";
  import { gridStore } from "$lib/grid/store.svelte.js";
  import type { GlobalSettings } from "$lib/settings/types.js";
  import type { GridLayout } from "$lib/widgets/types.js";

  type Bundle = {
    version: 1;
    settings: GlobalSettings;
    layout: GridLayout;
  };

  let jsonText = $state("");
  let status = $state<{ kind: "ok" | "err" | "none"; message: string }>({
    kind: "none",
    message: "",
  });

  let fileInput: HTMLInputElement | null = $state(null);

  function buildBundle(): Bundle {
    return {
      version: 1,
      settings: $state.snapshot(settingsStore.settings) as GlobalSettings,
      layout: $state.snapshot(gridStore.layout) as GridLayout,
    };
  }

  function fillTextarea() {
    jsonText = JSON.stringify(buildBundle(), null, 2);
    status = { kind: "ok", message: "Current configuration loaded into editor." };
  }

  async function copyToClipboard() {
    const text = JSON.stringify(buildBundle(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      status = { kind: "ok", message: "Copied to clipboard." };
    } catch {
      jsonText = text;
      status = { kind: "ok", message: "Clipboard blocked — copied into editor below." };
    }
  }

  function downloadFile() {
    const blob = new Blob([JSON.stringify(buildBundle(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clean-browsing-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    status = { kind: "ok", message: "Download started." };
  }

  function applyBundle(raw: string) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      status = { kind: "err", message: `Invalid JSON: ${(err as Error).message}` };
      return;
    }
    if (!parsed || typeof parsed !== "object") {
      status = { kind: "err", message: "JSON must be an object." };
      return;
    }
    const obj = parsed as Partial<Bundle>;
    if (obj.settings) settingsStore.replaceAll(obj.settings as GlobalSettings);
    if (obj.layout) gridStore.replaceLayout(obj.layout as GridLayout);
    if (!obj.settings && !obj.layout) {
      status = { kind: "err", message: "No `settings` or `layout` field found." };
      return;
    }
    status = { kind: "ok", message: "Configuration imported." };
  }

  function importFromTextarea() {
    if (!jsonText.trim()) {
      status = { kind: "err", message: "Paste JSON into the editor first." };
      return;
    }
    applyBundle(jsonText);
  }

  function onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      jsonText = text;
      applyBundle(text);
    };
    reader.onerror = () => {
      status = { kind: "err", message: "Failed to read file." };
    };
    reader.readAsText(file);
    input.value = "";
  }
</script>

<section class="panel">
  <header>
    <h3>Configuration</h3>
    <p>Export or import your settings and layout as JSON.</p>
  </header>

  <div class="row">
    <button class="btn" onclick={fillTextarea}>Load current</button>
    <button class="btn" onclick={copyToClipboard}>Copy to clipboard</button>
    <button class="btn btn-primary" onclick={downloadFile}>Download JSON</button>
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
      accept="application/json,.json"
      onchange={onFileChange}
      hidden
    />
  </div>

  {#if status.kind !== "none"}
    <p class="status" class:err={status.kind === "err"}>{status.message}</p>
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
  .status {
    margin: 0;
    font-size: 0.8125rem;
    color: rgb(134 239 172);
  }
  .status.err {
    color: rgb(248 113 113);
  }
</style>
