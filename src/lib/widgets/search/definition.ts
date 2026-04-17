import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import Search from "./Search.svelte";
import GeneralTab from "./GeneralTab.svelte";
import WidgetAppearanceTab from "$lib/ui/settings/WidgetAppearanceTab.svelte";

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
