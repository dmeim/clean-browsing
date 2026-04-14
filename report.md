# Clean Browsing — `next/` vs `extension/` Comparison Report

A feature-by-feature audit of the in-progress Svelte rewrite (`next/`) against the shipped vanilla-JS extension (`extension/`). Use this to track the migration punch list.

---

## TL;DR

The `next/` version has reached feature parity on **all five widget types** and already surpasses the old version in grid ergonomics (real collision detection, drag/resize with live preview, grid overlay, min/max constraints, auto-placement, edit-mode snapshots) and theming (per-instance style overrides, preset system, light/dark toggle, multi-stop gradients).

The main gaps blocking a full replacement are the **sidepanel feature**, **configuration export/import**, and the **picture-widget storage management UI**. Everything else is either implemented better or is a minor setting that can be ported quickly.

---

## 1. Widgets

Both versions ship the same five widget types: **Clock, Date, Search, Calculator, Picture**. The `next/` implementations are functionally equivalent and in several cases enhanced.

### Clock
| | Old | New |
|---|---|---|
| Settings | `showSeconds`, `flashing`, `locale`, `use24h`, `daylightSavings` | adds `showAmPm`, `paddingV`, `paddingH` |
| Default size | 4×3 | 4×2 |
| Min size | — | 3×2 |
| Locale handling | basic | `Intl.DateTimeFormat.formatToParts` — cleaner AM/PM stripping |

### Date
| | Old | New |
|---|---|---|
| Settings | `format` (Day.js) | adds `paddingV`, `paddingH` |
| Min size | — | 3×1 (tiny date displays now allowed) |

### Search
| | Old | New |
|---|---|---|
| Settings | `engine`, `customUrl`, `customImageUrl`, `target`, `clearAfterSearch` | adds `paddingV`, `paddingH` |
| Default size | 6×2 | 4×2 |
| Icon | raster logo | stroke-based SVG magnifying glass, responsive via `widgetScaler` |

### Calculator
| | Old | New |
|---|---|---|
| Settings | `keyboardSupport`, `roundButtons`, `colorOperators`, `colorEquals`, `colorClear`, `display` | same + `historyEnabled`, `history[]`, `paddingV`, `paddingH` |
| Min size | — | 3×5 |
| **History** | ❌ | ✅ persisted, max 50 entries `{expression, result, timestamp}` |
| Result formatting | basic | rounded to avoid floating-point artefacts |

### Picture
| | Old | New |
|---|---|---|
| Image reference | `imageRef` (IndexedDB blob) | `imageId` → separate `imageLibrary` store, with `imageDataUrl` legacy fallback |
| Placeholder | emoji | SVG icon |
| Settings | `imageRef`, `padding`, `fit`, `positionX`, `positionY`, `opacity` | same shape, normalized storage |

---

## 2. Grid System

This is where `next/` pulls well ahead of `extension/`.

### Old (`extension/widgets.js`)
- HTML5 drag/drop API, drag-only (no visual resize — size edited via settings modal).
- No collision detection visible in the code; relies on CSS grid to lay things out.
- Jiggle animation on `.jiggle-mode` class. No grid overlay.
- New widgets spawn at `(0, 0)`; manual repositioning required.
- All changes apply immediately — no undo on edit-mode exit.

### New (`next/src/lib/grid/`)
- **24×16** grid, 0.5rem gap, 1rem padding.
- **Pointer Events API** with `setPointerCapture`, live `previewX/Y` during drag.
- **Real collision detection**: `rectsOverlap()` + `canPlace()` validate every move/resize.
- **Invalid-state feedback**: red outline + shadow; auto-reverts to `lastValidX/Y` on bad drop.
- **Visual resize** from a 14×14 bottom-right handle, respecting per-widget `minSize`/`maxSize`.
- **Grid overlay** (2px outlined cells) visible only in edit mode.
- **Auto-placement**: `findFreeSlot(w, h)` scans top-left for first fit — `addWidgetAuto()` uses it.
- **Edit snapshots**: `beginEdit()` → `commitEdit()` / `cancelEdit()` enables undo-on-cancel.
- Widget instances carry `instanceId`, `widgetId`, position, size, settings, and optional `styleOverrides`.

---

## 3. Settings System

### Old (`extension/settings.js`)

Shape:
```
background: { type, gradient{color1,color2,angle}, solid{color}, image{url,opacity} }
globalWidgetAppearance: { fontSize, fontWeight, italic, underline, textColor,
                          textOpacity, backgroundColor, backgroundOpacity, blur,
                          borderRadius, opacity, textAlign, verticalAlign, padding }
sidebarSettings: { sidebarEnabled, sidebarWebsites[], sidebarBehavior{...} }
widgets: []
```

UI tabs: **Configuration · Page Appearance · Widget Appearance · Storage**. Includes:
- Advanced export/import with 5 category checkboxes (Background, Global Styles, Widgets & Layout, Sidepanel, App Prefs) + Quick Export/Import All.
- 8 preset gradient quick-buttons (Purple Dream, Pink Sunset, Ocean Blue, Mint Fresh, Warm Sunrise, Deep Space, Soft Pastel, Cotton Candy).
- Unified global widget appearance — font, background, blur, radius, alignment, padding applied to every widget at once.
- Storage tab with image stats (total, average, largest, oldest) and cleanup tools (optimize, clean orphaned, clear all).
- "Reset modal position when reopened" toggle.

### New (`next/src/lib/settings/`)

Shape:
```
theme: 'light' | 'dark'
background: { type: 'gradient'|'solid'|'image'|'url', ... }
  gradient: { angle, stops: string[] }          // unlimited stops
  url:      { href, opacity }                   // NEW
widgetDefaults: {
  textColor, accentColor, background, backgroundOpacity,
  border{color,style,width,radius}, glow{color,intensity},
  shadow{color,intensity,offsetX,offsetY}, backdropBlur, opacity
}
widgetPresets: WidgetStylePreset[]              // builtin + user-saved
schemaVersion: number
```

