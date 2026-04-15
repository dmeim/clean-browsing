# Weather Widget (WIP)

> **Status:** ⭕ Planned
>
> **Stage:** Planning / design
>
> This is a design document for a widget that does **not** ship yet. Scope and settings are provisional.

## Overview

A weather widget showing current conditions, a short hourly outlook, and a multi-day forecast for either an auto-detected or a user-supplied location.

**This widget makes network calls.** That's allowed under Clean Browsing's network policy — widgets whose core function requires network are permitted to fetch what they need, as long as the calls are opt-in, disclosed in the settings dialog, and scoped to only the hosts the widget actually uses. See the "Widgets that make network calls" section in [`docs/widgets/README.md`](./README.md) for the shared rules.

Concrete implications for Weather:

1. The manifest needs a **host permission** for the weather API.
2. [`docs/PRIVACY_POLICY.md`](../PRIVACY_POLICY.md) must be updated to list the weather provider host and note that the Weather widget is the source of those requests.
3. A freshly-added Weather widget must not fire any network call until the user has actually configured a location — no "helpful" auto-fetch on widget mount.

## Data source options

1. **[Open-Meteo](https://open-meteo.com/)** — free, no API key, global coverage, generous rate limits, CORS-enabled. **Recommended.**
2. **US National Weather Service (weather.gov)** — free, no key, but US-only and requires a two-step request flow (coordinates → grid points → forecast).
3. **OpenWeatherMap / AccuWeather** — require API keys, which we have no good way to handle in an open-source unsigned extension.

**Lean preference: Open-Meteo.** Global, keyless, well-documented, and drops the "add your API key" onboarding friction.

## Core features

- Current conditions: temperature, condition label, feels-like, humidity, wind.
- Hourly outlook for the next 12 hours (horizontal scroll / compact strip).
- Daily forecast for 3–7 days (high/low, condition icon).
- Location options: auto-detect via `navigator.geolocation`, or user-entered city/coordinates.
- Unit toggle: °C or °F (and km/h vs mph).
- Refresh interval: 15 min / 30 min / 1 hr / 2 hr.
- Client-side cache so a reload doesn't re-fetch immediately.

## Open design questions

1. **Geolocation permission.** `navigator.geolocation` prompts the user on first use, which is fine, but requires adding `"geolocation"` to `public/manifest.json`. Auto-detect should be opt-in inside the widget settings rather than firing on widget mount.
2. **Host permission.** The weather API URL needs to be added to `public/manifest.json`'s `permissions` list as a host pattern (e.g. `"https://api.open-meteo.com/*"`).
3. **Caching.** Weather data belongs in `WidgetSettings.cachedData`, keyed with a fetch timestamp. Invalidate when stale relative to `refreshIntervalMin` or when the user clicks a manual refresh button.
4. **Icon set.** Shipping a weather-icon font or SVG pack adds bytes. `lucide-svelte` has `Sun`, `Cloud`, `CloudRain`, `Snowflake`, `Wind`, etc. — good enough for v1.
5. **Alerts.** NWS-style severe weather alerts are US-only. Open-Meteo doesn't provide them. Skip alerts in v1 unless we add a second provider.

## Proposed widget ID & source layout

- **Widget ID:** `weather`
- **Default size:** 6 × 4 (grid cells)
- **Source (proposed):** `src/lib/widgets/weather/`
  - `Weather.svelte`
  - `WeatherSettings.svelte`
  - `definition.ts`
  - `api.ts` — small wrapper around the Open-Meteo endpoints with typed responses.
- **Registry wiring:** add `import "./weather/definition.js";` to `src/lib/widgets/index.ts`.

## Proposed settings type

```ts
// src/lib/widgets/weather/definition.ts
export type WeatherLocation =
  | { kind: "auto" }
  | { kind: "manual"; label: string; lat: number; lon: number };

export type WeatherSettings = {
  location: WeatherLocation;
  forecastDays: 3 | 5 | 7;
  units: "metric" | "imperial";
  refreshIntervalMin: 15 | 30 | 60 | 120;
  compactMode: boolean; // current-only vs full layout
  hasBeenConfigured: boolean; // gate first fetch behind explicit opt-in
  cachedData: CachedWeather | null;
  paddingV: number;
  paddingH: number;
};

export type CachedWeather = {
  fetchedAt: number; // epoch ms
  source: "open-meteo";
  current: { tempC: number; conditionCode: number; humidity: number; windKph: number };
  hourly: Array<{ time: string; tempC: number; conditionCode: number }>;
  daily: Array<{ date: string; minC: number; maxC: number; conditionCode: number }>;
};
```

Unit conversion happens at render time based on `settings.units`, so the cache is always metric.

## Settings form outline

| Setting                | Control                                        | Default  | Notes                                                         |
| ---------------------- | ---------------------------------------------- | -------- | ------------------------------------------------------------- |
| **Location**           | segmented: Auto-detect / Manual                | Manual   | Auto-detect prompts for geolocation. Manual has a search box. |
| **Manual location**    | search input (city name → Open-Meteo geocoder) | empty    | Uses Open-Meteo's free geocoding endpoint on submit.          |
| **Forecast days**      | segmented: 3 / 5 / 7                           | `5`      |                                                               |
| **Units**              | segmented: °C·km/h / °F·mph                    | `metric` |                                                               |
| **Refresh interval**   | select: 15 / 30 / 60 / 120 min                 | `60`     | Lower = more API hits; Open-Meteo tolerates 60 min well.      |
| **Compact mode**       | toggle                                         | `off`    | Shows only current conditions, no hourly/daily strip.         |
| **Vertical padding**   | range 0–80 px                                  | `8`      |                                                               |
| **Horizontal padding** | range 0–80 px                                  | `12`     |                                                               |

A clear "This widget will make HTTP requests to open-meteo.com" notice should appear at the top of the settings form the first time the widget is added, matching the project's explicit-consent ethos.

## Implementation notes

- **API layer.** Keep all network logic in `api.ts` with typed request/response helpers. Use `fetch` with an `AbortController` so unmounting the widget cancels in-flight requests.
- **Refresh.** Use a `$effect` that sets up a single `setInterval` based on `refreshIntervalMin` and clears it on unmount. Don't spin up one interval per render.
- **Error handling.** Network failure should show a small error bar inside the widget, not a toast, so it doesn't spam the whole UI on every bad connection.
- **Icons.** `lucide-svelte` icons mapped from Open-Meteo's [WMO weather codes](https://open-meteo.com/en/docs#api-documentation) via a small lookup table.
- **Styling.** Tailwind v4 utilities, existing widget-chrome variables. Use `--widget-text` for all text colors so the widget respects global theme tokens.

## Manifest impact

```diff
  "permissions": [
    "storage",
    "unlimitedStorage",
+   "geolocation",
+   "https://api.open-meteo.com/*",
+   "https://geocoding-api.open-meteo.com/*"
  ]
```

Plus a privacy-policy update.

## Testing checklist (Firefox MV2)

- [ ] Widget appears in the **Add widget** dialog.
- [ ] Settings dialog opens; location search returns results.
- [ ] Auto-detect opt-in prompts for geolocation once, then caches coordinates.
- [ ] Forecast renders at 6×4, 8×5, and 10×6 widget sizes without layout thrash.
- [ ] Cached data is served on reload without an immediate refetch.
- [ ] Network errors display in-widget without crashing the grid.
- [ ] `npm run check` passes cleanly.
- [ ] Privacy policy and README are updated to reflect the new network call.

## Out of scope for v1

Severe-weather alerts, radar maps, historical data, air-quality index, UV index, weather-based themes, calendar integration, and multi-location dashboards. The v1 widget is one location, current + short forecast, nothing else.
