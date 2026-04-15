# Contributing to Clean Browsing

Thank you for your interest in contributing! Clean Browsing is a Firefox
Manifest V2 new-tab extension built with Svelte 5, Vite, TypeScript, Tailwind
v4, and shadcn-svelte. Everything is local-first — no accounts, no network,
no telemetry.

## Prerequisites

- **Node 20+** and **npm**
- **Firefox** (or a Firefox-compatible fork: Zen, LibreWolf, Waterfox, etc.)
- **Git**

## Development Setup

1. Fork and clone:
   ```bash
   git clone https://github.com/<your-username>/clean-browsing.git
   cd clean-browsing
   npm install
   ```
2. Live dev loop (rebuilds + launches Firefox with the extension loaded):
   ```bash
   npm run dev
   ```
   This runs `vite build --watch` alongside `web-ext run --target=firefox-desktop`.
   Save any `.svelte` / `.ts` / `.css` file and Firefox reloads automatically.
3. One-off production build:
   ```bash
   npm run build      # outputs to dist/
   npm run check      # svelte-check (TS + Svelte diagnostics)
   ```
4. Manual install in a regular Firefox profile:
   - `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → pick `dist/manifest.json`.

## Project Layout

```
.
├── index.html                  # Vite entry → new tab page
├── vite.config.ts              # svelte() + @tailwindcss/vite
├── public/manifest.json        # MV2 manifest
└── src/
    ├── main.ts                 # mounts App.svelte
    ├── App.svelte
    ├── app.css                 # Tailwind v4 entry + design tokens
    └── lib/
        ├── grid/               # Grid, GridItem, store, fitText, widgetScaler
        ├── ui/                 # Toolbar, dialogs, uiStore, settings/
        ├── widgets/            # clock, date, search, calculator, picture + registry
        ├── settings/           # global settings store, export bundle
        ├── storage/            # idb + image library store
        └── components/ui/      # shadcn-svelte primitives
```

## Architecture Principles

- **Local-first.** Every byte of user data lives in `browser.storage.local`
  (falls back to `localStorage` when running outside the extension). No
  telemetry, no phoning home, no accounts.
- **Svelte 5 runes everywhere.** Stores are factory functions returning
  getters + mutators (`createStore()` pattern), not `svelte/store` writables.
  See `src/lib/grid/store.svelte.ts` and `src/lib/ui/uiStore.svelte.ts`.
- **Widget registry.** Each widget registers itself at module load via
  `registerWidget(def)`. The grid looks widgets up by `widgetId` — no direct
  references between widgets. See `src/lib/widgets/registry.ts`.
- **Tailwind v4 with design tokens.** Colors and surfaces go through CSS
  variables defined in `src/app.css` (`--ui-*`, `--surface-*`, `--widget-*`).
  Reach for `<style>` blocks only when utilities can't express the thing.
- **This is a Firefox extension.** Never use "chrome" to mean UI shell — it
  reads as the browser. Use `--ui-*` / `--shell-*` / `--surface-*` prefixes.

## Adding a Widget

See **[`docs/WIDGET_DEVELOPMENT.md`](docs/WIDGET_DEVELOPMENT.md)** for the full
walkthrough. Short version:

1. Create `src/lib/widgets/<id>/` with `<Name>.svelte`, `<Name>Settings.svelte`,
   and `definition.ts`.
2. In `definition.ts`, export a typed `WidgetDefinition<TSettings>` and call
   `registerWidget(def)` at the bottom of the file.
3. Add `import "./<id>/definition.js";` to `src/lib/widgets/index.ts` so the
   registration side-effect runs at startup.
4. `npm run dev` — the widget shows up in the Add Widget dialog.

The clock widget (`src/lib/widgets/clock/`) is the canonical reference.

## Code Style

- **TypeScript strict mode.** No `any` without a comment explaining why.
- **Svelte 5 runes** for state: `$state`, `$derived`, `$effect` (with cleanup),
  `$props`. Avoid legacy reactive statements (`$:`) and `svelte/store`.
- **Import specifiers** must include the `.js` extension (`import foo from "./bar.js"`)
  because `tsconfig.json` uses `module: "NodeNext"`.
- **`$lib` alias** for every cross-folder import.
- **No comments explaining what the code does** — name things well instead.
  Comments should explain _why_ something non-obvious is happening (a hidden
  constraint, a workaround, a subtle invariant).

## Pull Request Process

### Before Opening a PR

1. **Test in Firefox.** Load `dist/manifest.json` via `about:debugging` and
   verify your change actually works — type checks and builds confirm code
   correctness, not feature correctness.
2. **`npm run check`** — must pass (ignoring the 2 pre-existing `bits-ui`
   namespace errors in `src/lib/components/ui/button/index.ts`, which do not
   affect builds).
3. **`npm run build`** — must succeed.
4. **Version bump.** Increment the patch (Z) digit in both `package.json` and
   `public/manifest.json` — they must stay in sync. Only bump the minor (Y)
   or major (X) digit if a maintainer has explicitly asked for it.
5. **Release notes.** If your PR is user-visible, add an entry to the
   appropriate `docs/release-notes/vX.Y.Z.md` file (create one if it doesn't exist
   yet for the in-progress version).

### PR Checklist

- [ ] Clear title describing the _user-facing_ effect of the change
- [ ] Description explains the "why," not just the "what"
- [ ] Screenshots or recordings for any UI change
- [ ] Testing notes: how you verified it works in Firefox
- [ ] `npm run check` and `npm run build` both pass locally
- [ ] Version bumped in `package.json` and `public/manifest.json`
- [ ] Release notes updated if user-visible

### Review

- A maintainer reviews the PR, runs CI, and may test it locally.
- Accept that review feedback can ask for structural changes — it's easier
  to adjust in PR than in a follow-up.

## Reporting Bugs

File an issue with:

1. **Brief description** of what's wrong
2. **Steps to reproduce** (exact clicks, inputs, state)
3. **Expected vs actual** behavior
4. **Environment**: Firefox version, OS, extension version from `about:addons`
5. **Screenshots / console errors** if relevant (Shift+F9 or `about:debugging`)

Check existing issues first to avoid duplicates.

## Feature Requests

Feature requests are welcome. Describe the _use case_ first — what are you
trying to accomplish? Then the proposed solution. Keep in mind the project's
local-first principle: features that require network calls, accounts, or
external services are unlikely to land.

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for features that are already on the
radar.

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](../LICENSE).
