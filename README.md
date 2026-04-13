# Clean-Browsing

[![Version](https://img.shields.io/badge/version-0.0.1--next-blue)](https://github.com/dmeim/clean-browsing/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Firefox Extension](https://img.shields.io/badge/platform-Firefox%20Extension-orange)](https://github.com/dmeim/clean-browsing)
[![Stack](https://img.shields.io/badge/stack-Svelte%205%20%C2%B7%20Vite%20%C2%B7%20TS%20%C2%B7%20Tailwind%20v4-ff3e00)](next/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**A customizable new tab page for Firefox** — a grid of draggable, resizable widgets, built as a Manifest V2 extension. Everything lives locally; there are no subscriptions, accounts, or external services.

> 🚧 **The project is mid-rewrite.** Active development happens in [`next/`](next/) using **Svelte 5 (runes)**, **Vite**, **TypeScript**, **Tailwind v4**, and **shadcn-svelte**. The legacy vanilla-JS build in [`extension/`](extension/) still exists but is no longer the target — it will be removed once feature parity is reached.

## ✨ Highlights

- 🧩 **Widget grid** — drag, resize, and configure widgets on a 24×16 cell layout
- 🎛️ **Edit mode** — jiggle-style edit with free-flight drag (widgets float over each other; placement is validated on drop)
- 🔒 **Local-first** — layout and settings persist via `browser.storage.local` (falls back to `localStorage` in dev)
- 🧱 **Component library** — shadcn-svelte + bits-ui primitives, styled with Tailwind v4
- ⚡ **Fast feedback loop** — `vite build --watch` + `web-ext run` for live Firefox reloads

## 🧩 Shipped Widgets

| Widget          | Description                                    | Default size |
| --------------- | ---------------------------------------------- | ------------ |
| 🕒 **Clock**     | Locale-aware time, 12/24h, seconds, AM/PM      | 4×2          |
| 📅 **Date**      | Day.js formatted date with customizable format | 4×2          |
| 🔍 **Search**    | Multi-engine search bar                        | 6×2          |
| 🧮 **Calculator**| Keyboard-friendly calculator                   | 4×5          |
| 🖼️ **Picture**   | User-supplied image tile                       | 4×4          |

Each widget lives in its own folder under [`next/src/lib/widgets/<name>/`](next/src/lib/widgets) as a `{Widget}.svelte` + `{Widget}Settings.svelte` + `definition.ts` trio, registered through a central registry.

## 🚀 Quick Start (Users)

1. Clone the repo and build the extension:
   ```bash
   git clone https://github.com/dmeim/clean-browsing.git
   cd clean-browsing/next
   npm install
   npm run build
   ```
2. In Firefox, open `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → pick `next/dist/manifest.json`.
3. Open a new tab. Use the toolbar's ✎ button to toggle edit mode and drop in widgets.

## 🛠️ Developer Setup

All active work is inside [`next/`](next/). Node 20+ is recommended.

```bash
cd next
npm install

# Live dev: rebuilds on change + launches Firefox with the extension loaded
npm run dev

# One-off production build (outputs to next/dist/)
npm run build

# Type + Svelte diagnostics
npm run check
```

`npm run dev` runs `vite build --watch` alongside `web-ext run --source-dir=dist --target=firefox-desktop`, so edits to `.svelte`/`.ts`/`.css` files rebuild and hot-reload the add-on automatically.

### Project Structure

```
clean-browsing/
├── next/                      # ✅ Active codebase
│   ├── index.html             # Vite entry (becomes the new tab page)
│   ├── vite.config.ts         # Svelte + Tailwind v4 + $lib alias
│   ├── public/
│   │   ├── manifest.json      # MV2 manifest (chrome_url_overrides.newtab)
│   │   ├── icons/
│   │   └── resources/
│   └── src/
│       ├── main.ts            # Mounts App.svelte into #app
│       ├── App.svelte
│       ├── app.css            # Tailwind v4 entry
│       └── lib/
│           ├── grid/          # Grid.svelte, GridItem.svelte, store.svelte.ts
│           ├── ui/            # Toolbar, dialogs, uiStore.svelte.ts
│           ├── widgets/       # clock, date, search, calculator, picture
│           │   ├── registry.ts
│           │   └── types.ts
│           └── components/ui/ # shadcn-svelte primitives (button, card, dialog, …)
├── extension/                 # 🗄️ Legacy vanilla-JS build (being phased out)
├── docs/                      # Developer documentation
└── release-notes/
```

### Architecture in Five Bullets

- **Grid store** (`next/src/lib/grid/store.svelte.ts`) — a Svelte 5 rune-based store that owns the `GridLayout` (`cols`, `rows`, `instances`) and persists it to `browser.storage.local` under `clean-browsing:layout:v2`. Exposes `addWidget`, `moveWidget`, `resizeWidget`, `canPlace`, `findFreeSlot`, etc.
- **Grid components** — `Grid.svelte` renders a CSS grid of `GridItem.svelte`. `GridItem` handles pointer-capture drag/resize with cell-stride math read from the parent's computed grid template. Drag preview follows the cursor freely; placement is validated on drop.
- **Widget registry** (`next/src/lib/widgets/registry.ts`) — a `Map<string, WidgetDefinition>` populated by each widget's `definition.ts` at module load. Definitions bundle `component`, `settingsComponent`, `defaultSize`/`minSize`/`maxSize`, and typed `defaultSettings`.
- **UI store** (`next/src/lib/ui/uiStore.svelte.ts`) — tracks edit mode, open dialogs (add widget, settings, per-widget settings).
- **Styling** — Tailwind v4 via `@tailwindcss/vite` (no PostCSS config, no content globs), with shadcn-svelte components under `src/lib/components/ui/` using `tailwind-variants`, `clsx`, and `lucide-svelte` icons.

### Adding a Widget

1. Create `next/src/lib/widgets/<name>/` with `<Name>.svelte`, `<Name>Settings.svelte`, and `definition.ts`.
2. In `definition.ts`, export a typed `WidgetDefinition<TSettings>` and call `registerWidget(def)` at the bottom of the file.
3. Import the definition module from `next/src/lib/widgets/index.ts` so the registration side-effect runs at startup.
4. `npm run dev` — the widget shows up in the Add Widget dialog.

See [`docs/README.md`](docs/README.md) for the deeper walkthrough.

## 📚 Documentation

- **[Developer Guide](docs/README.md)** — stack overview, architecture, and conventions for the `next/` codebase
- **[Widget Development](docs/WIDGET_DEVELOPMENT.md)** — *legacy; describes the vanilla-JS widgets in `extension/`. Being rewritten.*
- **[Styling Guide](docs/STYLING_GUIDE.md)** — *legacy; pre-Tailwind glassmorphism CSS. Being rewritten.*
- **[Component Rules](docs/COMPONENT_RULES.md)** — *legacy*
- **[UI Behavior](docs/UI_BEHAVIOR.md)** — *legacy*
- **[Release Notes](release-notes/)**

## 📊 Status

- **Current focus**: feature parity with the legacy `extension/` build inside `next/`
- **Shipped in `next/`**: grid with drag/resize, edit mode, persistent layout, clock/date/search/calculator/picture widgets, per-widget settings dialogs
- **Coming next**: widget appearance system, import/export of layouts, sidepanel port, notes widget
- **Not yet ported**: sidepanel feature, import/export UI, global appearance overrides

## 🤝 Contributing

PRs welcome. Please target [`next/`](next/) — changes to `extension/` are unlikely to be merged since that tree is slated for removal.

See [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

MIT — see [LICENSE](LICENSE).
