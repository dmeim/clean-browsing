import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import DateWidget from "./Date.svelte";
import GeneralTab from "./GeneralTab.svelte";
import WidgetAppearanceTab from "$lib/ui/settings/WidgetAppearanceTab.svelte";

export type DateSettings = {
  format: string;
  paddingV: number;
  paddingH: number;
};

export const dateDefinition: WidgetDefinition<DateSettings> = {
  id: "date",
  name: "Date",
  description: "Displays the current date in a custom format",
  component: DateWidget,
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
    format: "YYYY-MM-DD",
    paddingV: 0,
    paddingH: 0,
  },
};

registerWidget(dateDefinition);
