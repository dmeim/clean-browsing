import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import Weather from "./Weather.svelte";
import GeneralTab from "./GeneralTab.svelte";
import WidgetAppearanceTab from "$lib/ui/settings/WidgetAppearanceTab.svelte";

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
  settingsTabs: [
    {
      id: "appearance",
      label: "Appearance",
      icon: "M12 3a9 9 0 1 0 9 9c0-1.66-3-2-3-4s2.34-1 2-3c-.37-2.2-4-5-8-5z M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M12 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M16 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
      component: WidgetAppearanceTab,
    },
    {
      id: "general",
      label: "General",
      icon: "M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36-1.41 1.41M7.05 16.95l-1.41 1.41m12.72 0-1.41-1.41M7.05 7.05 5.64 5.64M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
      component: GeneralTab,
    },
  ],
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
