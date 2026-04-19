# Developer Setup

Node 20+ is recommended.

```bash
npm install

# Live dev: rebuilds on change + launches Firefox with the extension loaded
npm run dev

# One-off production build (outputs to dist/)
npm run build

# Type + Svelte diagnostics
npm run check
```

`npm run dev` runs `vite build --watch` alongside `web-ext run --source-dir=dist --target=firefox-desktop`, so edits to `.svelte`/`.ts`/`.css` files rebuild and hot-reload the add-on automatically.

## Project Structure

```
clean-browsing/
├── index.html                 # Vite entry (becomes the new tab page)
├── vite.config.ts             # Svelte + Tailwind v4 + $lib alias
├── public/
│   ├── manifest.json          # MV2 manifest (permissions, hosts, chrome_url_overrides.newtab)
│   ├── background.js          # alarms + notifications bridge for Timer
│   ├── branding/              # logo + banner variants (color/mono, filled/outline, transparent)
│   └── resources/
├── src/
│   ├── main.ts                # Mounts App.svelte into #app
│   ├── App.svelte
│   ├── app.css                # Tailwind v4 entry
│   └── lib/
│       ├── grid/              # Grid.svelte, GridItem.svelte, store.svelte.ts
│       ├── markets/           # Shared Yahoo Finance types, formatting, market-hours helpers, chart utils
│       ├── settings/          # Global settings store, presets, export helpers, background CSS
│       ├── storage/           # IndexedDB-backed image library
│       ├── ui/                # Toolbar, dialogs, uiStore.svelte.ts
│       ├── widgets/           # clock, date, search, calculator, picture, weather, timer, stopwatch, notes, ping-monitor, stock, stock-watchlist
│       │   ├── registry.ts
│       │   └── types.ts
│       └── components/ui/     # shadcn-svelte primitives (button, card, dialog, …)
└── docs/                      # Developer documentation + release notes
```

## Architecture in Five Bullets

- **Grid store** (`src/lib/grid/store.svelte.ts`) — a Svelte 5 rune-based store that owns the `GridLayout` (`cols`, `rows`, `instances`) and persists it to `browser.storage.local` under `clean-browsing:layout:v2`. Exposes `addWidget`, `moveWidget`, `resizeWidget`, `canPlace`, `findFreeSlot`, etc.
- **Grid components** — `Grid.svelte` renders a CSS grid of `GridItem.svelte`. `GridItem` handles pointer-capture drag/resize with cell-stride math read from the parent's computed grid template. Drag preview follows the cursor freely; placement is validated on drop.
- **Widget registry** (`src/lib/widgets/registry.ts`) — a `Map<string, WidgetDefinition>` populated by each widget's `definition.ts` at module load. Definitions bundle `component`, `settingsComponent` and/or `settingsTabs`, `defaultSize`/`minSize`/`maxSize`, and typed `defaultSettings`.
- **UI store** (`src/lib/ui/uiStore.svelte.ts`) — tracks edit mode, open dialogs (add widget, settings, per-widget settings).
- **Styling** — Tailwind v4 via `@tailwindcss/vite` (no PostCSS config, no content globs), with shadcn-svelte components under `src/lib/components/ui/` using `tailwind-variants`, `clsx`, and `lucide-svelte` icons.

## Adding a Widget

1. Create `src/lib/widgets/<name>/` with `<Name>.svelte`, either a flat settings form or tab components, and `definition.ts`.
2. In `definition.ts`, export a typed `WidgetDefinition<TSettings>` and call `registerWidget(def)` at the bottom of the file.
3. Import the definition module from `src/lib/widgets/index.ts` so the registration side-effect runs at startup.
4. `npm run dev` — the widget shows up in the Add Widget dialog.

See [`docs/README.md`](README.md) for the deeper walkthrough and [`docs/WIDGET_DEVELOPMENT.md`](WIDGET_DEVELOPMENT.md) for the full widget authoring guide.
