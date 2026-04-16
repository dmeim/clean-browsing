# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Project Overview

Clean Browsing is a **Firefox Manifest V2 extension** that replaces the new tab
page with a grid of draggable, resizable widgets. It is local-first by default —
no accounts, no telemetry, and no network calls in the baseline experience.
Layout and settings live in `browser.storage.local`.

**Network policy:** widgets whose core function requires network (Weather
fetching a forecast, a ping monitor hitting a URL, an embed loading its
source, etc.) are allowed to make network calls, as long as those calls are
opt-in, disclosed clearly in the widget settings dialog, scoped to the host
permissions the widget actually needs, and documented in
`docs/PRIVACY_POLICY.md`. Non-widget components — toolbar, dialogs,
stores, styling — stay strictly offline. No CDN fonts, no remote icons,
no telemetry, no analytics.

This is a **Firefox extension**, not a Chrome extension. When discussing
styling, never use the word "chrome" to mean window chrome / UI shell —
readers will hear "the browser." Use `--ui-*` / `--shell-*` / `--surface-*`
prefixes instead (see `src/app.css`).

## Stack

- **Svelte 5** with runes (`$state`, `$derived`, `$effect`, `$props`)
- **Vite 6** (`@sveltejs/vite-plugin-svelte`)
- **TypeScript 5** (strict)
- **Tailwind CSS v4** via `@tailwindcss/vite` — CSS-first config in `src/app.css`, no `tailwind.config.js`
- **shadcn-svelte** primitives on top of `bits-ui`, `tailwind-variants`, `clsx`, `tailwind-merge`
- **lucide-svelte** icons, **dayjs** for dates, **fflate** for the image library ZIP export, **mode-watcher** for theme toggling, **svelte-sonner** for toasts
- **web-ext** for the Firefox dev reload loop

## Core Layout

```
.
├── index.html                  # Vite entry → becomes the new tab page
├── vite.config.ts              # svelte() + @tailwindcss/vite, $lib alias
├── svelte.config.js            # runes enabled globally
├── tsconfig.json
├── public/
│   ├── manifest.json           # MV2 manifest (gecko min 109.0)
│   ├── branding/               # logo + banner variants (color/mono, filled/outline, svg/png, transparent)
│   └── resources/              # search engine logos, etc.
└── src/
    ├── main.ts                 # mount(App, { target: #app })
    ├── App.svelte              # Toolbar + Grid + dialogs
    ├── app.css                 # @import "tailwindcss"; + design tokens
    └── lib/
        ├── grid/               # Grid.svelte, GridItem.svelte, store.svelte.ts, fitText.ts, widgetScaler.ts
        ├── ui/                 # Toolbar, dialogs, uiStore.svelte.ts, settings/
        ├── widgets/            # clock/date/search/calculator/picture + registry.ts + types.ts
        ├── settings/           # store.svelte.ts, types.ts, presets.ts, backgroundCss.ts, exportBundle.ts
        ├── storage/            # idb.ts, imageLibrary.svelte.ts
        ├── components/ui/      # shadcn-svelte primitives
        └── utils.ts
```

## Commands

All commands run at the repo root.

```bash
npm install                    # deps
npm run dev                    # vite build --watch + web-ext run (live Firefox reload)
npm run build                  # production build → dist/
npm run check                  # svelte-check (TS + Svelte diagnostics)
npm run lint                   # eslint src
npm run format                 # prettier --write over src, repo root, and docs
npm run format:check           # prettier --check (what CI runs)
```

Note on `npm run check`: there are two **pre-existing** `bits-ui` namespace
errors in `src/lib/components/ui/button/index.ts` that do not affect builds.
If you see exactly those two errors, they are not regressions from your change.

## Before committing

CI runs `lint → format:check → check → build → package` and **fails the
whole workflow on any prettier diff**, including in markdown files under
`docs/`. Writing or editing any of these without running prettier will
break CI:

- `src/**/*.{ts,js,svelte,css,html}`
- `*.{ts,js,json,md}` (repo root)
- `docs/**/*.md`

Before `git commit` (and definitely before `git push`), run:

```bash
npm run format                 # auto-fix prettier diffs
npm run lint                   # eslint src
npm run check                  # svelte-check (TS + Svelte diagnostics)
```

`npm run format` is the one that's most often forgotten, because prettier
silently accepts markdown files that "look fine" but differ on table
alignment, trailing whitespace, or heading spacing. Always run it after
any markdown edit — don't wait for CI to catch it.

## Architectural Conventions

### Stores are runes, not Svelte 3 stores

Every store in this codebase uses the Svelte 5 runes pattern — a
`createXxxStore()` factory returning getters and mutator functions,
not `writable()`/`readable()`. See:

- `src/lib/grid/store.svelte.ts` — layout + persistence (`clean-browsing:layout:v2` in `browser.storage.local`)
- `src/lib/ui/uiStore.svelte.ts` — edit mode, dialog state
- `src/lib/settings/store.svelte.ts` — global settings + migration

New stores should match this shape. Never introduce `svelte/store` writables.

### Widgets are self-contained folders

Each widget lives in `src/lib/widgets/<id>/` as a trio:

