# Roadmap

Forward-looking list of what's on the table after v1.0.0. This is a rolling
document — items move up, down, or off it as priorities shift. Nothing here
is a promise.

Items are grouped by how close they are to shipping. Within a group, order
doesn't imply priority.

## 🎯 Next up

Features with real design weight behind them, likely to land in the next
few releases.

### Notes widget

A local-only rich-text note-taking widget. Design questions:

- Editor: lightweight contenteditable + small toolbar, or pull in a
  dedicated editor library? Keep bundle size in mind.
- Storage: per-instance in `WidgetInstance.settings` (fine for short
  notes), or separate entry under `browser.storage.local` / IndexedDB
  for larger content?
- Sync: out of scope (local-first).

### Widget appearance overrides (per-instance)

The global widget appearance system is already in place
(`src/lib/ui/settings/WidgetAppearanceEditor.svelte`); per-instance
overrides exist in the type system (`WidgetInstance.styleOverrides`) but
don't yet have a UI. Plan: add an "Appearance" tab inside
`WidgetSettingsDialog` that edits `styleOverrides` and merges on top of
the global defaults.

### Layout import / export

Users already have JSON export for settings and ZIP export for the image
library. The next step is importing a full layout (grid + widgets +
settings) from a JSON file. Error handling and version migration are the
hard parts — legacy layouts from a previous schema should either migrate
cleanly or fail loudly.

## 🧪 Candidate widgets

Widgets that could be built next. Each would be a new folder under
`src/lib/widgets/`. Rough difficulty / risk callouts.

| Widget                    | Notes                                                                                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Weather**               | Needs geolocation + a weather API. Network calls are allowed for this widget under the project's "widgets can fetch what they need to function" policy, but the implementation must be opt-in, clearly disclosed in the settings dialog, and reflected in the privacy policy. Open-Meteo (no API key, global) is the leading candidate. See [`docs/widgets/wip-weather.md`](widgets/wip-weather.md). |
| **To-Do**                 | Straightforward: a list store per-instance. Notifications API is optional.                                                                                                             |
| **Timer**                 | Countdown timer. No external deps. Native `Notification` API for "timer done."                                                                                                         |
| **Stopwatch**             | Precision timer with lap records. No external deps.                                                                                                                                    |
| **Pomodoro**              | Specialized timer — build on top of a generic Timer widget rather than duplicating logic.                                                                                              |
| **World Clock**           | Multiple timezones. Likely a variant of the Clock widget rather than a new one.                                                                                                        |
| **RSS reader**            | Needs a CORS-safe fetch path. Local-first-ish if the user supplies their own feed URLs.                                                                                                |
| **Top sites / bookmarks** | Requires the `topSites` or `bookmarks` permission — opt-in via the extension permission model.                                                                                         |

## 🛠️ Platform work

Non-widget improvements to the codebase itself.

### Sidepanel port

The legacy vanilla-JS build had a sidepanel feature (content-script
injected sidebar on every page). It hasn't been ported to the Svelte
rewrite. If it comes back, it's a significant architectural addition:

- New manifest entries (sidebar_action, content_scripts)
- A second Vite entry for the sidepanel UI
- Shared store logic between the new tab page and the sidepanel (or
  a fresh store scoped to the sidepanel)

Not shipping unless there's clear user demand; the new-tab experience is
the core of the product.

### Automated tests

v1.0.0 ships without a test suite. Good targets for the first round:

- **Unit**: grid store math (`canPlace`, `findFreeSlot`, collision
  detection, resize bounds)
- **Component**: widget registry lookup, settings form rendering
- **Integration**: load → add widget → resize → move → persist → reload

Pick a runner that works with Svelte 5 runes (Vitest + `@testing-library/svelte`
is likely the path).

### AMO submission

v1.0.0 is distributed as a signed or unsigned artifact via GitHub releases.
Submitting to addons.mozilla.org is a separate, later decision — it adds
review time and packaging constraints, and should wait until the extension
has a stable user base that benefits from discoverability.

### Chrome / Chromium port

Currently Firefox MV2 only. A Chromium port would require an MV3 migration
and a separate build path. No concrete plan; the Firefox experience is the
priority.

## 💡 Idea shelf

Things that have been mentioned but aren't scoped yet. Include for
completeness; don't assume any of these will ship.

- **Ping monitor** — URL uptime checks from the new tab page
- **System monitor** — CPU/RAM via any available browser APIs (none exist
  in MV2, so this is probably never)
- **Embeds** — configurable iframe widget with safelist
- **Mini-sites** — bookmarked iframe panel for quick-access web UIs
- **Widget grouping** — multi-widget containers that move/resize together
- **Widget marketplace / plugin system** — load third-party widgets from
  a directory. Big architectural shift; needs careful sandboxing.

## Shipped in v1.0.0

For reference, what the first release actually contains:

- 24×16 widget grid with drag, resize, edit mode
- Persistent layout in `browser.storage.local`
- Five built-in widgets: Clock, Date, Search, Calculator, Picture
- Per-widget settings dialogs
- Global widget appearance defaults (font size/weight/color, backgrounds,
  blur, border radius, padding, alignment)
- Light / dark mode via `mode-watcher`
- JSON settings export
- ZIP image library export via `fflate`
- Firefox MV2 packaging via `web-ext`
