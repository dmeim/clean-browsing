# Clean Browsing — Developer Documentation

Clean Browsing is a Firefox (MV2) new-tab extension: a persistent grid of draggable, resizable widgets, all local-first. This doc covers the codebase at the repo root, built on **Svelte 5**, **Vite**, **TypeScript**, **Tailwind v4**, and **shadcn-svelte**.

> 🚧 The older docs in this folder (`WIDGET_DEVELOPMENT.md`, `STYLING_GUIDE.md`, `COMPONENT_RULES.md`, `UI_BEHAVIOR.md`) still describe the legacy vanilla-JS build that was removed in v1.0.0 (preserved at the `legacy-final` git tag) and are being rewritten.

---

## 🧱 Stack

| Layer          | Choice                                                   |
| -------------- | -------------------------------------------------------- |
| Framework      | Svelte 5 with runes (`$state`, `$derived`, `$props`)     |
| Bundler        | Vite 6 (`@sveltejs/vite-plugin-svelte`)                  |
| Language       | TypeScript 5                                             |
| Styling        | Tailwind CSS v4 (`@tailwindcss/vite`, no PostCSS config) |
| Components     | shadcn-svelte on top of `bits-ui` + `tailwind-variants`  |
| Icons          | `lucide-svelte`                                          |
| Dates          | `dayjs`                                                  |
| Extension tool | `web-ext` (Firefox reload loop)                          |
| Target         | Manifest V2 Firefox extension                            |

---

## 🚀 Getting Started

Prerequisites: Node 20+, npm, Firefox.

```bash
npm install

# Live dev: vite build --watch + web-ext run (Firefox auto-loads dist/)
npm run dev

# Production build → dist/
npm run build

# Svelte + TS diagnostics
npm run check
```

`npm run dev` runs two processes concurrently:

1. `vite build --watch` — rebuilds `dist/` on every save.
2. `web-ext run --source-dir=dist --target=firefox-desktop` — launches a dev Firefox with the extension installed and reloads it when `dist/` changes.

For a one-off manual load, use `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → pick `dist/manifest.json`.

---

## 📁 Project Layout

```
.
├── index.html                # Vite entry, becomes the new tab page
├── vite.config.ts            # svelte() + tailwindcss() plugins, $lib alias
├── tsconfig.json
├── svelte.config.js
├── public/
│   ├── manifest.json         # MV2; chrome_url_overrides.newtab = index.html
│   ├── icons/
│   └── resources/
└── src/
    ├── main.ts               # mount(App, { target: #app })
    ├── App.svelte            # Toolbar + Grid + dialogs
    ├── app.css               # @import "tailwindcss";
    └── lib/
        ├── grid/
        │   ├── Grid.svelte
        │   ├── GridItem.svelte
        │   └── store.svelte.ts
        ├── ui/
        │   ├── Toolbar.svelte
        │   ├── AddWidgetDialog.svelte
        │   ├── SettingsDialog.svelte
        │   ├── WidgetSettingsDialog.svelte
        │   └── uiStore.svelte.ts
        ├── widgets/
        │   ├── types.ts      # WidgetDefinition, WidgetInstance, GridLayout
        │   ├── registry.ts   # registerWidget / getWidget / listWidgets
        │   ├── index.ts      # side-effect imports of every definition.ts
        │   ├── clock/        # Clock.svelte, ClockSettings.svelte, definition.ts
        │   ├── date/
        │   ├── search/
        │   ├── calculator/
        │   └── picture/
        └── components/ui/    # shadcn-svelte primitives
            ├── button/
            ├── card/
            ├── dialog/
            ├── input/
            └── tooltip/
