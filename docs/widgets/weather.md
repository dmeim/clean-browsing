# Weather

Current conditions, today's UV index and precipitation chance, sunrise and sunset times, plus an hourly and multi-day forecast for a location of your choice. Powered by [Open-Meteo](https://open-meteo.com/) — a free, keyless weather API.

- **Widget ID:** `weather`
- **Default size:** 6 × 4 (width × height in grid cells)
- **Source:** [`src/lib/widgets/weather/`](../../src/lib/widgets/weather/)

## Network notice

This is the only widget in Clean Browsing that makes network requests, and it follows the rules described in [`PRIVACY_POLICY.md`](../PRIVACY_POLICY.md):

- A freshly added Weather widget makes **no requests** until you pick a location in its settings.
- Once configured, it contacts only `api.open-meteo.com` (forecast) and `geocoding-api.open-meteo.com` (city search). No other host.
- Forecasts refresh on the interval you choose (15 min – 2 hr). The widget also serves the previous response from a local cache between refreshes, so reloading the new tab does not re-fetch.
- Geolocation is requested only when you click **Use my location** in the widget settings, and only then.

If you remove the Weather widget from your grid, all of its outbound traffic stops.

## Usage

1. Add **Weather** from the **Add widget** menu in edit mode. The widget will show a placeholder asking you to pick a location.
2. Open the widget's settings (gear icon in edit mode).
3. Either type a city name and click **Search** to pick from results, or click **Use my location** to grant Firefox's geolocation permission once.
4. The widget will fetch its first forecast and start displaying current conditions, an hourly strip, and a multi-day outlook.

## Settings

| Setting                | Type                                  | Default | What it does                                                                                                                                                         |
| ---------------------- | ------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**              | text                                  | empty   | Custom label shown at the top of the widget. Blank falls back to the selected location's name — handy when "Use my location" gives you a generic "Current location." |
| **Location**           | search box + "Use my location" button | empty   | Pick a city via Open-Meteo's geocoder, or use the browser's geolocation API. Required before any forecast loads.                                                     |
| **Units**              | select: °C·km/h / °F·mph              | metric  | Display unit only — the cached data is always stored in metric and converted at render time, so toggling does not trigger a refetch.                                 |
| **Forecast days**      | select: 3 / 5 / 7                     | 5       | How many days the daily forecast strip shows. The widget always caches 7 days, so changing this is a pure re-render — no refetch.                                    |
| **Hours ahead**        | select: 3 / 6 / 12 / 24 / 48          | 12      | How many hours the hourly strip shows. The widget always caches 48+ hours, so changing this is also a pure re-render.                                                |
| **Refresh interval**   | select: 15 / 30 / 60 / 120 min        | 60      | How often the widget re-fetches in the background. Lower values are friendlier to a fast-moving forecast; higher values are friendlier to the API.                   |
| **Compact mode**       | toggle                                | off     | Hides the hourly strip and daily forecast, leaving only the current-conditions block. Useful for very small widget sizes.                                            |
| **Vertical padding**   | 0–80 px                               | 8       | Space between the widget content and its top/bottom edges.                                                                                                           |
| **Horizontal padding** | 0–80 px                               | 12      | Space between the widget content and its left/right edges.                                                                                                           |

## What it shows

- **Current block:** temperature, condition label, "feels like" temperature, and a column of stats on the right (humidity, wind, today's max precipitation probability, today's max UV index).
- **Sunrise / sunset row:** today's sunrise and sunset times, sitting between the current block and the forecast.
- **Hourly strip:** the next N hours (configurable — see _Hours ahead_ below). The strip automatically centers when the visible hours fit within the widget's width, and falls back to a left-aligned horizontal scroll when they don't — so a 3-hour strip in a wide widget looks clean, and a 48-hour strip in a narrow one stays usable.
- **Daily strip:** the next N days (configurable — see _Forecast days_ below).

The widget always fetches the full 7-day / 48-hour forecast window from Open-Meteo in a single request — Open-Meteo's free tier counts raw HTTP requests, not response size, so there's no cost to grabbing the max. Changing **Forecast days** or **Hours ahead** is a pure re-render with no extra network request.

## Tips

- The widget caches the most recent response in its own settings, so reopening Firefox shows the previous forecast immediately and only refetches if it is older than your refresh interval.
- If you change locations frequently, search a city, pick the result, and the widget will refetch with the new coordinates automatically.
- Network errors render an inline error bar inside the widget (no toast spam). Cached data, if present, stays visible underneath.
- Open-Meteo provides global coverage and does not require an API key, so the widget works the same way whether you are searching for "Reykjavík" or "Auckland."

## Out of scope (today)

Severe-weather alerts, radar maps, historical data, AQI (air quality), multi-location dashboards, and weather-based themes are not implemented in v1. If any of these become important, they will land as separate options or as a v2 of the widget.