Components: `AppearanceSettings`, `BackgroundEditor`, `WidgetsSettings`, `WidgetAppearanceEditor`, `WidgetPresetBar`, `WidgetPreviewTile`, `StorageSettings`, `ConfigurationSettings` (placeholder).

Highlights:
- **Light/dark theme toggle** (new).
- **Preset system** for widget default styles — save, load, apply, delete; ships with builtins.
- **Per-instance style overrides** (`WidgetStyleOverrides`) — any widget can deviate from defaults without touching globals; resolved in `GridItem.svelte` and applied as CSS variables.
- **Border, glow, shadow** as first-class controls (old had only border-radius + bg opacity + blur).
- **Schema versioning** + one-time migration from `localStorage` → `browser.storage.local`.
- Split storage keys: `clean-browsing:settings:v1` and `clean-browsing:layout:v2`.
- Image library is its own store (`imageLibrary.svelte.ts`); widgets reference images by ID.

---

## 4. Gap List — in Old, NOT yet in New

These are the concrete things to port before `next/` can fully replace `extension/`:

1. **Sidepanel / Quick Access Sidebar** — entire feature missing. Covers website list, iframe embedding, per-site icon + open-mode settings, auto-close, show-URLs, compact mode, sidepanel background customization. (`extension/sidepanel.html`, `split-view.js`, `sidepanel-embedded.js`.)
2. **Configuration Export/Import UI** — `ConfigurationSettings.svelte` is a placeholder. Needs Quick Export/Import All and categorized advanced export.
3. **Preset background gradients** — the 8 named quick-pick gradients. New version has presets for widget *styles*, not backgrounds.
4. **Picture widget storage management UI** — stats (count, average, largest, oldest) and cleanup tools (optimize, clean orphaned, clear all). `imageLibrary` exists but isn't surfaced in `StorageSettings.svelte` yet.
5. **Unified "global widget appearance" form** — the old single form that set font-size/weight/italic/underline/text-align/vertical-align/padding across all widgets in one place. New version has defaults but no equivalent batch editor exposed.
6. **Modal position reset toggle** — minor, but present in old Page Appearance tab.
7. **Font styling controls on widget defaults** — font size %, weight, italic, underline, text-align, vertical-align are not in the new `WidgetDefaults` type.

---

## 5. New Capabilities — in `next/`, not in `extension/`

1. **Per-instance widget style overrides** — any widget can diverge from defaults.
2. **Widget style preset system** — save/load/apply, builtin + user presets.
3. **Light/dark theme toggle**.
4. **Multi-stop gradients** (`stops: string[]` instead of two colors).
5. **Background by URL** — external image without local upload.
6. **Border, glow, shadow, backdrop-blur** as first-class per-widget controls.
7. **Calculator history** (persisted, 50 entries).
8. **Min/max widget size constraints** enforced by the grid.
9. **Collision detection + invalid-state visual feedback**.
10. **Auto-placement** for new widgets (`findFreeSlot`).
11. **Grid overlay** in edit mode.
12. **Edit-mode snapshots** with undo-on-cancel.
13. **Clock `showAmPm` toggle** and improved locale handling.
14. **Per-widget `paddingV`/`paddingH`** on Clock, Date, Search, Calculator.
15. **Responsive text/content scaling** via `widgetScaler` action.
16. **Separate image library** with ID references (decouples storage from widget settings).
17. **Schema versioning** for forward-compatible migrations.
18. **Full TypeScript** — type-safe widget settings, props, and grid APIs.

---

## 6. Architectural Differences

| | Old | New |
|---|---|---|
| Build | None — files loaded directly | Vite + `@sveltejs/vite-plugin-svelte` |
| Language | Vanilla JS | TypeScript (strict) |
| Framework | None — DOM API | Svelte 5 (`$state`, `$derived`, `$effect`) |
| Styling | Single `styles.css`, inline styles via `applyWidgetAppearance()` | Scoped `<style>` blocks + Tailwind utilities + CSS variables |
| State | Global `settings` object mutated + `saveAndRender()` full re-render | Svelte stores with fine-grained reactivity (`gridStore`, `settingsStore`, `uiStore`, `imageLibrary`) |
| Interaction | HTML5 drag/drop | Pointer Events + pointer capture |
| File layout | Monolithic `newtab.html` + flat `widgets/*.js` | `src/lib/{grid,widgets,settings,storage,ui,components}` with per-widget folders (`Component.svelte`, `definition.ts`, `SettingsForm.svelte`) |
| Storage | Single blob in `browser.storage.local` (fallback `localStorage`) | Split keys (`settings:v1`, `layout:v2`) + one-time migration + schema version |
| Type safety | None | `WidgetDefinition<TSettings>`, `WidgetInstance`, per-widget settings types |
| Testing | Runtime only | `svelte-check` static analysis |

---

## 7. Suggested Port Order

Rough priority for closing the gap, easiest wins first:

1. **Configuration export/import** — well-scoped, no new UX design needed, unblocks user migration.
2. **Picture storage UI** — the `imageLibrary` store already exists; just needs a panel.
3. **Preset background gradients** — 8 hardcoded entries, trivial.
4. **Font styling on widget defaults** (size %, weight, italic, underline, alignments) — extend `WidgetDefaults` type + editor.
5. **Modal position reset** — minor toggle.
6. **Sidepanel** — biggest effort; defer until the rest of parity lands. Worth re-evaluating the iframe-embed approach during the port since the old implementation had rough edges.
