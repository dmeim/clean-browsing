# Privacy Policy

**Effective date:** 2026-04-17
**Extension:** Clean Browsing
**Applies to:** v1.2.0 and later

---

## Summary

Clean Browsing is a local-first Firefox extension that replaces your new tab page with a grid of draggable, resizable widgets. **It does not collect, transmit, or share any personal data.** Your layout, settings, and any content you put into widgets stay on your device, inside Firefox's own storage, and never reach any server operated by the extension's authors.

There is no account system, no login, no telemetry, no analytics, and no crash reporting.

---

## What the extension stores

Everything is stored locally via Firefox's `browser.storage.local` API and, for images, the browser's IndexedDB. Nothing in this list ever leaves your device under Clean Browsing's own control.

| Data                                             | Purpose                                                                       | Where it lives                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| Grid layout (widget positions, sizes, instances) | Remember your dashboard between sessions                                      | `browser.storage.local` → `clean-browsing:layout:v2` |
| Global appearance settings                       | Background, theme, widget chrome defaults                                     | `browser.storage.local` (settings store)             |
| Per-widget settings                              | Each widget's configuration (e.g. clock format, search engine, note contents) | Embedded inside the grid layout blob                 |
| Image library                                    | Images you upload for the Picture widget or background                        | Firefox IndexedDB (via the extension's own database) |
| Sidebar bookmarks / shortcuts                    | If you add any                                                                | `browser.storage.local`                              |

You can inspect everything Clean Browsing has stored at any time via Firefox's `about:debugging` → **Inspect** on the extension → **Storage** tab.

---

## What the extension collects

Nothing. Explicitly:

- No browsing history.
- No URLs you visit outside the new tab page.
- No search queries.
- No keystrokes.
- No IP addresses.
- No device identifiers or fingerprints.
- No usage analytics, session replays, or error telemetry.
- No cookies.
- No remote logging of any kind.

There is no "phone home" code anywhere in the extension. The source is open and auditable at the project's GitHub repository.

---

## Permissions

Clean Browsing currently declares only these Firefox extension permissions (see `public/manifest.json`):

| Permission                               | Why it's requested                                                                                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                | Save your grid layout, settings, and widget content locally.                                                                                                                 |
| `unlimitedStorage`                       | Lift the default per-extension storage quota so the image library can hold more than a few pictures.                                                                         |
| `geolocation`                            | Used by the Weather widget **only when** you click "Use my location" in its settings. Never accessed automatically.                                                          |
| `https://api.open-meteo.com/*`           | Used by the Weather widget to fetch the forecast for your configured location. Only contacted after you finish configuring the widget.                                       |
| `https://geocoding-api.open-meteo.com/*` | Used by the Weather widget to look up a city's coordinates when you search for a location in its settings. Only contacted when you submit a search.                          |
| `https://query1.finance.yahoo.com/*`     | Used by the Stock widget to fetch quote and chart data for your configured ticker. Also used for symbol search when you look up a company.                                   |
| `https://query2.finance.yahoo.com/*`     | Reserved fallback for the Stock widget. Yahoo's documented API rotates between `query1` and `query2`; both are declared so a future routing change doesn't break the widget. |

Clean Browsing also declares `chrome_url_overrides.newtab` so that opening a new tab loads the extension's own page instead of Firefox's default. This is how the extension takes effect — it does not give the extension access to any other browser state.

The extension does **not** request `tabs`, `activeTab`, `history`, `bookmarks`, `webRequest`, `cookies`, or `<all_urls>`. The host permissions above are scoped to the two specific Open-Meteo endpoints the Weather widget uses; no other host can be contacted. If a future release adds a new permission, it will be called out in the release notes and this policy will be updated.

---

## Network activity

### Baseline (out of the box)

A freshly installed Clean Browsing with the default layout makes **zero network requests**. Opening a new tab, adding, moving, or resizing widgets, changing themes, editing settings, importing or exporting your layout, uploading images — none of these generate any outbound traffic. You can verify this with Firefox's Network tab in DevTools on the new tab page.

### Widgets that can make network requests

Clean Browsing allows individual widgets to make network requests **only when the widget's core function requires it**. A weather widget must reach a weather API; a ping-monitor widget must reach the host it's monitoring; an embed widget must load its source from YouTube, Spotify, etc. In every such case, the following rules apply:

1. **Opt-in.** A freshly-added widget makes no network requests until _you_ configure it (enter a URL, pick a location, paste an embed snippet).
2. **Disclosed.** The widget's settings dialog tells you, in plain language, which host(s) will be contacted and roughly how often.
3. **Scoped.** Host permissions in the manifest are added only when a specific widget needs them, one host at a time. There is no `<all_urls>` wildcard.
4. **Logged here.** Every network-using widget that ships is listed in the table below, with the exact hosts it contacts.

### Network-using widgets currently shipping

| Widget           | Hosts contacted                                        | When                                                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Weather**      | `api.open-meteo.com`, `geocoding-api.open-meteo.com`   | Forecast: only after you pick a location, then on the refresh interval you choose. Geocoding: only when you search.                                                                                     |
| **Ping Monitor** | Any hosts you add as targets                           | Only after you add at least one target with a valid URL. Each target runs on its own interval (configurable per target). The widget pauses all checks when the new tab page is closed.                  |
| **Stock**        | `query1.finance.yahoo.com`, `query2.finance.yahoo.com` | Quote + chart: only after you pick a symbol, then on the refresh interval you choose. The widget pauses auto-refresh outside US trading hours by default. Symbol search: only when you submit a search. |

A Weather, Ping Monitor, or Stock widget that has been added but never configured produces **zero** network traffic. Ping Monitor uses `mode: "no-cors"` for its fetches, so it needs no host-specific manifest permissions — the trade-off is that responses are opaque (reachable / slow / unreachable, not HTTP status codes). The Stock widget's data comes from Yahoo Finance's undocumented public endpoints — the same endpoints the Python `yfinance` library uses. Free Yahoo data is typically delayed 15 minutes for US equities, and the widget surfaces this as a small "delayed" badge so you can always tell whether a price is fresh.

The Search widget is a special case worth spelling out: when you submit a query, it opens the search engine's results page in a new tab. That is a normal browser navigation you initiated by pressing Enter — the extension itself does not send your query anywhere. Once the results page is open, whatever network activity happens there is between you and your chosen search engine, governed by _their_ privacy policy, not this one.

### Network-using widgets in design

The following widgets are planned and would introduce network requests if they ship (see `docs/widgets/wip-*.md` for full design notes). None of them are shipping yet. Each would be added to the table above, with its hosts, on the release that lands it.

- **Mini-Sites** — would embed URLs you configure inside an iframe.
- **Embeds** — would render embed snippets you paste, loading resources from the source platforms (YouTube, Spotify, Twitter/X, etc.).

---

## Exporting and deleting your data

### Export

You can export your full layout and settings from the global **Settings** dialog using **Export Configuration**. This produces a JSON file containing only your Clean Browsing preferences — nothing else.

### Delete

To remove everything Clean Browsing has stored on your device:

1. **Uninstall the extension** via `about:addons` → Clean Browsing → **Remove**. Firefox deletes the extension's `storage.local` and IndexedDB data along with it.
2. Or, to wipe the data without uninstalling: open the extension's new tab page, open the **Settings** dialog, and use the reset option there (when available), or clear the extension's storage manually via `about:debugging`.

---

## Children's privacy

Clean Browsing does not collect any personal information from anyone, including children. No account is required to use the extension.

---

## Open source

Clean Browsing is open source. You can read every line of code that makes up the extension at the project repository. If anything in this policy appears to contradict the code, the code is the source of truth — please open an issue.

---

## Changes to this policy

When this policy changes:

1. The **Effective date** at the top of this file is updated.
2. The change is noted in the release notes for the version that introduces it.
3. The previous version of this file remains visible in git history.

---

## Contact

Questions about privacy, or a finding that this policy is out of date with the code: please open an issue on the project's GitHub repository.

---

## Your rights

Because Clean Browsing doesn't collect personal data, the traditional data-subject rights (access, rectification, deletion, portability, objection) don't have anything to act on. What you do have is:

- **Full local control.** Export, import, or wipe your data at any time.
- **Complete code transparency.** Every behavior is verifiable in source.
- **Clean uninstall.** Removing the extension leaves nothing behind on any server, because nothing was ever sent to one.
