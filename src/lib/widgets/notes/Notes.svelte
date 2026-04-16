<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import type { WidgetProps } from "$lib/widgets/types.js";
  import { widgetScaler } from "$lib/grid/widgetScaler.js";
  import { uiStore } from "$lib/ui/uiStore.svelte.js";
  import type { NotesSettings } from "./definition.js";
  import { renderMarkdown, toggleTaskAt, removeCompletedTasks } from "./markdown.js";

  let { settings, updateSettings }: WidgetProps<NotesSettings> = $props();

  // Backfill legacy instances that are missing any of the newer fields.
  const fontFamily = $derived(settings.fontFamily ?? "sans");
  const fontSize = $derived(settings.fontSize ?? 14);
  const maxCharacters = $derived(settings.maxCharacters ?? 0);
  const showCounter = $derived(settings.showCounter ?? false);
  const padV = $derived(settings.paddingV ?? 12);
  const padH = $derived(settings.paddingH ?? 16);
  const content = $derived(settings.content ?? "");

  const isEmpty = $derived(content.trim().length === 0);
  const html = $derived(renderMarkdown(content));

  const hasCompleted = $derived(/^[ \t]*(?:(?:[-*+]|\d+\.)[ \t]+)?\[(?:x|X)\]/m.test(content));

  const charCount = $derived(content.length);
  const wordCount = $derived(content.trim() === "" ? 0 : content.trim().split(/\s+/).length);

  const fontStack = $derived.by(() => {
    if (fontFamily === "serif") return 'Georgia, Cambria, "Times New Roman", Times, serif';
    if (fontFamily === "mono") return 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
    return 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  });

  let hovered = $state(false);
  let editOpen = $state(false);
  let draft = $state("");
  let overLimit = $derived(maxCharacters > 0 && draft.length > maxCharacters);
  let nearLimit = $derived(maxCharacters > 0 && !overLimit && draft.length > maxCharacters * 0.9);

  function openEditor() {
    if (uiStore.editMode) return;
    draft = content;
    editOpen = true;
  }

  function saveEditor() {
    const next = maxCharacters > 0 ? draft.slice(0, maxCharacters) : draft;
    updateSettings({ ...settings, content: next });
    editOpen = false;
  }

  function cancelEditor() {
    editOpen = false;
  }

  function handleDialogOpenChange(next: boolean) {
    if (!next) cancelEditor();
  }

  function clearCompleted(ev: MouseEvent) {
    ev.stopPropagation();
    updateSettings({ ...settings, content: removeCompletedTasks(content) });
  }

  let bodyEl: HTMLDivElement | undefined = $state();

  // {@html} content isn't Svelte-managed, so bind click listeners directly
  // to each rendered task checkbox after every re-render.
  $effect(() => {
    // Track html so this effect reruns on every content change.
    void html;
    if (!bodyEl) return;
    if (uiStore.editMode) return;
    const boxes = Array.from(bodyEl.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    const disposers: Array<() => void> = [];
    boxes.forEach((box, idx) => {
      const handler = (ev: Event) => {
        ev.preventDefault();
        ev.stopPropagation();
        const nextSource = toggleTaskAt(content, idx);
        updateSettings({ ...settings, content: nextSource });
      };
      box.addEventListener("click", handler);
      disposers.push(() => box.removeEventListener("click", handler));
    });
    return () => {
      for (const d of disposers) d();
    };
  });

  function handleBodyDblClick(event: MouseEvent) {
    if (uiStore.editMode) return;
    const target = event.target as HTMLElement | null;
    // Don't hijack double-clicks on links or checkboxes.
    if (target?.closest("a")) return;
    if (target?.tagName === "INPUT") return;
    openEditor();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="widget-card notes"
  onmouseenter={() => (hovered = true)}
  onmouseleave={() => (hovered = false)}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="widget-inner notes-inner"
    style="top: {padV}px; bottom: {padV}px; left: {padH}px; right: {padH}px;"
    use:widgetScaler
    ondblclick={handleBodyDblClick}
  >
    {#if isEmpty}
      <button type="button" class="empty-hint" onclick={openEditor} disabled={uiStore.editMode}>
        Double-click to edit
      </button>
    {:else}
      <div
        bind:this={bodyEl}
        class="notes-body"
        style="font-family: {fontStack}; font-size: {fontSize}px;"
      >
        <!-- Sanitized by DOMPurify in renderMarkdown(). -->
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html html}
      </div>

      <button
        type="button"
        class="clear-completed"
        class:visible={hovered && hasCompleted && !uiStore.editMode}
        onclick={clearCompleted}
        ondblclick={(ev) => ev.stopPropagation()}
      >
        Clear completed
      </button>
    {/if}

    {#if showCounter && !isEmpty}
      <div class="counter">{charCount} · {wordCount}</div>
    {/if}
  </div>
</div>

<Dialog.Root open={editOpen} onOpenChange={handleDialogOpenChange}>
  <Dialog.Content
    class="bg-background border-border text-foreground flex !max-h-[min(90vh,680px)] w-[min(90vw,640px)] flex-col !gap-0 !p-0"
  >
    <div class="edit-header">
      <Dialog.Title class="edit-title">Edit note</Dialog.Title>
      <Dialog.Description class="edit-desc">
        Markdown with GFM task lists. Save to apply.
      </Dialog.Description>
    </div>

    <div class="edit-body">
      <textarea
        class="edit-textarea"
        bind:value={draft}
        spellcheck="true"
        placeholder="# My note&#10;&#10;- [ ] thing to do&#10;- [x] thing done"
      ></textarea>
      <div class="edit-meta">
        <span class="meta-count" class:warn={nearLimit} class:error={overLimit}>
          {draft.length}{maxCharacters > 0 ? ` / ${maxCharacters}` : ""}
        </span>
        {#if overLimit}
          <span class="meta-note error">Will be truncated on save.</span>
        {:else if nearLimit}
          <span class="meta-note warn">Approaching character limit.</span>
        {/if}
      </div>
    </div>

    <div class="edit-footer">
      <button type="button" class="btn" onclick={cancelEditor}>Cancel</button>
      <button type="button" class="btn btn-primary" onclick={saveEditor}>Save</button>
    </div>
  </Dialog.Content>
</Dialog.Root>

<style>
  .notes-inner {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .empty-hint {
    margin: auto;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: 1px dashed var(--widget-border, rgb(148 163 184 / 0.5));
    border-radius: 0.375rem;
    color: var(--widget-accent, rgb(148 163 184));
    font-size: 0.85rem;
    cursor: pointer;
    opacity: 0.8;
  }
  .empty-hint:hover:not(:disabled) {
    opacity: 1;
  }
  .empty-hint:disabled {
    cursor: default;
  }

  .notes-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    color: var(--widget-accent, rgb(241 245 249));
    line-height: 1.5;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .notes-body :global(h1),
  .notes-body :global(h2),
  .notes-body :global(h3),
  .notes-body :global(h4) {
    font-weight: 600;
    margin: 0.75em 0 0.35em;
    line-height: 1.2;
  }
  .notes-body :global(h1:first-child),
  .notes-body :global(h2:first-child),
  .notes-body :global(h3:first-child),
  .notes-body :global(h4:first-child),
  .notes-body :global(p:first-child),
  .notes-body :global(ul:first-child),
  .notes-body :global(ol:first-child) {
    margin-top: 0;
  }
  .notes-body :global(h1) {
    font-size: 1.4em;
  }
  .notes-body :global(h2) {
    font-size: 1.2em;
  }
  .notes-body :global(h3) {
    font-size: 1.08em;
  }
  .notes-body :global(p),
  .notes-body :global(ul),
  .notes-body :global(ol),
  .notes-body :global(blockquote),
  .notes-body :global(pre) {
    margin: 0.35em 0;
  }
  .notes-body :global(ul),
  .notes-body :global(ol) {
    padding-left: 1.25em;
  }
  .notes-body :global(ul) {
    list-style: disc;
  }
  .notes-body :global(ol) {
    list-style: decimal;
  }
  .notes-body :global(li:has(> .notes-task-checkbox)) {
    list-style: none;
    display: flex;
    align-items: flex-start;
    gap: 0.4em;
    margin-left: -1em;
  }
  .notes-body :global(.notes-task-checkbox) {
    pointer-events: auto !important;
    cursor: pointer;
    margin-top: 0.25em;
    accent-color: rgb(59 130 246);
  }
  .notes-body :global(a) {
    color: var(--widget-link, rgb(147 197 253));
    text-decoration: underline;
  }
  .notes-body :global(code) {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 0.9em;
    padding: 0.1em 0.3em;
    background: rgb(15 23 42 / 0.4);
    border-radius: 0.25em;
  }
  .notes-body :global(pre) {
    padding: 0.5em 0.6em;
    background: rgb(15 23 42 / 0.4);
    border-radius: 0.375em;
    overflow-x: auto;
  }
  .notes-body :global(pre code) {
    padding: 0;
    background: transparent;
  }
  .notes-body :global(blockquote) {
    padding-left: 0.75em;
    border-left: 3px solid var(--widget-border, rgb(148 163 184 / 0.5));
    color: var(--widget-muted, rgb(203 213 225));
  }
  .notes-body :global(hr) {
    border: none;
    border-top: 1px solid var(--widget-border, rgb(148 163 184 / 0.4));
    margin: 0.6em 0;
  }
  .notes-body :global(table) {
    border-collapse: collapse;
    margin: 0.5em 0;
  }
  .notes-body :global(th),
  .notes-body :global(td) {
    border: 1px solid var(--widget-border, rgb(148 163 184 / 0.4));
    padding: 0.25em 0.5em;
  }

  .clear-completed {
    position: absolute;
    top: 0;
    right: 0;
    padding: 0.1rem 0.35rem;
    font-size: 0.6rem;
    color: var(--widget-muted, rgb(148 163 184));
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(148 163 184 / 0.25);
    border-radius: 0.25rem;
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
  }
  .clear-completed.visible {
    opacity: 1;
    pointer-events: auto;
  }
  .clear-completed:hover {
    color: var(--widget-accent, rgb(241 245 249));
    background: rgb(15 23 42 / 0.7);
  }

  .counter {
    position: absolute;
    right: 0.4rem;
    bottom: 0.25rem;
    padding: 0.1rem 0.35rem;
    font-size: 0.7rem;
    color: var(--widget-muted, rgb(148 163 184));
    background: rgb(15 23 42 / 0.35);
    border-radius: 0.25rem;
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }

  .edit-header {
    padding: 1rem 1.25rem 0.75rem;
    border-bottom: 1px solid var(--ui-panel-border);
  }
  :global(.edit-title) {
    font-size: 1.0625rem !important;
    font-weight: 600 !important;
    color: var(--ui-btn-fg-strong) !important;
    margin: 0 !important;
  }
  :global(.edit-desc) {
    font-size: 0.8125rem !important;
    color: var(--ui-muted-fg) !important;
    margin-top: 0.125rem !important;
  }
  .edit-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
  }
  .edit-textarea {
    flex: 1;
    min-height: 240px;
    width: 100%;
    padding: 0.6rem 0.75rem;
    background: var(--ui-input-bg);
    border: 1px solid var(--ui-panel-border);
    border-radius: 0.375rem;
    color: var(--ui-fg);
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 0.85rem;
    line-height: 1.5;
    resize: vertical;
  }
  .edit-textarea:focus {
    outline: none;
    border-color: var(--ui-focus);
  }
  .edit-meta {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.75rem;
    color: var(--ui-muted-fg);
  }
  .meta-count {
    font-variant-numeric: tabular-nums;
  }
  .meta-note.warn,
  .meta-count.warn {
    color: var(--ui-warning);
  }
  .meta-note.error,
  .meta-count.error {
    color: var(--ui-error);
  }
  .edit-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--ui-panel-border);
    background: var(--ui-inset-bg);
  }
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    background: var(--ui-subtle-bg);
    border: 1px solid var(--ui-panel-border);
    color: var(--ui-fg);
    font-size: 0.8125rem;
    cursor: pointer;
  }
  .btn:hover {
    background: var(--ui-subtle-bg-hover);
  }
  .btn-primary {
    background: var(--ui-accent);
    border-color: var(--ui-accent);
    color: var(--ui-accent-fg);
  }
  .btn-primary:hover {
    background: var(--ui-accent-hover);
  }
</style>
