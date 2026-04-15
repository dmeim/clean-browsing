import { WEATHER_CACHE_SCHEMA, type CachedWeather } from "./definition.js";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

export type GeocodeResult = {
  label: string;
  lat: number;
  lon: number;
};

type GeocodingResponse = {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }>;
};

type ForecastResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
  };
  daily?: {
    time?: string[];
    temperature_2m_min?: number[];
    temperature_2m_max?: number[];
    weather_code?: number[];
    sunrise?: string[];
    sunset?: string[];
    uv_index_max?: number[];
    precipitation_probability_max?: number[];
  };
};

export async function geocode(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) {
    throw new Error(`Geocoding failed: HTTP ${res.status}`);
  }
  const data = (await res.json()) as GeocodingResponse;
  if (!data.results) return [];

  return data.results.map((r) => {
    const adminParts = [r.name, r.admin1, r.country].filter((s): s is string => Boolean(s));
    return {
      label: adminParts.join(", "),
      lat: r.latitude,
      lon: r.longitude,
    };
  });
}

// Always fetch the maximum window (7 days / 168 hours). The widget slices
// the cached arrays to whatever the user picked for `forecastDays` and
// `hoursAhead`, so changing those settings is a pure re-render with no
// refetch.
const MAX_FORECAST_DAYS = 7;

export async function fetchForecast(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<CachedWeather> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lon.toString());
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m",
  );
  url.searchParams.set("hourly", "temperature_2m,weather_code");
  url.searchParams.set(
    "daily",
    "temperature_2m_min,temperature_2m_max,weather_code,sunrise,sunset,uv_index_max,precipitation_probability_max",
  );
  url.searchParams.set("forecast_days", MAX_FORECAST_DAYS.toString());
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("temperature_unit", "celsius");

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) {
    throw new Error(`Forecast failed: HTTP ${res.status}`);
  }
  const data = (await res.json()) as ForecastResponse;

  const current = data.current ?? {};
  const hourly = data.hourly ?? {};
  const daily = data.daily ?? {};

  const hourlyTimes = hourly.time ?? [];
  const hourlyTemps = hourly.temperature_2m ?? [];
  const hourlyCodes = hourly.weather_code ?? [];

  // Drop hours whose timestamps have already passed. Open-Meteo returns the
  // full day starting at 00:00 in the target timezone, so without this trim
  // the strip would start in the past.
  const nowMs = Date.now();
  let startIdx = 0;
  for (let i = 0; i < hourlyTimes.length; i++) {
    if (new Date(hourlyTimes[i]).getTime() >= nowMs) {
      startIdx = i;
      break;
    }
  }
  const hourlyOut = [];
  for (let i = startIdx; i < hourlyTimes.length; i++) {
    hourlyOut.push({
      time: hourlyTimes[i],
      tempC: hourlyTemps[i] ?? 0,
      conditionCode: hourlyCodes[i] ?? 0,
    });
  }

  const dailyTimes = daily.time ?? [];
  const dailyMins = daily.temperature_2m_min ?? [];
  const dailyMaxes = daily.temperature_2m_max ?? [];
  const dailyCodes = daily.weather_code ?? [];
  const dailySunrises = daily.sunrise ?? [];
  const dailySunsets = daily.sunset ?? [];
  const dailyUv = daily.uv_index_max ?? [];
  const dailyPrecip = daily.precipitation_probability_max ?? [];
  const dailyOut = dailyTimes.map((date, i) => ({
    date,
    minC: dailyMins[i] ?? 0,
    maxC: dailyMaxes[i] ?? 0,
    conditionCode: dailyCodes[i] ?? 0,
    sunriseIso: dailySunrises[i] ?? null,
    sunsetIso: dailySunsets[i] ?? null,
    uvIndexMax: dailyUv[i] ?? null,
    precipProbabilityMax: dailyPrecip[i] ?? null,
  }));

  return {
    schemaVersion: WEATHER_CACHE_SCHEMA,
    fetchedAt: Date.now(),
    source: "open-meteo",
    current: {
      tempC: current.temperature_2m ?? 0,
      feelsLikeC: current.apparent_temperature ?? 0,
      conditionCode: current.weather_code ?? 0,
      humidity: current.relative_humidity_2m ?? 0,
      windKph: current.wind_speed_10m ?? 0,
    },
    hourly: hourlyOut,
    daily: dailyOut,
  };
}
