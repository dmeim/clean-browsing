<script lang="ts">
  import type { WidgetSettingsTabProps } from "$lib/widgets/types.js";
  import type { WeatherSettings, WeatherLocation } from "./definition.js";
  import { geocode, type GeocodeResult } from "./api.js";

  let { settings, updateSettings }: WidgetSettingsTabProps<WeatherSettings> = $props();

  let query = $state("");
  let searching = $state(false);
  let searchError = $state<string | null>(null);
  let results = $state<GeocodeResult[]>([]);
  let geoError = $state<string | null>(null);
  let locating = $state(false);

  function set<K extends keyof WeatherSettings>(key: K, value: WeatherSettings[K]) {
    updateSettings({ ...settings, [key]: value });
  }

  function applyLocation(loc: WeatherLocation) {
    updateSettings({
      ...settings,
      location: loc,
      hasBeenConfigured: true,
      cachedData: null,
    });
    results = [];
    query = "";
  }

  async function runSearch() {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    searching = true;
    searchError = null;
    try {
      results = await geocode(trimmed);
      if (results.length === 0) {
        searchError = "No matches found.";
      }
    } catch (e) {
      searchError = (e as Error).message || "Search failed.";
    } finally {
      searching = false;
    }
  }

  function handleSearchKey(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
    }
  }

  function pickResult(r: GeocodeResult) {
    applyLocation({ kind: "manual", label: r.label, lat: r.lat, lon: r.lon });
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      geoError = "Geolocation is not available in this browser.";
      return;
    }
    locating = true;
    geoError = null;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locating = false;
        applyLocation({
          kind: "auto",
          label: "Current location",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => {
        locating = false;
        geoError = err.message || "Could not determine location.";
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60 * 60_000 },
    );
  }

  const hasLocation = $derived(
    settings.hasBeenConfigured && !(settings.location.lat === 0 && settings.location.lon === 0),
  );
</script>

