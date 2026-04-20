# Quote Widget (WIP)

> **Status:** :red_circle: Planned
>
> **Stage:** Design

## Overview

A rotating quote display for the new-tab page. Ships with a bundled collection of curated quotes so it works fully offline out of the box. Users can add, edit, and remove quotes to build their own collection. The rotation can be daily (one quote per day), per new-tab-open, or manual (click to advance).

The goal is ambient inspiration — a widget that adds personality to the dashboard without requiring configuration. Drop it on the grid and it works immediately.

## Core features

- Bundled default collection (~100-150 curated quotes across categories: motivation, philosophy, humor, creativity, science).
- User-managed custom quotes: add, edit, delete. Custom quotes mix into the rotation alongside bundled ones.
- Rotation modes: daily (same quote all day), on every new-tab open, or manual (click/tap to advance).
- Quote display: text + attribution line (author, optional source).
- Scales from small (just the quote text) to large (quote + author + source + decorative quotation marks).
- Category filtering: toggle which categories appear in the rotation (e.g., show only "motivation" and "philosophy").
- "Pin" a quote to keep it displayed until manually unpinned.
- Fully offline. No API calls.

## Open design questions

1. **Bundled quote size.** 100-150 quotes at ~200 bytes each is ~30 KB — negligible in the bundle. Alternatively, lazy-load the quote set from a JSON file via dynamic import. **Lean preference: inline in the definition module.** It's small enough and avoids async complexity on first render.
2. **Daily rotation determinism.** "Daily" should show the same quote all day, even across tab opens. Use a seeded hash of the date string to pick an index into the filtered collection. This avoids persisting "today's quote" and handles timezone changes gracefully.
3. **Custom-only mode.** If the user deletes all bundled categories, should the widget show only custom quotes? Yes — and if there are no custom quotes either, show an empty state prompting the user to add one or re-enable categories.
4. **Quote length and overflow.** Long quotes may not fit in a small widget. **Recommendation: truncate with an ellipsis at the widget boundary and show the full quote on hover or in a tooltip. Alternatively, enable vertical scroll for very long quotes.** The `fitText` action won't work here — quotes have variable length, so a fixed minimum font size with overflow handling is more appropriate.
5. **Import/export.** Users might want to import a list of quotes from a text file or JSON. Nice-to-have for v1 if it's simple (paste JSON into a textarea), but not critical.

## Proposed widget ID & source layout

- **Widget ID:** `quote`
- **Default size:** 6 x 3 (grid cells)
- **Minimum size:** 3 x 2
- **Source (proposed):** `src/lib/widgets/quote/`
  - `Quote.svelte`
  - `QuoteSettings.svelte`
  - `definition.ts`
  - `quotes.ts` — bundled quote collection with categories
- **Registry wiring:** add `import "./quote/definition.js";` to `src/lib/widgets/index.ts`.

## Proposed settings type

```ts
// src/lib/widgets/quote/definition.ts
export type QuoteCategory =
  | "motivation"
  | "philosophy"
  | "humor"
  | "creativity"
  | "science"
  | "literature"
  | "custom";

export type QuoteItem = {
  id: string; // crypto.randomUUID() for custom; stable hash for bundled
  text: string;
  author: string;
  source: string; // optional: book, speech, etc.
  category: QuoteCategory;
};

export type QuoteRotation = "daily" | "new-tab" | "manual";

export type QuoteSettings = {
  customQuotes: QuoteItem[];
  enabledCategories: QuoteCategory[];
  rotation: QuoteRotation;
  pinnedQuoteId: string | null; // overrides rotation when set
  showAuthor: boolean;
  showSource: boolean;
  showQuotationMarks: boolean; // decorative large quote marks
  textAlign: "left" | "center" | "right";
  paddingV: number;
  paddingH: number;
};
```

Bundled quotes live in `quotes.ts` as a static array, not in settings. Only custom quotes are persisted per-instance.

## Settings form outline

