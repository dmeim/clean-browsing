# Converter Widget (WIP)

> **Status:** :red_circle: Planned
>
> **Stage:** Design

## Overview

A unit and currency converter on the new-tab page. Pick a category (length, weight, temperature, volume, speed, area, data, or currency), select two units, type a value on either side, and see the result instantly. Unit conversion is fully offline — hardcoded conversion factors with zero network calls. Currency conversion is opt-in and fetches exchange rates from a free public API, following the same network policy as the Stock and Weather widgets.

## Core features

- **Unit categories:** Length, Weight / Mass, Temperature, Volume, Speed, Area, Data / Storage.
- **Currency category:** fetches exchange rates on a configurable interval, then converts offline against the cached rates.
- Two-way input: type in either field and the other updates.
- Category selector at the top; unit dropdowns for "from" and "to."
- Swap button to flip the from/to units.
- Formatted output with locale-aware number formatting.
- Recent conversions: optionally remember the last N conversions for quick recall.
- Scales well: at small sizes, stack vertically; at wider sizes, render side-by-side.

## Unit data

All non-currency conversions use hardcoded factors relative to a base unit per category. No network calls, no lookup tables to fetch.

| Category    | Base unit  | Example units                                       |
| ----------- | ---------- | --------------------------------------------------- |
| Length      | meter      | mm, cm, m, km, in, ft, yd, mi, nmi                  |
| Weight      | kilogram   | mg, g, kg, lb, oz, st, ton (metric), ton (imperial) |
| Temperature | (formulas) | Celsius, Fahrenheit, Kelvin                         |
| Volume      | liter      | mL, L, fl oz (US), cup (US), pt, qt, gal (US), m^3  |
| Speed       | m/s        | m/s, km/h, mph, knots, ft/s                         |
| Area        | m^2        | mm^2, cm^2, m^2, km^2, in^2, ft^2, ac, ha           |
| Data        | byte       | B, KB, MB, GB, TB, PB, KiB, MiB, GiB, TiB           |

Temperature uses formulas instead of factors (C->F, C->K, F->K and inverses).

## Currency

Currency conversion follows the same pattern as the Stock widget: opt-in network, single disclosed host, cached locally.