<div class="form">
  {#if !settings.hasBeenConfigured}
    <div class="notice">
      <strong>Network notice.</strong> This widget makes HTTP requests to
      <code>api.open-meteo.com</code>
      and <code>geocoding-api.open-meteo.com</code> to fetch your forecast. Nothing is sent anywhere else.
      No requests fire until you pick a location below.
    </div>
  {/if}

  <div class="section">
    <label for="weather-title" class="label">Title</label>
    <input
      id="weather-title"
      type="text"
      class="text-input"
      placeholder="Use location name"
      value={settings.customTitle ?? ""}
      oninput={(e) => set("customTitle", (e.currentTarget as HTMLInputElement).value)}
    />
    <p class="hint">Leave blank to use the location name.</p>
  </div>

  <div class="section">
    <span class="label">Location</span>
    {#if hasLocation}
      <div class="current-location">
        <span class="loc-text">{settings.location.label || "Custom coordinates"}</span>
        <span class="coords">
          {settings.location.lat.toFixed(2)}, {settings.location.lon.toFixed(2)}
        </span>
      </div>
    {/if}

    <div class="search-row">
      <input
        type="text"
        class="text-input"
        placeholder="Search city…"
        bind:value={query}
        onkeydown={handleSearchKey}
      />
      <button type="button" class="btn" onclick={runSearch} disabled={searching}>
        {searching ? "…" : "Search"}
      </button>
    </div>

    {#if searchError}
      <p class="hint error">{searchError}</p>
    {/if}

    {#if results.length > 0}
      <ul class="results">
        {#each results as r (r.label + r.lat + r.lon)}
          <li>
            <button type="button" class="result" onclick={() => pickResult(r)}>
              <span class="result-label">{r.label}</span>
              <span class="result-coords">{r.lat.toFixed(2)}, {r.lon.toFixed(2)}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    <button type="button" class="btn ghost" onclick={useMyLocation} disabled={locating}>
      {locating ? "Locating…" : "Use my location"}
    </button>
    {#if geoError}
      <p class="hint error">{geoError}</p>
    {/if}
    <p class="hint">
      Geolocation is only requested when you click the button. Your coordinates are stored locally
      and used only to fetch the forecast.
    </p>
  </div>

  <div class="section">
    <label for="weather-units" class="label">Units</label>
    <select
      id="weather-units"
      class="select"
      value={settings.units}
      onchange={(e) =>
        set("units", (e.currentTarget as HTMLSelectElement).value as WeatherSettings["units"])}
    >
      <option value="metric">°C · km/h</option>
      <option value="imperial">°F · mph</option>
    </select>
  </div>

  <div class="section">
    <label for="weather-days" class="label">Forecast days</label>
    <select
      id="weather-days"
      class="select"
      value={String(settings.forecastDays)}
      onchange={(e) =>
        set(
          "forecastDays",
          Number((e.currentTarget as HTMLSelectElement).value) as WeatherSettings["forecastDays"],
        )}
    >
      <option value="3">3 days</option>
      <option value="5">5 days</option>
      <option value="7">7 days</option>
    </select>
  </div>

  <div class="section">
    <label for="weather-hours" class="label">Hours ahead</label>
    <select
      id="weather-hours"
      class="select"
      value={String(settings.hoursAhead ?? 12)}
      onchange={(e) =>
        set(
          "hoursAhead",
          Number((e.currentTarget as HTMLSelectElement).value) as WeatherSettings["hoursAhead"],
        )}
    >
      <option value="3">Next 3 hours</option>
      <option value="6">Next 6 hours</option>
      <option value="12">Next 12 hours</option>
      <option value="24">Next 24 hours</option>
      <option value="48">Next 48 hours</option>
    </select>
  </div>

  <div class="section">
    <label for="weather-refresh" class="label">Refresh interval</label>
    <select
      id="weather-refresh"
      class="select"
      value={String(settings.refreshIntervalMin)}
      onchange={(e) =>
        set(
          "refreshIntervalMin",
          Number(
            (e.currentTarget as HTMLSelectElement).value,
          ) as WeatherSettings["refreshIntervalMin"],
        )}
    >
      <option value="15">Every 15 minutes</option>
      <option value="30">Every 30 minutes</option>
      <option value="60">Every hour</option>
      <option value="120">Every 2 hours</option>
    </select>
  </div>

  <label class="row">
    <span class="label inline">Compact mode</span>
    <input
      type="checkbox"
      checked={settings.compactMode}
      onchange={(e) => set("compactMode", (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>
</div>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .notice {
    padding: 0.6rem 0.75rem;
    border-radius: 0.5rem;
    background: rgb(30 41 59 / 0.6);
    border: 1px solid rgb(59 130 246 / 0.4);
    color: rgb(226 232 240);
    font-size: 0.78rem;
    line-height: 1.4;
  }

  .notice code {
    background: rgb(2 6 23 / 0.6);
    padding: 0.05rem 0.3rem;
    border-radius: 0.25rem;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.72rem;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .label {
    font-size: 0.8rem;
    color: rgb(148 163 184);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
  }

  .label.inline {
    text-transform: none;
    letter-spacing: normal;
    font-weight: normal;
    font-size: 0.875rem;
    color: rgb(226 232 240);
  }

  .current-location {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.5rem;
    font-size: 0.85rem;
    color: rgb(226 232 240);
    gap: 0.5rem;
  }

  .loc-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .coords {
    font-size: 0.7rem;
    color: rgb(148 163 184);
    font-variant-numeric: tabular-nums;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
  }

  .search-row {
    display: flex;
    gap: 0.4rem;
  }

  .text-input,
  .select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: rgb(2 6 23 / 0.7);
    border: 1px solid rgb(71 85 105);
    color: rgb(241 245 249);
    font-size: 0.9rem;
  }

  .text-input:focus,
  .select:focus {
    outline: none;
    border-color: rgb(59 130 246);
    box-shadow: 0 0 0 2px rgb(59 130 246 / 0.25);
  }

  .btn {
    padding: 0.5rem 0.85rem;
    border-radius: 0.5rem;
    background: rgb(59 130 246);
    color: white;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn.ghost {
    background: transparent;
    border: 1px solid rgb(71 85 105);
    color: rgb(226 232 240);
  }

  .results {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 12rem;
    overflow-y: auto;
  }

  .result {
    width: 100%;
    text-align: left;
    padding: 0.5rem 0.75rem;
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.4rem;
    color: rgb(226 232 240);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .result:hover {
    border-color: rgb(59 130 246);
  }

  .result-label {
    font-size: 0.85rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .result-coords {
    font-size: 0.7rem;
    color: rgb(148 163 184);
    font-variant-numeric: tabular-nums;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.5rem;
    cursor: pointer;
  }

  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    accent-color: rgb(59 130 246);
    cursor: pointer;
  }

  .hint {
    font-size: 0.7rem;
    color: rgb(148 163 184);
    margin: 0.1rem 0 0;
  }

  .hint.error {
    color: rgb(248 113 113);
  }
</style>
