# Clean-Browsing Overhaul Plan

> Generated: 2026-04-13. Planning document — iterate freely.

---

## 1. Current State

### Quick Stats
| Item | Value |
|------|-------|
| Manifest version | **MV2** (`manifest_version: 2`) |
| Extension version | 0.5.0 |
| Browser target | Firefox (description says Firefox, `browser_specific_settings.gecko` present, `sidebar_action` used, polyfill loaded) |
| Primary languages | Vanilla HTML + CSS + JS — zero build step |
| Total JS LOC (extension/) | ~9,800 lines across 14 JS files |
| CSS LOC | ~4,600 lines (styles.css + sidepanel CSS files) |
| Widget JS LOC | ~1,350 lines across 5 widget files |
| Settings persistence | `localStorage` (newtab) + `browser.storage.local` (sidepanel sync) |
| Tests | **None** |

### Entry Points
- `extension/newtab.html` — new-tab dashboard page; loads scripts in order: `settings.js` → `widgets.js` → `widgets/*.js` → `sidepanel-embedded.js`
- `extension/sidepanel.html` — native Firefox sidebar panel
- `extension/background.js` — persistent background script (MV2 style, uses `importScripts`)
- Content scripts: `iframe-tracker.js` (all frames) + `sidepanel-injector.js` (injects embedded panel into every page)

### Notable Architecture Points
- Global functions exposed as bare globals — `registerWidget`, `createWidgetContainer`, `applyWidgetAppearance`, `setupJiggleModeControls` are all prefixed with `_` internally but exposed as non-prefixed names to widget files (implicit coupling via script load order)
- Settings object is a plain global (`settings`) loaded synchronously from `localStorage` before any widget code runs
- Grid: CSS Grid, 40 columns × 24 rows, fixed pixel math for drag/resize
- Widget positions stored as `{x, y, w, h}` integers in `settings.widgets[]`
- Background script strips X-Frame-Options / CSP headers for iframe embedding — aggressive, browser-permission-heavy feature

### Known Tech Debt (from to-do.md)
- Branding split: "Clean-Browsing" vs legacy "NewTab PlusProMaxUltra" still in docs
- Sidepanel default sites duplicated across 4 files (`settings.js`, `background.js`, `sidepanel-embedded.js`, `sidepanel-injector.js`)
- `dist/` contains old zip archives with legacy product name
- No tests, no CI validation beyond manifest parse
- `sidepanel-injector.js` is 2,300 lines — bloated content script injected on every page

---

## 2. Widget Inventory

| Widget | File | LOC | Features | State |
|--------|------|-----|----------|-------|
| Clock | `widgets/clock-widget.js` | 111 | 12/24h, locale, DST toggle, flashing separator | Working |
| Date | `widgets/date-widget.js` | 199 | Format string, locale, separator | Working |
| Search | `widgets/search-widget.js` | 309 | Google/Bing/DDG/Yahoo/Custom, keyboard submit | Working |
| Calculator | `widgets/calculator-widget.js` | 239 | Full arithmetic, color themes, round buttons | Working |
| Picture | `widgets/picture-widget.js` | 488 | URL or local upload, fit/position, IndexedDB storage | Working |

**Missing widgets explicitly requested or implied:**
- Bookmarks / favorites (completely absent)
- Weather (absent — listed in scout brief as a target widget)
- Notes / todo list
- RSS / news feed

### Widget Registration Pattern
Each widget file calls the bare global `registerWidget(type, { name, render, openConfig })`. This global is defined at the bottom of `widgets.js` as an alias to `_registerWidget`. The registry is a plain object `widgetRegistry`. No module system, no imports — pure script concatenation via `<script>` tags.

---

## 3. Styling System

### Glassmorphism Tokens
The design system is **hand-coded with no CSS custom properties (no `--var` tokens)**. Colors and blur values are magic literals repeated across `styles.css`, `sidepanel.css`, and `sidepanel-embedded.css`:

- Background: `linear-gradient(135deg, #0f0f23, #1a1a2e, #16213e)`
- Widget glass: `rgba(255,255,255,0.05)` bg, `blur(20px) saturate(1.2)`
- Accent purple: `rgba(120,119,198,…)`, teal: `rgba(120,255,198,…)`, pink: `rgba(255,119,198,…)`

### Reskin Cost
**High friction without CSS vars.** A theme change requires touching ~3 CSS files. There is no design token layer. Adding a CSS custom-properties shim (20–30 vars covering background, glass-bg, glass-border, blur, accent colors) would make theming trivial and is a quick win before any framework migration.

### Responsive Strategy
- Grid sizing is JS-driven (pixel math against `getBoundingClientRect`)
- Font sizing is also JS-driven via `ResizeObserver` + `calculateOptimalFontSize()`
- CSS uses `clamp()` and `container-type: size` sparingly — partially modern
- No media queries for layout

