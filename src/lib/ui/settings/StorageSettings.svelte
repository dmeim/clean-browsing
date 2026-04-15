<script lang="ts">
  import { settingsStore } from "$lib/settings/store.svelte.js";
  import { gridStore } from "$lib/grid/store.svelte.js";
  import { imageLibrary } from "$lib/storage/imageLibrary.svelte.js";
  import type { PictureSettings } from "$lib/widgets/picture/definition.js";

  type Usage = {
    background: boolean;
    pictureInstanceIds: string[];
  };

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function computeUsage(imageId: string): Usage {
    const bg = settingsStore.settings.background;
    const background = bg.type === "image" && bg.image.imageId === imageId;
    const pictureInstanceIds = gridStore.layout.instances
      .filter((inst) => {
        if (inst.widgetId !== "picture") return false;
        const s = inst.settings as PictureSettings;
        return s?.imageId === imageId;
      })
      .map((inst) => inst.instanceId);
    return { background, pictureInstanceIds };
  }

  function usageLabel(usage: Usage): string {
    const parts: string[] = [];
    if (usage.background) parts.push("page background");
    if (usage.pictureInstanceIds.length > 0) {
      const n = usage.pictureInstanceIds.length;
      parts.push(`${n} picture widget${n === 1 ? "" : "s"}`);
    }
    return parts.length === 0 ? "Unused" : `Used by ${parts.join(" + ")}`;
  }

  function clearReferences(imageId: string, usage: Usage) {
    if (usage.background) {
      settingsStore.updateBackground((b) => {
        b.image.imageId = null;
      });
    }
    for (const instanceId of usage.pictureInstanceIds) {
      const inst = gridStore.layout.instances.find((i) => i.instanceId === instanceId);
      if (!inst) continue;
      gridStore.updateWidgetSettings(instanceId, {
        ...(inst.settings as PictureSettings),
        imageId: "",
      });
    }
  }

  function deleteImage(id: string) {
    const img = imageLibrary.get(id);
    if (!img) return;
    const usage = computeUsage(id);
    const label = usageLabel(usage);
    const warning =
      usage.background || usage.pictureInstanceIds.length > 0
        ? `\n\nWarning: ${label}. These will be cleared.`
        : "";
    if (!confirm(`Delete "${img.name}"?${warning}`)) return;
    clearReferences(id, usage);
    imageLibrary.remove(id);
  }

  function clearUnused() {
    const unused = imageLibrary.images.filter((img) => {
      const u = computeUsage(img.id);
      return !u.background && u.pictureInstanceIds.length === 0;
    });
    if (unused.length === 0) return;
    if (!confirm(`Delete ${unused.length} unused image(s)?`)) return;
    for (const img of unused) imageLibrary.remove(img.id);
  }

  const totalBytes = $derived(
    imageLibrary.images.reduce((sum, img) => sum + img.bytes, 0)
  );
</script>

<section class="panel">
  <header>
    <h3>Storage</h3>
    <p>Images stored in the local library. Reused across widgets and backgrounds.</p>
  </header>

  <div class="summary">
    <div>
      <div class="summary-label">Images</div>
      <div class="summary-value">{imageLibrary.images.length}</div>
    </div>
    <div>
      <div class="summary-label">Total size</div>
      <div class="summary-value">{formatBytes(totalBytes)}</div>
    </div>
    <div class="summary-actions">
      <button
        class="btn"
        disabled={imageLibrary.images.length === 0}
        onclick={clearUnused}
      >
        Clear unused
      </button>
    </div>
  </div>

  {#if imageLibrary.images.length === 0}
    <div class="empty">
      The library is empty. Upload an image from the Appearance tab or a Picture widget.
    </div>
  {:else}
    <ul class="items">
      {#each imageLibrary.images as img (img.id)}
        {@const usage = computeUsage(img.id)}
        {@const isUsed = usage.background || usage.pictureInstanceIds.length > 0}
        <li class="item">
          <img src={img.dataUrl} alt={img.name} />
          <div class="item-body">
            <div class="item-label">{img.name}</div>
            <div class="item-meta">
              {formatBytes(img.bytes)} · <span class:used={isUsed}>{usageLabel(usage)}</span>
            </div>
          </div>
          <button class="btn btn-danger" onclick={() => deleteImage(img.id)}>Delete</button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ui-btn-fg-strong);
  }
  header p {
    margin: 0.125rem 0 0;
    font-size: 0.8125rem;
    color: var(--ui-muted-fg);
  }
  .summary {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.875rem 1rem;
    background: var(--ui-panel-bg);
    border: 1px solid var(--ui-panel-border);
    border-radius: 0.5rem;
  }
  .summary-label {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ui-muted-fg);
  }
  .summary-value {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--ui-btn-fg-strong);
  }
  .summary-actions {
    margin-left: auto;
  }
  .empty {
    padding: 1.25rem;
    text-align: center;
    font-size: 0.8125rem;
    color: var(--ui-muted-fg);
    border: 1px dashed var(--ui-border-soft);
    border-radius: 0.5rem;
  }
  .items {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem;
    background: var(--ui-panel-bg);
    border: 1px solid var(--ui-panel-border);
    border-radius: 0.5rem;
  }
  .item img {
    width: 3rem;
    height: 3rem;
    object-fit: cover;
    border-radius: 0.375rem;
    border: 1px solid var(--ui-panel-border);
    background: var(--ui-deep-bg);
  }
  .item-body {
    flex: 1;
    min-width: 0;
  }
  .item-label {
    font-size: 0.8125rem;
    color: var(--ui-fg);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item-meta {
    font-size: 0.75rem;
    color: var(--ui-muted-fg);
  }
  .item-meta .used {
    color: var(--ui-success);
  }
  .btn {
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
    background: var(--ui-subtle-bg);
    border: 1px solid var(--ui-panel-border);
    color: var(--ui-fg);
    font-size: 0.8125rem;
    cursor: pointer;
  }
  .btn:hover:not(:disabled) {
    background: var(--ui-subtle-bg-hover);
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-danger {
    background: var(--ui-danger-bg);
    border-color: var(--ui-danger-border);
    color: var(--ui-danger-fg);
  }
  .btn-danger:hover:not(:disabled) {
    background: var(--ui-danger-bg-hover);
  }
</style>
