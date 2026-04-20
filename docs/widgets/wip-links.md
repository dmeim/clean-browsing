# Links Widget (WIP)

> **Status:** :red_circle: Planned
>
> **Stage:** Design

## Overview

A curated grid of quick-access links on the new-tab page. The user adds URLs manually, each with a label and an optional icon. No browser permissions required in the baseline experience — it's a purely local list of bookmarks that the user builds by hand.

This is the most "new tab" widget Clean Browsing doesn't have yet. Where the Search widget sends you somewhere new, Links brings you back to the places you always go.

## Core features

- Add a link: URL + label + optional icon.
- Icon sources (in priority order): user-selected lucide icon, auto-fetched favicon, or letter avatar fallback.
- Configurable layout: grid (icon cards) or compact list.
- Drag-reorder links within the widget.
- Click a link to navigate (opens in the current tab by default, configurable to new tab).
- Edit / delete links inline via edit mode or the settings dialog.
- Folder grouping: optional named groups that render as visual sections within the widget.
- Empty-state message when no links have been added.

## Open design questions

1. **Favicon fetching.** Fetching `https://example.com/favicon.ico` or using a Google/DuckDuckGo favicon proxy is a network call. This is acceptable under the network policy (the widget's core function benefits from it, and it's opt-in per link), but we should disclose it in settings and offer a way to disable it globally. **Recommendation: auto-fetch favicons by default with a "Fetch favicons" toggle in settings. When off, fall back to letter avatars. Document the favicon host in the privacy policy.**
2. **Favicon proxy vs direct fetch.** Direct fetch (`https://example.com/favicon.ico`) hits the target site and may fail for sites that don't serve a root favicon. A proxy like `https://icons.duckduckgo.com/ip3/example.com.ico` is more reliable but routes through DuckDuckGo. **Lean preference: DuckDuckGo proxy — single host to permission, better hit rate, privacy-respecting service.** Cache the fetched icon as a data URL in settings so subsequent renders are offline.
3. **Browser bookmarks API.** Firefox's `browser.bookmarks` API could auto-populate the widget from the user's bookmark bar. This requires adding the `bookmarks` permission to the manifest — an opt-in feature, not a default. **Defer to v2.** v1 is manual entry only.
4. **Open behavior.** Current tab or new tab? Most new-tab replacements open in the current tab (you're already on a new tab, so navigating it away is natural). Offer a per-widget toggle; default to current tab.
5. **Folder depth.** Flat list vs one level of folders vs nested folders. **Recommendation: one level of optional folders (groups).** Nested folders are overkill for a new-tab widget and add significant UI complexity.

## Proposed widget ID & source layout

- **Widget ID:** `links`
- **Default size:** 4 x 4 (grid cells)
- **Minimum size:** 2 x 2
- **Source (proposed):** `src/lib/widgets/links/`
  - `Links.svelte`
  - `LinksSettings.svelte`
  - `definition.ts`
- **Registry wiring:** add `import "./links/definition.js";` to `src/lib/widgets/index.ts`.

## Proposed settings type

```ts
// src/lib/widgets/links/definition.ts
export type LinkIcon =
  | { type: "lucide"; name: string }
  | { type: "favicon"; dataUrl: string }
  | { type: "letter" };

export type LinkItem = {
  id: string; // crypto.randomUUID()
  url: string;
  label: string;
  icon: LinkIcon;
  group: string; // empty string = ungrouped
};

export type LinksLayout = "grid" | "list";
export type LinksTarget = "current" | "new";

export type LinksSettings = {
  items: LinkItem[];
  groups: string[]; // ordered list of group names; items reference by name
  layout: LinksLayout;
  target: LinksTarget;
  fetchFavicons: boolean;
  showLabels: boolean;
  iconSize: "sm" | "md" | "lg";
  paddingV: number;
  paddingH: number;
};
```

## Settings form outline

| Setting                | Control                          | Default   | Notes                                                                 |
| ---------------------- | -------------------------------- | --------- | --------------------------------------------------------------------- |
| **Links list**         | editable list (URL + label)      | empty     | Add / edit / delete / drag-reorder. Each row has an icon picker.      |
| **Groups**             | editable list of group names     | empty     | Groups are optional. Links reference a group by name.                 |
| **Layout**             | segmented: Grid / List           | `Grid`    | Grid shows icon cards; List shows compact rows.                       |
| **Open in**            | segmented: Current tab / New tab | `Current` |                                                                       |
| **Fetch favicons**     | toggle                           | `on`      | When on, auto-fetches and caches favicons. Off = letter avatars only. |
| **Show labels**        | toggle                           | `on`      | Off hides text labels; icons only (grid layout).                      |
| **Icon size**          | segmented: S / M / L             | `md`      | Controls the rendered icon size in both layouts.                      |
| **Vertical padding**   | range 0-80 px                    | `8`       |                                                                       |
| **Horizontal padding** | range 0-80 px                    | `8`       |                                                                       |

## Implementation notes

- **Favicon caching.** When `fetchFavicons` is on and a link is added, fetch the favicon via `https://icons.duckduckgo.com/ip3/{hostname}.ico`, convert to a data URL via `canvas.toDataURL()` or `FileReader`, and store it in `icon.dataUrl`. Subsequent renders read from the cached data URL — no repeat network calls. If the fetch fails, fall back to `{ type: "letter" }`.
- **Letter avatar.** Render a rounded square with the first letter of the label, colored via a deterministic hash of the URL (pick from a palette of 8-10 muted colors). Pure CSS, no canvas.
- **Lucide icon picker.** A searchable dropdown listing a curated subset of `lucide-svelte` icons (50-100 common ones: Globe, Mail, Music, ShoppingCart, etc.). Full Lucide has 1500+ icons — shipping a picker for all of them is a v2 concern.
- **Grid layout.** CSS Grid with `auto-fill` and `minmax()` so cards reflow as the widget resizes. Each card: icon + optional label beneath.
- **List layout.** Flex column with compact rows: icon + label + URL hint. Denser, fits more links in a small widget.
- **Drag reorder.** HTML5 drag-and-drop within the widget, same pattern as the grid store's item reorder. Reorders the `items` array and calls `updateSettings`.
- **Scrolling.** If links overflow the widget bounds, enable vertical scroll with a hidden scrollbar (`::-webkit-scrollbar { display: none }` + `scrollbar-width: none`).
- **Icons.** `lucide-svelte`: `Plus`, `Trash2`, `GripVertical`, `ExternalLink`, `Folder`, `Globe`.

## Network notice

Favicon fetching contacts `icons.duckduckgo.com` — a single, privacy-respecting host. This is opt-in (the `fetchFavicons` toggle) and disclosed in the settings dialog. Fetched icons are cached as data URLs in widget settings; repeat renders are offline. When `fetchFavicons` is off, no network calls are made.

## Manifest impact

Needs a host permission for the favicon proxy:

```json
"optional_permissions": ["https://icons.duckduckgo.com/*"]
```

Using `optional_permissions` means Firefox won't prompt on install; the permission is requested at runtime the first time the user enables favicon fetching. If the user denies, the widget falls back to letter avatars gracefully.

## Testing checklist (Firefox MV2)

- [ ] Widget appears in the **Add widget** dialog.
- [ ] Add a link with URL + label; it appears in the widget.
- [ ] Click a link in grid layout; it navigates in the current tab.
- [ ] Toggle "Open in" to new tab; click opens a new tab.
- [ ] Favicon auto-fetches and renders when `fetchFavicons` is on.
- [ ] Favicon toggle off: letter avatar renders instead.
- [ ] Lucide icon picker overrides favicon for a specific link.
- [ ] Drag reorder works and persists.
- [ ] Delete a link; it disappears.
- [ ] Groups render as visual sections; ungrouped links render normally.
- [ ] Grid layout reflows on widget resize.
- [ ] List layout renders compactly.
- [ ] Widget scrolls when links overflow.
- [ ] Empty state shows when no links exist.
- [ ] Widget scales cleanly from 2 x 2 to large sizes.
- [ ] `npm run check` passes cleanly.

## Out of scope for v1

Browser bookmarks API integration, nested folders, link analytics (click counts), import/export of link lists, link health checking (dead link detection), tag-based filtering, keyboard-shortcut navigation, smart suggestions based on browsing history, shared link collections, rich link previews (Open Graph). v1 is a manually curated link grid with optional favicons.