```

The `$lib` alias (`src/lib`) is configured in `vite.config.ts` and is the canonical import prefix.

---

## 🏗️ Architecture

### Grid Store — `src/lib/grid/store.svelte.ts`

A rune-based store that owns the single source of truth for layout:

```ts
type GridLayout = { cols: number; rows: number; instances: WidgetInstance[] };
type WidgetInstance = {
  instanceId: string;
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  settings: unknown;
};
```

Exposes (among others):

- `load()` — reads `clean-browsing:layout:v2` from `browser.storage.local` (falls back to `localStorage` when not running as an extension).
- `addWidget(id, pos?)` / `addWidgetAuto(id)` — creates an instance using the widget's `defaultSize` + `defaultSettings`. `addWidgetAuto` scans for the first free slot via `findFreeSlot`.
- `moveWidget`, `resizeWidget` — validated mutations.
- `canPlace(instanceId, x, y, w, h)` — checks grid bounds and rectangle overlap against every other instance (the caller's own instance is skipped so it can move in place).
- `removeWidget`, `updateWidgetSettings`, `resetLayout`.

All mutations call `persist()`, which writes the snapshotted `$state` back to storage.

### Grid Components — `Grid.svelte` + `GridItem.svelte`

- `Grid.svelte` sets `grid-template-columns: repeat(cols, 1fr)` / `grid-template-rows: repeat(rows, 1fr)` and iterates `gridStore.layout.instances`.
- `GridItem.svelte` handles drag and resize with pointer capture:
  - On pointer down, reads cell stride (cell width + gap) from the parent's computed style.
  - During drag, the preview follows the cursor freely — the widget visually floats over other tiles. `canPlace` is used to tag the hover spot as valid/invalid (the item gets a red outline when invalid) and to remember the last valid cell.
  - On pointer up, commits the current cell if valid, otherwise falls back to the last valid cell.
  - Resize uses the same pattern with width/height cell stride math.
- `class:jiggle` is applied when `uiStore.editMode` is on and nothing is interacting, producing the small rotation animation.

### UI Store — `src/lib/ui/uiStore.svelte.ts`

Tracks edit mode and which dialog is open (add widget, global settings, per-widget settings with the target `instanceId`). Toolbar and dialogs read/write through it.

### Widget Registry — `src/lib/widgets/registry.ts`

A `Map<string, WidgetDefinition>`:

```ts
type WidgetDefinition<TSettings = unknown> = {
  id: string;
  name: string;
  description?: string;
  component: Component<WidgetProps<TSettings>>;
  settingsComponent?: Component<WidgetSettingsProps<TSettings>>;
  defaultSize: GridSize;
  minSize?: GridSize;
  maxSize?: GridSize;
  defaultSettings: TSettings;
};
```

Each widget's `definition.ts` calls `registerWidget(def)` at module load. `src/lib/widgets/index.ts` side-effect-imports every definition so the registry is populated before the grid renders.

`GridItem.svelte` looks up `getWidget(instance.widgetId)` and renders `<def.component settings={instance.settings} updateSettings={...} />`. The "Add Widget" dialog enumerates via `listWidgets()`.

---

## 🧩 Adding a Widget

1. **Create the folder**: `src/lib/widgets/<name>/`
2. **Widget component** — `<Name>.svelte`:

   ```svelte
   <script lang="ts">
     import type { WidgetProps } from "$lib/widgets/types.js";
     import type { MySettings } from "./definition.js";
     let { settings, updateSettings }: WidgetProps<MySettings> = $props();
   </script>

   <div class="h-full w-full">...</div>
   ```

3. **Settings form** — `<Name>Settings.svelte`, same `$props()` shape, edits a local copy and calls `updateSettings(next)` on change.
4. **Definition** — `definition.ts`:

   ```ts
   import type { WidgetDefinition } from "$lib/widgets/types.js";
   import { registerWidget } from "$lib/widgets/registry.js";
   import MyWidget from "./MyWidget.svelte";
   import MyWidgetSettings from "./MyWidgetSettings.svelte";

   export type MySettings = {
     /* ... */
   };

   export const myWidgetDefinition: WidgetDefinition<MySettings> = {
     id: "my-widget",
     name: "My Widget",
     component: MyWidget,
     settingsComponent: MyWidgetSettings,
     defaultSize: { w: 4, h: 2 },
     minSize: { w: 2, h: 1 },
     defaultSettings: {
       /* ... */
     },
   };

   registerWidget(myWidgetDefinition);
   ```

5. **Register at startup** — add `import "./<name>/definition.js";` to `src/lib/widgets/index.ts`.
6. **Run `npm run dev`** and add the widget via the toolbar.

Sizes are in grid cells. Defaults are `cols: 24`, `rows: 16` (see `store.svelte.ts`).

---

## 🎨 Styling Conventions

- Tailwind v4 is loaded once via `src/app.css` (`@import "tailwindcss";`). No `tailwind.config.js` is required — v4 discovers content automatically.
- Prefer utility classes on Svelte markup; reach for `<style>` blocks only for grid-specific or animation logic that doesn't fit cleanly in utilities (see `GridItem.svelte` for an example).
- UI primitives come from `src/lib/components/ui/*` (shadcn-svelte). Use those instead of raw `<button>`/`<dialog>` so focus traps, keyboard handling, and styling stay consistent.
- Icons: `lucide-svelte`.

---

## 💾 Persistence

- Key: `clean-browsing:layout:v2`
- Storage: `browser.storage.local` when running as an extension; `localStorage` when running via `vite preview` or dev server in a plain tab.
- The entire `GridLayout` is serialized as one JSON blob. Widget settings are stored per-instance inside `WidgetInstance.settings` — typed via the widget's `WidgetDefinition<TSettings>`.
- Resetting: `gridStore.resetLayout()` rewrites the layout to the seeded default inside `store.svelte.ts`.

---

## 🧪 Type Checking

```bash
npm run check
```

Runs `svelte-check --tsconfig ./tsconfig.json`. Note: there are currently two pre-existing `bits-ui` namespace errors in `src/lib/components/ui/button/index.ts`; they do not affect builds.

---

## 🗺️ Roadmap (port status)

| Area                               | Status          |
| ---------------------------------- | --------------- |
| Grid, drag, resize, edit mode      | ✅ Ported       |
| Clock / Date / Search / Calc / Pic | ✅ Ported       |
| Per-widget settings dialogs        | ✅ Ported       |
| Persistent layout                  | ✅ Ported       |
| Global appearance overrides        | ⏳ Not yet      |
| Layout import/export               | ⏳ Not yet      |
| Sidepanel feature                  | ⏳ Not yet      |
| Notes widget                       | ⏳ Not yet      |
| Remove legacy `extension/` tree    | ⏳ After parity |

---

## 📖 Legacy Docs

These describe the old vanilla-JS build under `extension/`. They're kept for reference while the port is in progress and will be replaced once the legacy tree is removed:

- [`WIDGET_DEVELOPMENT.md`](WIDGET_DEVELOPMENT.md)
- [`STYLING_GUIDE.md`](STYLING_GUIDE.md)
- [`COMPONENT_RULES.md`](COMPONENT_RULES.md)
- [`UI_BEHAVIOR.md`](UI_BEHAVIOR.md)
- [`features/README.md`](features/README.md)
