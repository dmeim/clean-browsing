import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import Calculator from "./Calculator.svelte";
import GeneralTab from "./GeneralTab.svelte";
import WidgetAppearanceTab from "$lib/ui/settings/WidgetAppearanceTab.svelte";

export type CalcHistoryEntry = {
  expression: string;
  result: string;
  timestamp: number;
};

export type CalculatorSettings = {
  keyboardSupport: boolean;
  roundButtons: boolean;
  colorOperators: boolean;
  colorEquals: boolean;
  colorClear: boolean;
  historyEnabled: boolean;
  history: CalcHistoryEntry[];
  paddingV: number;
  paddingH: number;
};

export const MAX_HISTORY = 50;

export const calculatorDefinition: WidgetDefinition<CalculatorSettings> = {
  id: "calculator",
  name: "Calculator",
  description: "A simple calculator with history",
  component: Calculator,
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
  defaultSize: { w: 4, h: 6 },
  defaultSettings: {
    keyboardSupport: true,
    roundButtons: true,
    colorOperators: true,
    colorEquals: true,
    colorClear: true,
    historyEnabled: true,
    history: [],
    paddingV: 8,
    paddingH: 8,
  },
};

registerWidget(calculatorDefinition);
