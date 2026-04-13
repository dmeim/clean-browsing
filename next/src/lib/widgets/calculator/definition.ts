import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import Calculator from "./Calculator.svelte";
import CalculatorSettingsForm from "./CalculatorSettings.svelte";

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
};

export const MAX_HISTORY = 50;

export const calculatorDefinition: WidgetDefinition<CalculatorSettings> = {
  id: "calculator",
  name: "Calculator",
  description: "A simple calculator with history",
  component: Calculator,
  settingsComponent: CalculatorSettingsForm,
  defaultSize: { w: 4, h: 6 },
  minSize: { w: 3, h: 5 },
  defaultSettings: {
    keyboardSupport: true,
    roundButtons: true,
    colorOperators: true,
    colorEquals: true,
    colorClear: true,
    historyEnabled: true,
    history: [],
  },
};

registerWidget(calculatorDefinition);
