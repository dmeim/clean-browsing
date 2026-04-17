import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import Clock from "./Clock.svelte";
import GeneralTab from "./GeneralTab.svelte";
import WidgetAppearanceTab from "$lib/ui/settings/WidgetAppearanceTab.svelte";

export type ClockSettings = {
  format24h: boolean;
  showSeconds: boolean;
  showAmPm: boolean;
  flashing: boolean;
  daylightSavings: boolean;
  locale: string; // "auto" → use navigator.language
  paddingV: number; // px, top + bottom inset of the text area
  paddingH: number; // px, left + right inset of the text area
};

export const clockDefinition: WidgetDefinition<ClockSettings> = {
  id: "clock",
  name: "Clock",
  description: "Displays the current time",
  component: Clock,
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
  defaultSize: { w: 4, h: 2 },
  defaultSettings: {
    format24h: false,
    showSeconds: true,
    showAmPm: true,
    flashing: false,
    daylightSavings: true,
    locale: "auto",
    paddingV: 0,
    paddingH: 0,
  },
};

registerWidget(clockDefinition);