---

## 4. Bookmarks Gap

**Zero bookmark integration exists.** Search for `bookmarks` returns no results anywhere in the extension.

### What Would Be Needed
1. **Permission**: add `"bookmarks"` to `permissions` array in manifest
2. **API calls**: `browser.bookmarks.getTree()` / `browser.bookmarks.search()` — these are standard WebExtension APIs, work in both Firefox and Chrome
3. **New widget**: `widgets/bookmarks-widget.js` following the existing `registerWidget` pattern
4. **View modes**: icon grid, list, tree — implement as `widget.settings.viewMode` toggle
5. **Folder navigation**: recursive `bookmarks.getChildren()` calls

### Firefox Advantage
Firefox's `browser.bookmarks` API is fully available in MV2 content-level pages and background scripts. No extra manifest changes beyond adding the permission.

---

## 5. Firefox Port Notes

### Good News: Already Firefox-First
- Manifest is MV2 with `sidebar_action` (Firefox native sidebar API — Chrome doesn't have this)
- `browser_specific_settings.gecko` block present (Gecko ID set)
- `browser-polyfill.js` (mozilla/webextension-polyfill) loaded in all contexts
- `browser-api.js` wraps everything through `ExtensionAPI` — no raw `chrome.*` calls visible
- UA detection in `browser-api.js` checks for Firefox/Waterfox/LibreWolf/Zen/SeaMonkey family

### Problems for Chrome
- `sidebar_action` key in manifest will be ignored/warned on Chrome; there is no Chrome equivalent
- `background.persistent: true` is MV2 — Chrome now requires MV3 service workers
- `tabs.executeScript` with inline code string is deprecated in MV3
- `webRequestBlocking` is not available in Chrome MV3 extensions (requires Declarative Net Request instead)

### What Would Break on Firefox if "ported" to MV3
- `importScripts()` in background.js (MV3 service workers support this only in Chrome, not Firefox as of 2024)
- `background.persistent: true` must become `background.service_worker`
- The entire iframe header-stripping feature (`webRequest + webRequestBlocking`) has no MV3 equivalent in Chrome — this is a fundamental feature break

### Verdict
**Stay on MV2 for Firefox.** Firefox supports MV2 indefinitely (no deprecation announced). Chrome MV2 was deprecated; don't target Chrome unless you drop the sidebar and header-bypass features or rebuild them under DNR.

---

## 6. Docs Assessment

### Useful
- `docs/STYLING_GUIDE.md` — accurate design token reference, still valid
- `docs/WIDGET_DEVELOPMENT.md` — widget template and registration pattern is correct
- `docs/COMPONENT_RULES.md` — settings schema documented accurately
- `to-do.md` — comprehensive debt list, clearly recent (Jan 2025)

### Stale / Misleading
- All docs still say "NewTab PlusProMaxUltra" in the body text
- `docs/README.md` references features docs in `docs/features/` — those files exist but their content status is unclear
- `release-notes/` stops at v0.5.0; version history is incomplete past v0.3.0 detail level
- `IMPLEMENTATION_PLAN.md` (14KB) — an in-progress plan document, not actionable reference

### Missing Docs
- No architecture diagram
- No API reference for `registerWidget`, `createWidgetContainer`, etc.
- No setup/dev guide for the sidepanel injection system

---

## 7. Tech Debt / Rot

**Critical:**
- `sidepanel-injector.js` is a 2,300-line behemoth content script injected on **every page load**. It manually implements Shadow DOM, viewport wrapper, resize handles, and a full mini-UI. This is the riskiest file in the repo — complex, hard to test, and injected universally.
- Settings persistence is split: newtab uses `localStorage`; sidepanel uses `browser.storage.local`. These sync through `saveSettings()` calling both, but any failure silently diverges state. No single source of truth.
- Global function namespace pollution: `registerWidget`, `createWidgetContainer`, `applyWidgetAppearance`, `setupJiggleModeControls`, `openWidgetSettings` etc. are all bare globals required by widget files. Adding a new widget that accidentally shadows one of these names would silently break everything.
- No collision detection in the grid — widgets can overlap (positions are just stored integers; the render loop does not check for overlap).
- The `background.js` persistent background script holds `sessionsByContext` state in memory — this state is lost on browser restart or background script reload.

**Moderate:**
- 35KB `newtab.html` — almost all of it is settings modal markup baked into HTML. This should be generated.
- `settings.js` is 59KB / ~1,900 lines — it is a settings manager, default data, background applier, modal event binder, AND the main init all in one file.
- Widget config UI is generated as innerHTML template strings — XSS risk if any user input ever flows into those strings (currently only from stored settings, so low risk but fragile pattern).
- No error boundary — a widget `render()` throwing will crash `renderWidgets()` and blank the grid silently.

**Minor:**
- `_largerDimension` variable computed but never used in `calculateOptimalFontSize()`
- `normalizeColor()` defined in `settings.js` but only handles 3-digit hex — doesn't handle `rgb()`, `hsl()`, etc.

---

## 8. Framework Swap Readiness

### Current Blast Radius Assessment
The codebase has ~11,000 lines of entangled vanilla JS. Key coupling points:
- Widget files depend on ~8 bare globals from `widgets.js`
- Settings is a mutable global object mutated in-place everywhere
- DOM construction is entirely imperative (`createElement`, `innerHTML` strings)
- No module system — everything is load-order dependent

### Option A: Lit / Web Components

**What fits:**
- Each widget becomes a `<clock-widget>`, `<search-widget>` etc. with encapsulated Shadow DOM
- Can be adopted incrementally — ship one web component at a time while keeping the rest vanilla
- MV2/Firefox compatible, no build needed if you use the pre-built CDN Lit bundle (or bundle once with esbuild)
- Widget registry becomes a custom element registry (`customElements.define`)

**What's hard:**
- Shadow DOM breaks the current per-widget appearance system (CSS applied from outside won't pierce Shadow DOM without `::part()` or CSS vars)
- `widgetGrid.appendChild(container)` pattern stays, but `innerHTML` config templates need converting to reactive properties
- Lit requires at minimum a small bundling step to avoid loading ESM from CDN in an extension context

**Blast radius:** Medium. Widget files rewrite 1-by-1, `widgets.js` core logic mostly survives, settings layer untouched.

**Verdict:** Best choice if you want to stay close to the metal and keep Firefox MV2. Lowest overhead, incremental migration possible.

---

### Option B: Preact + Vite + shadcn-style Components

**What fits:**
- shadcn pattern (copy-paste components, Tailwind-based) maps well to the glassmorphism widget cards
- Vite handles extension output with `vite-plugin-web-extension`
- Preact is 3KB — negligible bundle size concern
- JSX makes widget config UIs far cleaner than `innerHTML` strings
- State management: Preact signals or Zustand replaces the mutable global `settings` object

**What's hard:**
- Requires a build step — fundamentally changes the "load unpacked and go" dev workflow
- Settings persistence layer needs a full rewrite into a store (signal/zustand/context)
- Sidepanel injection (`sidepanel-injector.js`) would need to ship a separate bundle; can't share the same Preact tree across content script and newtab page
- shadcn components assume Tailwind CSS — the glassmorphism system would need mapping to Tailwind utility classes or you run parallel CSS systems

**Blast radius:** High. Everything rewrites. Settings, grid, widgets, sidepanel — all need new implementations.

**Verdict:** Best long-term DX and ecosystem. Justified if planning sustained feature development. Budget 2–3× rewrite time vs. incremental approaches.

---

### Option C: Svelte + Vite

**What fits:**
- Svelte compiles to tiny vanilla JS — bundle size even lower than Preact
- Reactive stores (`writable`, `derived`) are a natural fit for the settings/widget state
- Svelte component scoped CSS handles the glassmorphism without Shadow DOM complications
- `svelte-webext-stores` library syncs Svelte stores directly with `browser.storage`

**What's hard:**
- Also requires a build step (Vite)
- Smaller ecosystem than React for shadcn-style component libraries (shadcn-svelte exists but is less mature)
- Content script (`sidepanel-injector.js`) and newtab page need separate entry points — manageable with Vite multi-page config

**Blast radius:** High — same scope as Preact rewrite.

**Verdict:** Better ergonomics than Preact/React for a solo/small-team project. Svelte stores solve the settings-sync problem elegantly. Worth considering if you don't need the React ecosystem.

---

### Framework Tradeoff Summary

| | Lit | Preact+shadcn | Svelte |
|--|-----|--------------|--------|
| Build required | Optional | Yes (Vite) | Yes (Vite) |
| Migration style | Incremental | Big bang | Big bang |
| Blast radius | Medium | High | High |
| Widget DX | Good | Excellent | Excellent |
| Settings/state | Manual | Signals/Zustand | Svelte stores |
| Theming/CSS | Harder (Shadow DOM) | Tailwind/CSS vars | Scoped CSS |
| shadcn compatibility | No | Yes (native) | Partial (svelte port) |
| Firefox MV2 fit | Excellent | Good | Good |
| Bundle overhead | ~15KB | ~10KB | ~5KB |

---

## 9. Recommended Next Steps

Ordered by impact/effort ratio:

**Phase 0 — Housekeeping (1–2 days)**
- [ ] Replace all "NewTab PlusProMaxUltra" references with "Clean-Browsing"
- [ ] Extract sidepanel default sites to `default-settings.js` (single source of truth)
- [ ] Add `--cb-*` CSS custom properties to `styles.css` for all color/blur tokens
- [ ] Fix the `_largerDimension` dead variable (lint warning)
- [ ] Add error boundary in `renderWidgets()` (try/catch per widget)

**Phase 1 — Bookmarks Widget (2–3 days)**
- [ ] Add `"bookmarks"` permission to manifest
- [ ] Create `widgets/bookmarks-widget.js` with list/grid/icon view modes
- [ ] Wire to `browser.bookmarks.getTree()` with folder navigation

**Phase 2 — Weather Widget (1–2 days)**
- [ ] Create `widgets/weather-widget.js` using Open-Meteo (free, no API key)
- [ ] Settings: geolocation or manual city, units (C/F), display style

**Phase 3 — Decide on Framework**
- If staying vanilla: introduce CSS vars, split `settings.js` into settings-store + settings-ui, add JSDoc to the global API
- If migrating: choose Svelte (best fit) or Preact+shadcn (best ecosystem), set up Vite + `vite-plugin-web-extension`, migrate widgets one by one starting with clock (simplest)

**Phase 4 — Settings Refactor**
- [ ] Split `settings.js` (1,900 lines) into: `settings-store.js`, `settings-ui.js`, `settings-defaults.js`
- [ ] Unify persistence to `browser.storage.local` only (drop the `localStorage` dual-write)
- [ ] Add import/export settings feature (JSON roundtrip)

**Phase 5 — Sidepanel Injector Cleanup**
- [ ] Audit whether the header-bypass feature is still needed / used
- [ ] If yes: extract the UI portion into a proper component, reduce content script size
- [ ] If no: remove `webRequest`/`webRequestBlocking` permissions and the injector entirely — significant permission reduction improves user trust

---

## 10. DECISION: Greenfield rewrite in `next/`

The phased approach above is **shelved**. After reviewing the findings, the call is to start from scratch in a parallel `next/` folder and leave the legacy extension untouched until parity is reached.

### Stack (locked)
- **Svelte 5** with runes mode (`$state`, `$derived`, `$effect`) — compiled output, no vDOM tax, fastest paint for a new-tab page
- **Vite 6** — build + watch
- **TypeScript strict**
- **Tailwind CSS v4** via `@tailwindcss/vite` (CSS-first config)
- **shadcn-svelte** (New York / slate) — copy-in components, design tokens from day one
- **web-ext** — Firefox auto-reload dev loop
- **Firefox WebExtension MV2** — same target as legacy; MV3 would break parity

### Scaffold status (complete)
Created in `next/`:
- `package.json`, `vite.config.ts`, `svelte.config.js` (runes enabled globally), `tsconfig.json` (strict, `$lib` alias)
- `public/manifest.json` — MV2, `gecko` block, `chrome_url_overrides.newtab`
- `src/main.ts` (Svelte 5 `mount()`), `src/App.svelte` (runes smoke test)
- `src/app.css` — Tailwind v4 import + shadcn slate token block
- `src/lib/utils.ts` — `cn()` helper
- `src/lib/components/ui/{button,card,dialog,input,tooltip}` — hand-scaffolded (shadcn-svelte CLI only supports SvelteKit)
- `components.json` — shadcn-svelte config

`npm install` ✅ (407 pkgs) · `npm run build` ✅ (1.7s, zero warnings)

### Dev loop
```bash
cd next && npm run dev
```
Runs `vite build --watch` + `web-ext run --target=firefox-desktop` concurrently. Edit `.svelte` → Vite rebuilds → Firefox reloads the extension. True HMR is not possible for new-tab pages; this is the standard pattern.

### Known gaps in the scaffold
- `public/icons/icon48.png` + `icon96.png` are 1×1 placeholders — replace before release
- Dark mode tokens exist but no toggle is wired (App shell is hardcoded dark)
- `mode-watcher` and `svelte-sonner` installed but unused
- `dev` script requires Firefox on PATH

### Rebuild roadmap
1. **Clock widget** — simplest, proves the widget abstraction in Svelte 5
2. **Grid system** — CSS Grid + drag/resize, add collision detection the legacy grid lacks
3. **Settings store** — single `$state` rune writing to `browser.storage.local` (no dual-write)
4. **Search widget**, then **Date**, **Calculator**, **Picture** — port behavior, redesign UI with shadcn components
5. **Bookmarks widget** — the feature the legacy never had: list / grid / icon views off `browser.bookmarks.getTree()`
6. **Weather widget** — Open-Meteo (no API key)
7. **Settings panel** — shadcn `Dialog` + `Input` + structured sections, import/export JSON
8. **Parity check** → swap `next/` to repo root, archive legacy under `legacy/`

Legacy extension stays frozen during the rebuild. No cross-contamination.
