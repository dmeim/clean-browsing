# Mini-Sites Widget (WIP)

> **Status:** ⭕ Planned
>
> **Stage:** Planning — significant open questions
>
> This is a design document for a widget that does **not** ship yet. Scope and settings are provisional.

## Overview

A website-embed widget that renders an external URL inside an iframe on the new-tab page. Useful for dashboards (Grafana, Home Assistant), internal tools on the LAN, personal blogs, and documentation sites.

**This widget loads network resources by design.** The iframe fetches the target URL directly — that's the widget's entire point. Under Clean Browsing's network policy, widgets whose core function requires network access are allowed to do so, as long as the call is opt-in (the user enters the URL themselves), disclosed in the settings dialog, and doesn't fire on widget mount. See the shared rules in [`docs/widgets/README.md`](./README.md).

## Hard constraints

1. **Most public websites block iframe embedding.** They send `X-Frame-Options: DENY/SAMEORIGIN` or `Content-Security-Policy: frame-ancestors ...`. This is not a bug we can work around — it's the site operator's explicit decision. Google, Twitter, Amazon, GitHub, Gmail, and most major services will _not_ embed, full stop.
2. **A screenshot-service fallback would mean sending user-entered URLs to a third party.** The legacy design suggested routing blocked URLs through a screenshot service. That's a broader network exposure than the Mini-Sites widget itself — the user enters a URL expecting it to load in their browser, not to be shipped off to a screenshotting service they didn't pick. **Recommendation: cut the screenshot-service fallback from v1.** If a site blocks iframes, show an "unembeddable" placeholder with an "Open in new tab" button, and be honest about the limitation. A screenshot fallback can be revisited later as a separate, explicitly-configured feature with its own disclosure.

With those two constraints in mind, the useful v1 shape is: **good iframe support + graceful failure**, not "embed anything."

## Core features (v1)

- URL-based iframe embed with strict sandbox defaults.
- Manual refresh button + optional auto-refresh (1, 5, 15, 30 min / off).
- CSS-transform zoom from 50% to 200% for content scaling.
- Optional "interact / view-only" mode — view-only disables `pointer-events` so you can't accidentally click through.
- Navigation toolbar (show/hide): URL display, refresh, open-in-new-tab.
- Loading state while the iframe is fetching.
- Graceful "this site doesn't allow embedding" placeholder when `X-Frame-Options` blocks the frame.

## Open design questions

1. **Detecting embed failure.** An iframe blocked by `X-Frame-Options` fires `load` with an empty document but doesn't throw. The cleanest detection is a `load` + `setTimeout` race that inspects whether the iframe's `contentWindow.location.href` can be read — if it throws `SecurityError` _and_ the document is empty, the frame is blocked. This is heuristic but reliable enough for a user-facing placeholder.
2. **Host permissions.** To render an iframe in the new-tab page, Firefox does **not** strictly require a host permission — the iframe is a normal web request from the extension's own document. But the extension's CSP may need relaxing. Test early: add one embed widget, point it at an embeddable site, and verify it loads without manifest changes.
3. **LAN URLs.** `http://192.168.1.10:3000` is a common use case (Home Assistant, Proxmox, Pi-hole). Mixed content will be blocked if the new-tab page is `moz-extension://...` — which is HTTPS-equivalent. Firefox generally allows insecure local IPs from extension contexts; verify during implementation.
4. **Screenshot service.** Deferred. If we ever add one, it's opt-in with the URL of the service clearly shown, and documented in the privacy policy.

## Proposed widget ID & source layout

- **Widget ID:** `mini-site`
- **Default size:** 8 × 6 (grid cells)
- **Source (proposed):** `src/lib/widgets/mini-site/`
  - `MiniSite.svelte`
  - `MiniSiteSettings.svelte`
  - `definition.ts`
- **Registry wiring:** add `import "./mini-site/definition.js";` to `src/lib/widgets/index.ts`.

## Proposed settings type

