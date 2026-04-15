import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import DateWidget from "./Date.svelte";
import DateSettingsForm from "./DateSettings.svelte";

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
  settingsComponent: DateSettingsForm,
  defaultSize: { w: 4, h: 2 },
  defaultSettings: {
    format: "YYYY-MM-DD",
    paddingV: 0,
    paddingH: 0,
  },
};

registerWidget(dateDefinition);
