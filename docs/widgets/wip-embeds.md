# Embeds Widget (WIP)

> **Status:** ⭕ Planned
>
> **Stage:** Planning — scope overlap with Mini-Sites
>
> This is a design document for a widget that does **not** ship yet. Everything is provisional, and there is a real question about whether this widget is distinct enough from the Mini-Sites widget to justify shipping both.

## Overview

An embed widget for HTML/JS embed codes from services like YouTube, Vimeo, Spotify, CodePen, and Twitter/X. Paste an embed snippet, the widget sanitizes it, renders it inside a sandboxed iframe, and scales it responsively to the grid cell.

## Scope overlap with Mini-Sites

The Mini-Sites widget already handles "render an external URL inside an iframe." Embeds differs in three ways:

1. **Input is an embed snippet, not a URL.** The user pastes the full `<iframe>...</iframe>` or `<blockquote>...<script>...` snippet they copied from YouTube/Twitter/etc., and the widget parses it.
2. **It's aware of platform conventions.** Known platforms get a preset aspect ratio (16:9 for YouTube, auto for Twitter), sensible sandbox settings, and sometimes a thumbnail fallback.
3. **It expects the embed to be embeddable.** Unlike Mini-Sites, where the user might point at an arbitrary site and get blocked, embed snippets are published by the source specifically to be embedded, so they almost always work.

**Open question:** are these differences big enough to justify a separate widget? Or should Mini-Sites grow a "paste embed code" alternative input mode? **Lean preference: one widget with two input modes (URL or embed snippet) is less surface area and less code, but Embeds as a separate widget is friendlier for users copying from "Share → Embed" menus.** Defer the decision until Mini-Sites is actually in the tree and we can see whether extending it gets ugly.

Everything below assumes the "separate widget" path.

## Hard constraints

- **Third-party network calls are inherent.** Embeds load JS and assets from the source platform (`www.youtube.com`, `platform.twitter.com`, etc.) — that's what an embed _is_. This is allowed under Clean Browsing's network policy for widgets whose core function requires network (see [`docs/widgets/README.md`](./README.md)). The widget must still disclose clearly in the settings dialog that adding a YouTube / Twitter / Spotify / etc. embed will make the new-tab page load resources from that platform.
- **Sanitization is non-negotiable.** The widget accepts HTML from the user's clipboard. That HTML will be rendered inside the new-tab page's `moz-extension://...` origin, which has broader privileges than a regular web page. Every embed code must pass through `DOMPurify` (or equivalent) before it hits the DOM.
- **Iframe sandbox must always be set.** Even for trusted sources. Defaults lean strict; a "permissive" mode exists only as an opt-in escape hatch for snippets that genuinely need more.

## Core features

- Paste HTML/JS embed snippet into a large textarea.
- Platform auto-detection from URLs inside the snippet (YouTube, Vimeo, Spotify, CodePen, Twitter/X, Reddit, etc.) — sets the sandbox level and aspect ratio automatically.
- Live preview inside the settings dialog before applying.
- Security-level picker: strict / moderate / permissive.
- Responsive scaling (fit to widget, preserve aspect ratio).
- Fallback placeholder if the embed fails to load.

## Open design questions

1. **Sanitizer bundle size.** `DOMPurify` is ~20 KB minified + gzipped. Not free, but worth it for a widget whose entire purpose is rendering untrusted HTML. Dynamic-import it so it only loads when the Embeds widget is actually on the page.
2. **Twitter/X blockquote embeds.** The typical `<blockquote class="twitter-tweet">...<script async src="https://platform.twitter.com/widgets.js"></script>` pattern relies on a global script running against the document. Inside a sandboxed iframe this works, but requires `allow-scripts allow-same-origin` — moderate sandbox level — and loads the Twitter script. Document this trade-off in the settings dialog.
3. **Aspect ratio vs free-form.** Video platforms want a fixed 16:9. Twitter wants `height: auto`. Spotify has different heights for playlists vs single tracks. Preset aspect ratios covering common platforms plus a "custom" option handle most cases.
4. **Clipboard API.** A "Paste from clipboard" button uses `navigator.clipboard.readText()` for convenience. Requires user interaction, but no extra manifest permission.

## Proposed widget ID & source layout

- **Widget ID:** `embed`
- **Default size:** 6 × 4 (grid cells)
- **Source (proposed):** `src/lib/widgets/embed/`
  - `Embed.svelte`
  - `EmbedSettings.svelte`
  - `definition.ts`
  - `platforms.ts` — detection patterns, default sandbox/aspect ratios per known platform.
  - `sanitize.ts` — thin wrapper around `DOMPurify` with our allowed-tag/attribute config.
- **Registry wiring:** add `import "./embed/definition.js";` to `src/lib/widgets/index.ts`.

## Proposed settings type

```ts
// src/lib/widgets/embed/definition.ts
export type EmbedPlatform =
  | "youtube"
  | "vimeo"
  | "spotify"
  | "codepen"
  | "twitter"
  | "reddit"
  | "unknown";

export type EmbedSecurity = "strict" | "moderate" | "permissive";
export type EmbedAspectRatio = "16:9" | "4:3" | "1:1" | "auto";

export type EmbedSettings = {
  rawCode: string; // the user-pasted HTML
  sanitizedCode: string; // cached result of running DOMPurify on rawCode
  platform: EmbedPlatform; // auto-detected, user can override
  security: EmbedSecurity;
  aspectRatio: EmbedAspectRatio;
  refreshIntervalMin: number; // 0 = no auto-refresh
  lastSanitizedAt: number;
  paddingV: number;
  paddingH: number;
};
```

