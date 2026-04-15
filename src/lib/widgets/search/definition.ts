import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import Search from "./Search.svelte";
import SearchSettingsForm from "./SearchSettings.svelte";

export type SearchEngine = "google" | "bing" | "duckduckgo" | "yahoo" | "custom";

export type SearchTarget = "newTab" | "currentTab" | "newWindow" | "incognito";

export type SearchSettings = {
  engine: SearchEngine;
  customUrl: string;
  customImageUrl: string;
  target: SearchTarget;
  clearAfterSearch: boolean;
  paddingV: number;
  paddingH: number;
};

export const ENGINE_URLS: Record<Exclude<SearchEngine, "custom">, string> = {
  google: "https://www.google.com/search?q=%s",
  bing: "https://www.bing.com/search?q=%s",
  duckduckgo: "https://duckduckgo.com/?q=%s",
  yahoo: "https://search.yahoo.com/search?p=%s",
};

export const ENGINE_NAMES: Record<SearchEngine, string> = {
  google: "Google",
  bing: "Bing",
  duckduckgo: "DuckDuckGo",
  yahoo: "Yahoo",
  custom: "Custom",
};

export const ENGINE_LOGOS: Record<Exclude<SearchEngine, "custom">, string> = {
  google: "resources/google.png",
  bing: "resources/bing.png",
  duckduckgo: "resources/ddg.png",
  yahoo: "resources/yahoo-search.png",
};

export function getEngineUrl(engine: SearchEngine): string {
  if (engine === "custom") return "";
  return ENGINE_URLS[engine];
}

export function getEngineLogo(settings: SearchSettings): string {
  if (settings.customImageUrl) return settings.customImageUrl;
  if (settings.engine === "custom") return "";
  return ENGINE_LOGOS[settings.engine];
}

export const searchDefinition: WidgetDefinition<SearchSettings> = {
  id: "search",
  name: "Search",
  description: "Search bar with configurable engine",
  component: Search,
  settingsComponent: SearchSettingsForm,
  defaultSize: { w: 8, h: 2 },
  defaultSettings: {
    engine: "google",
    customUrl: ENGINE_URLS.google,
    customImageUrl: "",
    target: "newTab",
    clearAfterSearch: false,
    paddingV: 8,
    paddingH: 12,
  },
};

registerWidget(searchDefinition);
