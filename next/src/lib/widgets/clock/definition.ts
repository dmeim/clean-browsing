import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import Clock from "./Clock.svelte";
import ClockSettingsForm from "./ClockSettings.svelte";

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
  settingsComponent: ClockSettingsForm,
  defaultSize: { w: 4, h: 2 },
  minSize: { w: 3, h: 2 },
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