| Setting                | Control                                | Default     | Notes                                                         |
| ---------------------- | -------------------------------------- | ----------- | ------------------------------------------------------------- |
| **Rotation**           | segmented: Daily / New tab / Manual    | `Daily`     |                                                               |
| **Categories**         | multi-toggle pills                     | all enabled | Filter which bundled categories appear in rotation.           |
| **Custom quotes**      | editable list (text + author + source) | empty       | Add / edit / delete. Custom quotes get the "custom" category. |
| **Show author**        | toggle                                 | `on`        |                                                               |
| **Show source**        | toggle                                 | `off`       | Only rendered when the quote has a non-empty source field.    |
| **Quotation marks**    | toggle                                 | `on`        | Large decorative marks flanking the quote text.               |
| **Text alignment**     | segmented: Left / Center / Right       | `Center`    |                                                               |
| **Vertical padding**   | range 0-80 px                          | `16`        |                                                               |
| **Horizontal padding** | range 0-80 px                          | `16`        |                                                               |

## Implementation notes

- **Quote selection.** A `$derived` computes the active quote based on the rotation mode:
  - `daily`: hash today's ISO date string to an index. `hashCode(new Date().toISOString().slice(0, 10)) % pool.length`.
  - `new-tab`: pick a random index on mount. No persistence needed — each mount is a new tab.
  - `manual`: track `currentIndex` in `$state`; increment on click.
  - If `pinnedQuoteId` is set, bypass all rotation logic and display that quote.
- **Quote pool.** Merge bundled quotes (filtered by `enabledCategories`) with `customQuotes`. Sort deterministically by `id` so the daily hash produces a stable result even as quotes are added.
- **Layout.** Flex column, centered. Quote text in a `<blockquote>` element for semantics. Attribution in a `<cite>` below. Decorative quotation marks as `::before` / `::after` pseudo-elements on the blockquote, using a large serif font.
- **Overflow.** Set a `min-font-size` (e.g., 0.75rem) and let text overflow with `overflow-y: auto` and hidden scrollbar. Don't use `fitText` — variable quote lengths make it jittery.
- **Transition.** Fade transition (200ms opacity) when the quote changes. Use Svelte's `transition:fade` or a CSS transition on the quote container.
- **Bundled quotes file.** `quotes.ts` exports a `readonly QuoteItem[]`. Categories are a union type so the compiler catches typos. Curate from public-domain quote collections — no copyrighted material.
- **Icons.** `lucide-svelte`: `Quote`, `Pin`, `Shuffle`, `Plus`, `Trash2`.

## Manifest impact

None. No permissions or network calls required.

## Testing checklist (Firefox MV2)

- [ ] Widget appears in the **Add widget** dialog.
- [ ] On first add, a bundled quote displays immediately (no configuration needed).
- [ ] Daily rotation: same quote shows across multiple tab opens on the same day.
- [ ] Daily rotation: different quote shows the next day (advance system clock to verify).
- [ ] New-tab rotation: different quote on each new tab open.
- [ ] Manual rotation: quote changes on click; stays put otherwise.
- [ ] Pin a quote: pinned quote overrides rotation until unpinned.
- [ ] Category toggling filters the pool; disabled categories don't appear.
- [ ] Add a custom quote; it appears in rotation.
- [ ] Edit / delete custom quotes.
- [ ] Show/hide author and source toggles work.
- [ ] Quotation marks toggle adds/removes decorative marks.
- [ ] Long quotes don't break layout (overflow handled gracefully).
- [ ] Fade transition on quote change is smooth.
- [ ] Widget scales cleanly from 3 x 2 to large sizes.
- [ ] `npm run check` passes cleanly.

## Out of scope for v1

Quote API integration (e.g., quotable.io), social sharing, quote-of-the-day notifications, user-uploaded background images per quote, quote collections/themes, community quote packs, search within quotes, favorite/bookmark individual quotes, quote export, text-to-speech. v1 is a bundled collection with user customization and three rotation modes.