Storing the sanitized output means we don't have to re-run `DOMPurify` on every render. It does mean we re-sanitize on every edit, which is what you want.

## Settings form outline

| Setting                | Control                                        | Default    | Notes                                                             |
| ---------------------- | ---------------------------------------------- | ---------- | ----------------------------------------------------------------- |
| **Embed code**         | large textarea + "Paste from clipboard" button | empty      | On blur, sanitize and update `sanitizedCode`.                     |
| **Platform**           | select (auto-detected, can override)           | auto       | Determines defaults for security + aspect ratio.                  |
| **Security level**     | segmented: strict / moderate / permissive      | `moderate` | Maps to an `iframe sandbox` attribute set (see below).            |
| **Aspect ratio**       | segmented: 16:9 / 4:3 / 1:1 / auto             | `16:9`     |                                                                   |
| **Auto-refresh**       | select: Off / 5 / 15 / 30 / 60 min             | `Off`      | For embeds with live content (e.g. Twitter timeline).             |
| **Live preview**       | rendered iframe inside the settings dialog     | —          | Uses the current sanitized code + security/aspect-ratio settings. |
| **Vertical padding**   | range 0–80 px                                  | `0`        |                                                                   |
| **Horizontal padding** | range 0–80 px                                  | `0`        |                                                                   |

## Security sandbox levels

```ts
// src/lib/widgets/embed/platforms.ts
export const SANDBOX_BY_SECURITY: Record<EmbedSecurity, string> = {
  strict: "allow-scripts",
  moderate: "allow-scripts allow-same-origin",
  permissive: "allow-scripts allow-same-origin allow-popups allow-forms",
};
```

- `strict` — scripts run but can't talk to their origin. Works for most `<iframe>` video embeds; breaks blockquote-style embeds that need `allow-same-origin`.
- `moderate` — default. Works for YouTube, Vimeo, Spotify, CodePen, Twitter, most things.
- `permissive` — add `allow-popups` for "watch on YouTube" links, `allow-forms` for embeds with inputs (polls, comments). Only available as an explicit opt-in.

The widget must **never** render an iframe without a `sandbox` attribute.

## Sanitizer config

```ts
// src/lib/widgets/embed/sanitize.ts
import DOMPurify from "dompurify";

const config = {
  ALLOWED_TAGS: ["iframe", "blockquote", "script", "a", "p", "div", "span"],
  ALLOWED_ATTR: [
    "src",
    "width",
    "height",
    "frameborder",
    "allow",
    "allowfullscreen",
    "class",
    "data-*",
    "href",
    "target",
    "rel",
  ],
  ADD_URI_SAFE_ATTR: ["data-src"],
  // Scripts are allowed but only with a src attribute — no inline JS.
  FORBID_TAGS: [],
  FORBID_ATTR: ["onerror", "onclick", "onload"],
};

export function sanitizeEmbed(raw: string): string {
  return DOMPurify.sanitize(raw, config);
}
```

This config will need tuning per platform. The Twitter blockquote pattern requires allowing `<script src="https://platform.twitter.com/widgets.js">` — which is exactly the kind of thing `DOMPurify` distrusts by default. Expect the config to evolve during implementation.

## Implementation notes

- **Dynamic import.** `DOMPurify` is loaded with `await import("dompurify")` inside `sanitize.ts`, so it only ships when the Embed widget is actually used. This keeps the default bundle small.
- **Rendering.** The sanitized HTML goes into the iframe via `srcdoc`, not `innerHTML`. `srcdoc` isolates the embed from the parent document's global scope even further.
- **Aspect ratio.** Wrap the iframe in a container using `aspect-ratio: 16 / 9` (Tailwind v4 utility `aspect-video`) and let the iframe fill 100%/100% of that wrapper.
- **Preview.** The settings dialog previews the embed inside a fixed-size container so changes can be inspected before applying. Preview and live widget share the same render code.
- **Error handling.** If sanitization strips everything (e.g. the user pasted plain text), show an error bar in the settings form and don't update `sanitizedCode`.
- **Icons.** `lucide-svelte`: `Clipboard`, `ShieldCheck`, `Eye`.

## Manifest impact

Probably none — same reasoning as Mini-Sites. The embed's network calls come from inside the iframe, which is a normal web request. Verify during implementation.

If a specific platform requires an explicit host permission to work inside an extension page, document it in the widget's settings and the release notes.

## Testing checklist (Firefox MV2)

- [ ] Widget appears in the **Add widget** dialog.
- [ ] Settings dialog opens; textarea accepts input and sanitizes on blur.
- [ ] Paste-from-clipboard button works (fails gracefully if permission denied).
- [ ] YouTube video embed renders and plays in the widget.
- [ ] Vimeo embed renders and plays.
- [ ] Spotify playlist embed renders.
- [ ] CodePen embed renders and is interactive.
- [ ] Twitter/X blockquote embed renders (moderate security level).
- [ ] Script injection attempt via `onerror=...` is stripped by sanitizer.
- [ ] Plain-text paste shows an error instead of rendering nothing.
- [ ] Every rendered iframe has a non-empty `sandbox` attribute.
- [ ] Dynamic-import of `DOMPurify` doesn't ship in the main bundle (verify via `npm run build` output).
- [ ] `npm run check` passes cleanly.

## Out of scope for v1

Custom embed template library, community-shared embed gallery, analytics on embed engagement, A/B rotation, advanced iframe bridge communication, mobile touch-optimized embed handling, CMS integration. v1 is paste-a-snippet, sanitize, render. That's it.
