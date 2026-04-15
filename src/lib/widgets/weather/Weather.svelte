<script lang="ts">
  import type { WidgetProps } from "$lib/widgets/types.js";
  import { WEATHER_CACHE_SCHEMA, type WeatherSettings, type CachedWeather } from "./definition.js";
  import { fetchForecast } from "./api.js";
  import { iconForCode, labelForCode } from "./icons.js";
  import WeatherIcon from "./WeatherIcon.svelte";

  let { settings, updateSettings }: WidgetProps<WeatherSettings> = $props();

  let loading = $state(false);
  let error = $state<string | null>(null);

  function cToDisplay(c: number): number {
    return settings.units === "imperial" ? Math.round((c * 9) / 5 + 32) : Math.round(c);
  }

  function kphToDisplay(kph: number): number {
    return settings.units === "imperial" ? Math.round(kph * 0.621371) : Math.round(kph);
  }

  const tempUnit = $derived(settings.units === "imperial" ? "°F" : "°C");
  const windUnit = $derived(settings.units === "imperial" ? "mph" : "km/h");

  function formatHour(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "numeric" });
  }

  function formatDay(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString([], { weekday: "short" });
  }

  async function refresh(force: boolean) {
    if (!settings.hasBeenConfigured) return;
    if (settings.location.lat === 0 && settings.location.lon === 0) return;

    if (!force && settings.cachedData) {
      const ageMin = (Date.now() - settings.cachedData.fetchedAt) / 60000;
      if (ageMin < settings.refreshIntervalMin) return;
    }

    loading = true;
    error = null;
    const ctrl = new AbortController();
    try {
      const data: CachedWeather = await fetchForecast(
        settings.location.lat,
        settings.location.lon,
        ctrl.signal,
      );
      updateSettings({ ...settings, cachedData: data });
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        error = (e as Error).message || "Failed to load weather";
      }
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    // Primary refresh loop. Re-runs on location / interval / configured-flag
    // changes. Does NOT depend on forecastDays or hoursAhead — those are
    // normally applied by slicing the existing cache at render time.
    const lat = settings.location.lat;
    const lon = settings.location.lon;
    const intervalMin = settings.refreshIntervalMin;
    const configured = settings.hasBeenConfigured;

    if (!configured || (lat === 0 && lon === 0)) return;

    refresh(false);
    const id = setInterval(() => refresh(true), intervalMin * 60_000);
    return () => clearInterval(id);
  });

  $effect(() => {
    // Cache-insufficiency / schema-drift fallback. Forces a refetch when:
    //   1. The user bumps `forecastDays` or `hoursAhead` beyond what's
    //      stored — slicing can't synthesize data we don't have.
    //   2. The cached payload predates the current schema version (e.g.
    //      an older widget cache that's missing sunrise/sunset or
    //      UV/precip probability fields). Those old caches would
    //      otherwise linger until their refresh interval expired.
    const data = settings.cachedData;
    const wantDays = settings.forecastDays ?? 5;
    const wantHours = settings.hoursAhead ?? 12;
    if (!data || loading) return;
    if (
      data.daily.length < wantDays ||
      data.hourly.length < wantHours ||
      (data.schemaVersion ?? 0) < WEATHER_CACHE_SCHEMA
    ) {
      refresh(true);
    }
  });

  const padV = $derived(settings.paddingV ?? 8);
  const padH = $derived(settings.paddingH ?? 12);
  const cached = $derived(settings.cachedData);
  const displayTitle = $derived(
    (settings.customTitle ?? "").trim() || settings.location.label || "Location",
  );
  const visibleHourly = $derived(cached ? cached.hourly.slice(0, settings.hoursAhead ?? 12) : []);
  const visibleDaily = $derived(cached ? cached.daily.slice(0, settings.forecastDays ?? 5) : []);
  const today = $derived(cached && cached.daily.length > 0 ? cached.daily[0] : null);

  function formatTimeOfDay(iso: string | null): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
</script>

