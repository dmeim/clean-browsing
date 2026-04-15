import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import Weather from "./Weather.svelte";
import WeatherSettingsForm from "./WeatherSettings.svelte";

export type WeatherLocation =
  | { kind: "auto"; label: string; lat: number; lon: number }
  | { kind: "manual"; label: string; lat: number; lon: number };

export type CachedWeatherCurrent = {
  tempC: number;
  feelsLikeC: number;
  conditionCode: number;
  humidity: number;
  windKph: number;
};

export type CachedWeatherHour = {
  time: string;
  tempC: number;
  conditionCode: number;
};

export type CachedWeatherDay = {
  date: string;
  minC: number;
  maxC: number;
  conditionCode: number;
  sunriseIso: string | null;
  sunsetIso: string | null;
  uvIndexMax: number | null;
  precipProbabilityMax: number | null;
};

// Bumped whenever the cache shape gains new required fields. Existing
// stored payloads with an older (or missing) version are treated as stale
// and force-refreshed by Weather.svelte on mount.
export const WEATHER_CACHE_SCHEMA = 2;

export type CachedWeather = {
  schemaVersion: number;
  fetchedAt: number;
  source: "open-meteo";
  current: CachedWeatherCurrent;
  hourly: CachedWeatherHour[];
  daily: CachedWeatherDay[];
};

export type WeatherSettings = {
  location: WeatherLocation;
  customTitle: string; // empty string = use location.label
  forecastDays: 3 | 5 | 7;
  hoursAhead: 3 | 6 | 12 | 24 | 48;
  units: "metric" | "imperial";
  refreshIntervalMin: 15 | 30 | 60 | 120;
  compactMode: boolean;
  hasBeenConfigured: boolean;
  cachedData: CachedWeather | null;
  paddingV: number;
  paddingH: number;
};

export const weatherDefinition: WidgetDefinition<WeatherSettings> = {
  id: "weather",
  name: "Weather",
  description: "Current conditions and forecast from Open-Meteo",
  component: Weather,
  settingsComponent: WeatherSettingsForm,
  defaultSize: { w: 6, h: 4 },
  defaultSettings: {
    location: { kind: "manual", label: "", lat: 0, lon: 0 },
    customTitle: "",
    forecastDays: 5,
    hoursAhead: 12,
    units: "metric",
    refreshIntervalMin: 60,
    compactMode: false,
    hasBeenConfigured: false,
    cachedData: null,
    paddingV: 8,
    paddingH: 12,
  },
};

registerWidget(weatherDefinition);