```ts
// src/lib/widgets/mini-site/definition.ts
export type MiniSiteInteraction = "full" | "readonly";
export type MiniSiteRefresh = 0 | 1 | 5 | 15 | 30; // minutes; 0 = off

export type MiniSiteSettings = {
  targetUrl: string;
  refreshIntervalMin: MiniSiteRefresh;
  zoomPercent: number; // 50–200, step 5
  interaction: MiniSiteInteraction;
  showNavigation: boolean; // toolbar with URL + refresh + open-in-new-tab
  allowScripts: boolean; // sandbox toggle — see Security notes below
  lastLoadedAt: number; // epoch ms
  paddingV: number;
  paddingH: number;
};
```

## Settings form outline

| Setting                | Control                           | Default | Notes                                                                      |
| ---------------------- | --------------------------------- | ------- | -------------------------------------------------------------------------- |
| **Target URL**         | text input with validation        | empty   | Accept `http`, `https`, and `moz-extension` schemes; reject `javascript:`. |
| **Refresh interval**   | select: Off / 1 / 5 / 15 / 30 min | Off     |                                                                            |
| **Zoom**               | range 50–200%                     | `100`   | Implemented as `transform: scale(zoom/100)` on the iframe.                 |
| **Interaction**        | segmented: Full / View-only       | Full    | View-only sets `pointer-events: none`.                                     |
| **Show navigation**    | toggle                            | `on`    | Small toolbar on top of the iframe.                                        |
| **Allow scripts**      | toggle                            | `on`    | Controls the `sandbox` attribute on the iframe — see Security.             |
| **Vertical padding**   | range 0–80 px                     | `0`     |                                                                            |
| **Horizontal padding** | range 0–80 px                     | `0`     |                                                                            |

## Security notes

The iframe should ship with a restrictive `sandbox` by default:

```html
<iframe sandbox="allow-scripts allow-same-origin allow-forms allow-popups" ...></iframe>
```

Turning **Allow scripts** off drops the iframe to `sandbox=""` (fully sandboxed, no scripts, no same-origin, no navigation). Never render an iframe without a `sandbox` attribute — even internal LAN tools should be bounded by it.

`javascript:` URLs must be rejected in the URL validator; the input accepts `http(s):` only.

## Implementation notes

- **Zoom.** Wrap the iframe in a positioned container and use `transform: scale()` + compensating `width`/`height`. This scales the rendered content without asking the embedded site to rerender.
- **Refresh.** A single `$effect`-managed interval, torn down on unmount. Manual refresh just forces a key change on the iframe element (Svelte will remount it).
- **Load detection.** Listen for `load` on the iframe element and start a heuristic "did it actually render?" check.
- **Navigation toolbar.** Use `lucide-svelte` icons: `RotateCw` for refresh, `ExternalLink` for open-in-new-tab. Keep the toolbar ~28 px tall so the iframe dominates the widget.
- **Styling.** Tailwind v4 + existing widget chrome variables. The iframe itself should have no visual chrome — borders/radius come from the global widget settings.

## Manifest impact

Probably none. Iframe embedding from the new-tab page is a normal web request. Verify during implementation; if we need a host permission, document it in the release notes.

If a screenshot-service fallback is ever added, it would require a host permission for the service plus a privacy-policy update listing it. That is explicitly out of scope for v1.

## Testing checklist (Firefox MV2)

- [ ] Widget appears in the **Add widget** dialog.
- [ ] Settings dialog opens, URL input validates, settings persist and reload.
- [ ] Embeddable site (e.g. a static blog, `https://example.com`) loads inside the iframe.
- [ ] Non-embeddable site (e.g. `https://google.com`) shows the "unembeddable" placeholder within a few seconds, not a blank frame forever.
- [ ] LAN URL (`http://192.168.1.x:port`) loads when reachable.
- [ ] Zoom slider scales content without stretching.
- [ ] View-only mode blocks clicks but the page is still scrollable.
- [ ] Refresh interval fires at the configured cadence.
- [ ] `sandbox` attribute is always present — no iframe is rendered without one.
- [ ] `npm run check` passes cleanly.

## Out of scope for v1

Screenshot-based fallback, multi-tab embeds inside a single widget, bookmark sync, change detection, side-by-side compare, annotation tools, back/forward history. Keep v1 small — one URL per widget, iframe or bust.