- **Data source:** [frankfurter.dev](https://frankfurter.dev) — free, open-source, no API key, backed by ECB data. Single host: `api.frankfurter.dev`.
- **Fetch behavior:** rates are fetched once on widget mount (if stale) and then on the configured refresh interval. The response is ~3 KB for all supported currencies.
- **Offline cache:** the full rate table is stored in widget settings as `{ base: "EUR", date: "2026-04-20", rates: { USD: 1.08, GBP: 0.86, ... } }`. Subsequent renders use the cache until it expires.
- **Supported currencies:** whatever Frankfurter returns (~30 major currencies). No crypto — the Stock widget covers that.

## Open design questions

1. **Single widget vs separate unit/currency widgets.** Currency adds network complexity that unit conversion doesn't have. Merging them means one widget handles both offline and online modes. **Lean preference: single widget.** The UI is identical (category -> from -> to -> value -> result); currency is just another category with a fetch step. Separating them doubles the widget count for no UX benefit.
2. **Rate staleness.** ECB publishes rates once per business day (~16:00 CET). Refreshing more often than daily is pointless for ECB data, but the user might not know that. **Recommendation: default refresh interval of 24 hours for currency. Show the rate date in the widget ("Rates from Apr 20, 2026") so the user knows how fresh the data is.**
3. **Precision.** How many decimal places? **Recommendation: auto — show up to 6 significant digits, trimming trailing zeros. Currency always shows 2 decimal places.** A "decimal places" setting in the settings form for users who want more control.
4. **Favorites / pinned conversions.** Users might always convert the same pairs (kg -> lb, EUR -> USD). A "favorite conversions" list that appears as quick-access buttons is useful but adds UI complexity. **Defer to v2.** For v1, the widget remembers its last-used category + units, which covers the common case.
5. **Keyboard-first input.** The widget should be usable without a mouse: Tab between fields, Enter to swap, arrow keys to change units. This is good a11y practice and natural for a utility widget.

## Proposed widget ID & source layout

- **Widget ID:** `converter`
- **Default size:** 4 x 3 (grid cells)
- **Minimum size:** 3 x 2
- **Source (proposed):** `src/lib/widgets/converter/`
  - `Converter.svelte`
  - `ConverterSettings.svelte`
  - `definition.ts`
  - `units.ts` — unit definitions, conversion factors, and formulas
  - `currency.ts` — Frankfurter API client + rate cache logic
- **Registry wiring:** add `import "./converter/definition.js";` to `src/lib/widgets/index.ts`.

## Proposed settings type

```ts
// src/lib/widgets/converter/definition.ts
export type ConverterCategory =
  | "length"
  | "weight"
  | "temperature"
  | "volume"
  | "speed"
  | "area"
  | "data"
  | "currency";

export type CurrencyRates = {
  base: string;
  date: string; // ISO date
  rates: Record<string, number>;
  fetchedAt: number; // epoch ms
};

export type ConverterSettings = {
  category: ConverterCategory;
  fromUnit: string; // unit code within the active category
  toUnit: string;
  lastValue: string; // persisted so the widget remembers the last input
  decimalPlaces: number | null; // null = auto (6 significant digits)
  currencyRates: CurrencyRates | null;
  currencyRefreshHours: number; // how often to refetch rates
  currencyEnabled: boolean; // whether to show the currency category at all
  paddingV: number;
  paddingH: number;
};
```

## Settings form outline

| Setting                | Control                              | Default  | Notes                                                                     |
| ---------------------- | ------------------------------------ | -------- | ------------------------------------------------------------------------- |
| **Default category**   | select (all categories)              | `Length` | Which category is selected when the widget loads.                         |
| **Decimal places**     | select: Auto / 0 / 1 / 2 / 3 / 4 / 6 | `Auto`   | Auto = 6 significant digits for units, 2 for currency.                    |
| **Enable currency**    | toggle                               | `on`     | Off removes the currency category entirely. No network calls when off.    |
| **Rate refresh**       | select: 6h / 12h / 24h / 48h         | `24h`    | Only visible when currency is enabled. ECB updates once per business day. |
| **Vertical padding**   | range 0-80 px                        | `8`      |                                                                           |
| **Horizontal padding** | range 0-80 px                        | `8`      |                                                                           |

## Implementation notes

- **Conversion engine.** `units.ts` exports a `convert(value, fromUnit, toUnit, category)` function. For factor-based categories, it normalizes to the base unit then converts to the target: `value * fromFactor / toFactor`. Temperature uses dedicated formulas. The function is pure and synchronous.
- **Currency conversion.** `currency.ts` exports `fetchRates(base: string): Promise<CurrencyRates>` and `convertCurrency(value, from, to, rates): number`. The fetch path hits `https://api.frankfurter.dev/latest?from={base}`. The result is stored in `settings.currencyRates` via `updateSettings`. On mount, if `currencyRates` is null or older than `currencyRefreshHours`, fetch fresh rates.
- **Two-way binding.** Two `<input type="number">` fields. When the user types in the "from" field, `$derived` computes the "to" value. When they type in the "to" field, the "from" value updates instead. Track which field was last edited via a `$state` flag.
- **Swap button.** A rotate icon between the two fields. On click, swap `fromUnit` and `toUnit` in settings and flip the computed values.
- **Responsive layout.** At widget widths >= ~300px, render side-by-side (flex row). Below that, stack vertically (flex column). Use a container query or a `$derived` check on widget dimensions.
- **Number formatting.** Use `Intl.NumberFormat` with the user's locale for display. Currency mode adds the currency code as a suffix (not a symbol — avoids ambiguity between $ currencies).
- **Category selector.** A row of small pills or a select dropdown at the top of the widget. Each category has a lucide icon.
- **Icons.** `lucide-svelte`: `ArrowLeftRight` (swap), `Ruler` (length), `Weight` (weight), `Thermometer` (temperature), `Droplets` (volume), `Gauge` (speed), `Square` (area), `HardDrive` (data), `Coins` (currency).

## Network notice

Currency conversion contacts `api.frankfurter.dev` — a free, open-source exchange rate API backed by ECB data. This is opt-in:

- A freshly added Converter widget makes **no network calls** until the user selects the currency category.
- The `Enable currency` toggle in settings disables the category entirely; when off, the widget is 100% offline.
- Rates are cached in widget settings; subsequent renders use the cache until the refresh interval expires.
- Only one host is contacted: `api.frankfurter.dev`.

When the currency category is disabled, no network calls are made — the widget is fully offline.

## Manifest impact

Needs a host permission for the exchange rate API:

```json
"optional_permissions": ["https://api.frankfurter.dev/*"]
```

Using `optional_permissions` means Firefox won't prompt on install. The permission is requested at runtime when the user first selects the currency category. If denied, the currency category is disabled with a clear message.

## Testing checklist (Firefox MV2)

- [ ] Widget appears in the **Add widget** dialog.
- [ ] Each unit category works: select category, pick from/to units, type a value, see the result.
- [ ] Two-way input: typing in the "to" field updates the "from" field.
- [ ] Swap button flips from/to units and values.
- [ ] Temperature conversions are correct (C->F, F->K, etc.).
- [ ] Data conversions handle binary (KiB/MiB) vs decimal (KB/MB) correctly.
- [ ] Currency: selecting the currency category triggers a rate fetch (first time).
- [ ] Currency: cached rates are used on subsequent renders.
- [ ] Currency: rate date is displayed in the widget.
- [ ] Currency: disabling the toggle removes the category and stops all network calls.
- [ ] Decimal places setting works (auto, fixed values).
- [ ] Number formatting respects locale.
- [ ] Widget layout switches between horizontal and vertical at different sizes.
- [ ] Settings persist across reloads.
- [ ] Widget scales cleanly from 3 x 2 to large sizes.
- [ ] `npm run check` passes cleanly.

## Out of scope for v1

Favorite/pinned conversions, conversion history, batch conversion (multiple values at once), custom unit definitions, scientific units (pressure, energy, force), programmer units (hex/binary/octal), time zone conversion, API key support for premium rate providers, historical rate charts, rate alerts, crypto currency support (use the Stock widget for that). v1 covers the 8 categories listed above with a clean two-field interface.