<div class="widget-card weather">
  <div
    class="widget-inner weather-inner"
    style="top: {padV}px; bottom: {padV}px; left: {padH}px; right: {padH}px;"
  >
    {#if !settings.hasBeenConfigured}
      <div class="empty">
        <WeatherIcon name="map-pin" size={28} />
        <p>Open settings to pick a location.</p>
      </div>
    {:else if !cached && loading}
      <div class="empty">
        <WeatherIcon name="refresh-cw" size={20} class="spin" />
        <p>Loading…</p>
      </div>
    {:else if !cached && error}
      <div class="empty error-empty">
        <WeatherIcon name="alert-circle" size={20} />
        <p>{error}</p>
        <button type="button" class="retry" onclick={() => refresh(true)}>Retry</button>
      </div>
    {:else if cached}
      <header class="head">
        <div class="location">
          <WeatherIcon name="map-pin" size={12} />
          <span class="loc-label">{displayTitle}</span>
        </div>
        <button
          type="button"
          class="icon-btn"
          title="Refresh"
          aria-label="Refresh weather"
          onclick={() => refresh(true)}
        >
          <WeatherIcon name="refresh-cw" size={14} class={loading ? "spin" : ""} />
        </button>
      </header>

      <section class="current">
        <WeatherIcon name={iconForCode(cached.current.conditionCode)} size={48} />
        <div class="current-text">
          <div class="temp">
            {cToDisplay(cached.current.tempC)}<span class="unit">{tempUnit}</span>
          </div>
          <div class="condition">{labelForCode(cached.current.conditionCode)}</div>
          <div class="meta">
            Feels {cToDisplay(cached.current.feelsLikeC)}{tempUnit}
          </div>
        </div>
        <div class="stats">
          <div class="stat" title="Humidity">
            <WeatherIcon name="droplets" size={12} />
            <span>{Math.round(cached.current.humidity)}%</span>
          </div>
          <div class="stat" title="Wind">
            <WeatherIcon name="wind" size={12} />
            <span>{kphToDisplay(cached.current.windKph)} {windUnit}</span>
          </div>
          {#if today && today.precipProbabilityMax !== null}
            <div class="stat" title="Chance of precipitation (today's max)">
              <WeatherIcon name="umbrella" size={12} />
              <span>{Math.round(today.precipProbabilityMax)}%</span>
            </div>
          {/if}
          {#if today && today.uvIndexMax !== null}
            <div class="stat" title="UV index (today's max)">
              <WeatherIcon name="sun" size={12} />
              <span>UV {Math.round(today.uvIndexMax)}</span>
            </div>
          {/if}
        </div>
      </section>

      {#if today && (today.sunriseIso || today.sunsetIso)}
        <div class="sun-times">
          {#if today.sunriseIso}
            <div class="sun-time" title="Sunrise">
              <WeatherIcon name="sunrise" size={14} />
              <span>{formatTimeOfDay(today.sunriseIso)}</span>
            </div>
          {/if}
          {#if today.sunsetIso}
            <div class="sun-time" title="Sunset">
              <WeatherIcon name="sunset" size={14} />
              <span>{formatTimeOfDay(today.sunsetIso)}</span>
            </div>
          {/if}
        </div>
      {/if}

      {#if !settings.compactMode}
        {#if visibleHourly.length > 0}
          <section class="hourly">
            {#each visibleHourly as h (h.time)}
              <div class="hour">
                <span class="hour-time">{formatHour(h.time)}</span>
                <WeatherIcon name={iconForCode(h.conditionCode)} size={16} />
                <span class="hour-temp">{cToDisplay(h.tempC)}°</span>
              </div>
            {/each}
          </section>
        {/if}

        {#if visibleDaily.length > 0}
          <section class="daily">
            {#each visibleDaily as d (d.date)}
              <div class="day">
                <span class="day-name">{formatDay(d.date)}</span>
                <WeatherIcon name={iconForCode(d.conditionCode)} size={16} />
                <span class="day-range">
                  <span class="hi">{cToDisplay(d.maxC)}°</span>
                  <span class="lo">{cToDisplay(d.minC)}°</span>
                </span>
              </div>
            {/each}
          </section>
        {/if}
      {/if}

      {#if error}
        <div class="error-bar">
          <WeatherIcon name="alert-circle" size={12} />
          <span>{error}</span>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .weather-inner {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    color: var(--widget-text, rgb(241 245 249));
    overflow: hidden;
  }

  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: var(--widget-text, rgb(148 163 184));
    text-align: center;
  }

  .empty p {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.85;
  }

  .error-empty .retry {
    margin-top: 0.25rem;
    padding: 0.25rem 0.6rem;
    border-radius: 0.375rem;
    border: 1px solid currentColor;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 0.75rem;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .location {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.7;
    min-width: 0;
  }

  .loc-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .icon-btn {
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    opacity: 0.7;
    padding: 0.15rem;
    border-radius: 0.25rem;
    display: inline-flex;
  }

  .icon-btn:hover {
    opacity: 1;
  }

  .current {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .current-text {
    min-width: 0;
  }

  .temp {
    font-size: 2rem;
    font-weight: 600;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .unit {
    font-size: 0.9rem;
    font-weight: 400;
    margin-left: 0.1rem;
    opacity: 0.85;
  }

  .condition {
    font-size: 0.8rem;
    margin-top: 0.15rem;
    opacity: 0.9;
  }

  .meta {
    font-size: 0.7rem;
    opacity: 0.65;
    margin-top: 0.1rem;
  }

  .stats {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.7rem;
    opacity: 0.8;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-variant-numeric: tabular-nums;
  }

  .sun-times {
    display: flex;
    justify-content: center;
    gap: 1rem;
    font-size: 0.72rem;
    opacity: 0.75;
    flex-shrink: 0;
    padding-top: 0.1rem;
  }

  .sun-time {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-variant-numeric: tabular-nums;
  }

  .hourly {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
    flex-shrink: 0;
    scrollbar-width: thin;
    justify-content: safe center;
  }

  .hour {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    min-width: 2.25rem;
    font-size: 0.7rem;
    opacity: 0.85;
  }

  .hour-temp {
    font-variant-numeric: tabular-nums;
  }

  .daily {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .day {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
  }

  .day-name {
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.8;
  }

  .day-range {
    display: flex;
    gap: 0.4rem;
    font-variant-numeric: tabular-nums;
    min-width: 3rem;
    justify-content: flex-end;
  }

  .hi {
    font-weight: 600;
  }

  .lo {
    opacity: 0.6;
  }

  .error-bar {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
    color: rgb(248 113 113);
    flex-shrink: 0;
  }

  :global(.spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