- `<Name>.svelte` — the rendered widget, reads `$props()` as `WidgetProps<TSettings>`
- `<Name>Settings.svelte` — the settings form, same props, calls `updateSettings(next)`
- `definition.ts` — exports the `TSettings` type and a typed `WidgetDefinition<TSettings>`; calls `registerWidget(def)` at module load

`src/lib/widgets/index.ts` side-effect-imports every `definition.ts` so the
registry is populated before the grid mounts. Adding a widget is: create the
folder, add the `import "./<id>/definition.js";` line, done. `docs/WIDGET_DEVELOPMENT.md`
has the canonical walkthrough; the clock widget is the reference example.

### Styling conventions

- Tailwind v4 is the default. Reach for `<style>` blocks only when utilities
  genuinely can't express the thing (grid math, container queries, keyframes).
- Design tokens live in `src/app.css` under `:root` and `.dark`. Colors use
  HSL CSS variables (`--background`, `--foreground`, etc.) plumbed into
  Tailwind via `@theme inline`. Chrome-free naming: `--ui-*`, `--shell-*`,
  `--surface-*`, `--widget-*`.
- Widget visual chrome (background/border/radius/blur/shadow/opacity) is
  driven by CSS custom properties on `.grid-item-inner`, merged from global
  defaults + per-instance overrides. Widgets themselves should not declare
  their own background/border/border-radius on `.widget-card` unless they
  really need a custom look.
- shadcn-svelte primitives under `src/lib/components/ui/` handle focus traps,
  keyboard a11y, and variants. Prefer them over raw `<button>`/`<dialog>`.

### File-path conventions

- Use the `$lib` alias (`src/lib`) for every cross-folder import.
- TypeScript `.js` import specifiers are required (`import { foo } from "./bar.js"`)
  because `tsconfig.json` uses `module: "NodeNext"`. Don't drop the `.js`.
- Svelte 5 components are `.svelte` with `<script lang="ts">`. Props via
  `$props()`, reactive state via `$state`, derived via `$derived`, side
  effects via `$effect` with a returned cleanup function.

### Persistence

- Layout: `browser.storage.local` under `clean-browsing:layout:v2` (falls
  back to `localStorage` when running outside the extension, e.g. `vite preview`).
- Widget settings are embedded in `WidgetInstance.settings: unknown` and
  typed per widget via `WidgetDefinition<TSettings>`.
- Global settings store has its own key and handles migrations.

## Version Management

**Default rule: only increment the alpha (Z) digit.**

`X.Y.Z` semver:

- **X** — major release (breaking changes, new canonical features)
- **Y** — minor/beta release (new features, improvements)
- **Z** — alpha/patch release (bug fixes, small iterations)

Rules:

- Any code change → bump Z by +1 in both `package.json` and `public/manifest.json`.
- Only bump Y when the user explicitly says "this is a beta release."
- Only bump X when the user explicitly says "this is a major release."
- Never assume a Y or X bump on your own.

When bumping, **both files must move together** — CI will enforce this in
the release workflow by asserting `package.json.version === manifest.version === git tag`.

## Release Preparation

When the user asks for a release:

1. **Release notes** — create `docs/release-notes/vX.Y.Z.md` summarizing user-facing
   changes, fixes, and any migration notes. Keep a changelog-style format;
   v1.0.0 is the reference.
2. **Version bumps** — sync `package.json` and `public/manifest.json` to the
   new version.
3. **README/docs** — update the version badge and any stale references.
   Don't rewrite more than the release warrants.
4. **Verify** — `npm run lint && npm run check && npm run build && npm run package`
   should all succeed locally before tagging.
5. **Tag** — `git tag -a vX.Y.Z -m "Clean Browsing X.Y.Z" && git push origin vX.Y.Z`.
   The `release.yml` workflow handles the rest (build, sign if secrets exist,
   create GitHub release with artifacts).

## Documentation Map

- **[`docs/README.md`](../docs/README.md)** — developer overview and architecture
- **[`docs/WIDGET_DEVELOPMENT.md`](../docs/WIDGET_DEVELOPMENT.md)** — how to build a widget
- **[`docs/STYLING_GUIDE.md`](../docs/STYLING_GUIDE.md)** — Tailwind v4 + design tokens
- **[`docs/COMPONENT_RULES.md`](../docs/COMPONENT_RULES.md)** — Svelte 5 patterns and conventions
- **[`docs/UI_BEHAVIOR.md`](../docs/UI_BEHAVIOR.md)** — interaction patterns (edit mode, drag/resize, dialogs)
- **[`docs/ROADMAP.md`](../docs/ROADMAP.md)** — forward-looking features

## Historical Note

The Clean Browsing codebase before v1.0.0 was a vanilla HTML/CSS/JS extension
under `extension/`. It was replaced by a ground-up Svelte 5 + Vite + TypeScript +
Tailwind v4 rewrite in v1.0.0. The pre-rewrite tree is preserved at the
`legacy-final` git tag for reference. If an old issue, commit, or PR references
`newtab.html`, `settings.js`, `widgets.js`, or the `extension/` folder, that's
the legacy codebase — do not try to find those files in `main`.
