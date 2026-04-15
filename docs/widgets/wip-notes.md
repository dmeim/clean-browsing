# Notes Widget (WIP)

> **Status:** ⭕ Planned
>
> **Stage:** Planning / brainstorming
>
> This is a design document for a widget that does **not** ship yet. Everything on this page is provisional — scope, settings, and even the widget ID may change before (or if) it lands.

## Overview

A sticky-note widget for quick capture: multi-line text with light formatting, auto-save to `browser.storage.local`, and a plain-text export. Aimed at ad-hoc scratch notes and reminders on the new-tab page, not at being a full notes app.

Since Clean Browsing is local-first with no network calls, Notes is stored entirely inside the widget instance settings alongside the rest of the grid.

## Core features

- Multi-line text editing in a `<textarea>` (or `contenteditable` for the rich-text variant).
- Debounced auto-save to `browser.storage.local` through the grid store — no manual save button.
- Optional light formatting (bold, italic, monospace). Rich-text content stored as sanitized HTML.
- Character/word count display in the widget corner.
- Export current note to a `.txt` or `.md` file via a `Blob` + download link.
- Content scales to whatever size the grid cell is using `widgetScaler`.

## Open design questions

1. **Plain vs rich text.** A plain `<textarea>` keeps the widget trivial, lean, and perfectly aligned with the project's "no heavy deps" ethos. Rich text means pulling in a sanitizer (`DOMPurify`) and either rolling a minimal toolbar on top of `contenteditable` or adopting a small editor like Tiptap. **Lean preference: start with plain text + a small Markdown preview toggle.** Revisit rich text only if users ask for it.
2. **Per-widget vs multi-note.** Each Notes widget holds one note; multi-note with tabs is a future enhancement. Multiple notes can already be modeled by dropping multiple Notes widgets on the grid.
3. **Storage size.** `browser.storage.local` is the grid layout store. A 100 KB note multiplied across many widgets is fine; a 5 MB note pushes against the per-extension quota. A soft character cap (e.g. 20 000 chars) is a good default.

## Proposed widget ID & source layout

- **Widget ID:** `notes`
- **Default size:** 6 × 4 (grid cells)
- **Source (proposed):** `src/lib/widgets/notes/`
  - `Notes.svelte` — the editor, reads `$props()` as `WidgetProps<NotesSettings>`.
  - `NotesSettings.svelte` — config form, same props shape, calls `updateSettings(next)`.
  - `definition.ts` — exports the `NotesSettings` type and a `WidgetDefinition<NotesSettings>`, calls `registerWidget(def)` at module load.
- **Registry wiring:** add `import "./notes/definition.js";` to `src/lib/widgets/index.ts`.

## Proposed settings type

Following the Svelte 5 / TypeScript conventions in the rest of the codebase (see `src/lib/widgets/clock/definition.ts` as the reference example):

```ts
// src/lib/widgets/notes/definition.ts
export type NotesSettings = {
  content: string; // the note body (plain text or sanitized HTML)
  format: "plain" | "markdown" | "rich"; // rendering mode
  fontFamily: "sans" | "serif" | "mono";
  fontSize: number; // base px, scales with widgetScaler
  autoSaveMs: number; // debounce interval (default 500)
  maxCharacters: number; // 0 = unlimited
  wordWrap: boolean;
  showCounter: boolean; // char/word counter overlay
  lastSavedAt: number; // epoch ms, written by the widget itself
  paddingV: number; // px, top+bottom inset (matches other widgets)
  paddingH: number; // px, left+right inset
};
```

Positioning (`x`, `y`, `w`, `h`) is **not** part of widget settings — the grid store (`src/lib/grid/store.svelte.ts`) owns placement and persists the whole layout under the `clean-browsing:layout:v2` key. Widget settings only describe the widget itself.

## Settings form outline

| Setting                | Control          | Default  | Notes                                                           |
| ---------------------- | ---------------- | -------- | --------------------------------------------------------------- |
| **Font family**        | select           | `sans`   | Three options mapping to tokens in `src/app.css`.               |
| **Font size**          | range 12–24 px   | `14`     | Feeds into `widgetScaler` as the base size.                     |
| **Format**             | segmented select | `plain`  | Plain / Markdown preview / Rich (if/when enabled).              |
| **Auto-save**          | select           | `500 ms` | Options: `250`, `500`, `1000`, `manual`.                        |
| **Max characters**     | number           | `0`      | `0` = unlimited. Shows a soft warning when approaching the cap. |
| **Word wrap**          | toggle           | `on`     | Standard `white-space` handling.                                |
| **Show counter**       | toggle           | `on`     | Small char/word overlay in the bottom-right corner.             |
| **Export**             | button           | —        | Triggers a `.txt` download of the current note.                 |
| **Vertical padding**   | range 0–80 px    | `8`      | Matches the padding convention used by clock/date/search.       |
| **Horizontal padding** | range 0–80 px    | `12`     | Same.                                                           |

## Implementation notes

- **Persistence.** The widget never touches `browser.storage.local` directly — it calls `updateSettings({ ...settings, content: newText })` and the grid store batches the write. Debounce on the widget side so a fast typist doesn't fire a storage write per keystroke.
- **Sanitization.** Only needed if rich text lands. Use `DOMPurify` (small, tree-shakeable) and run input through it before storing.
- **Export.** Build a `Blob` from the content and trigger a `<a download>` click. No file-system API, no permissions needed.
- **Styling.** Tailwind v4 utilities first; reach for `<style>` only for things utilities can't express (e.g. `field-sizing: content` for auto-grow). Use the existing widget chrome CSS variables (`--widget-background`, `--widget-border`, etc.) rather than hardcoding colors.
- **shadcn-svelte primitives.** Use the existing `Button`, `Select`, `Switch`, `Slider` components under `src/lib/components/ui/` for the settings form so it matches the rest of the UI.

## Manifest impact

None. Notes only needs `storage` and `unlimitedStorage`, which are already in `public/manifest.json`.

## Testing checklist (Firefox MV2)

- [ ] Widget appears in the **Add widget** dialog.
- [ ] Settings dialog opens, changes persist, and a reload restores them.
- [ ] Drag and resize work in edit mode without losing text.
- [ ] Auto-save fires at the configured interval, no storage-write storm while typing.
- [ ] Global widget chrome settings (background, border, blur) apply correctly.
- [ ] Export button produces a `.txt` file with the current content.
- [ ] Character counter updates without lag for large notes.
- [ ] `npm run check` passes cleanly.

## Out of scope for v1

Cloud sync, multi-note tabs, collaborative editing, voice input, handwriting, and markdown syntax highlighting. These are all listed as future enhancements but shouldn't block shipping the basic widget.
