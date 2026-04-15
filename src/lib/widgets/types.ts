import type { Component } from "svelte";
import type { WidgetDefaults } from "$lib/settings/types.js";

export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export type WidgetStyleOverrides = DeepPartial<WidgetDefaults>;

export type GridSize = {
  w: number;
  h: number;
};

export type GridPosition = {
  x: number;
  y: number;
};

export type WidgetProps<TSettings = unknown> = {
  settings: TSettings;
  updateSettings: (next: TSettings) => void;
};

export type WidgetSettingsProps<TSettings = unknown> = {
  settings: TSettings;
  updateSettings: (next: TSettings) => void;
};

export type WidgetDefinition<TSettings = unknown> = {
  id: string;
  name: string;
  description?: string;
  component: Component<WidgetProps<TSettings>>;
  settingsComponent?: Component<WidgetSettingsProps<TSettings>>;
  defaultSize: GridSize;
  minSize?: GridSize;
  maxSize?: GridSize;
  defaultSettings: TSettings;
};

export type WidgetInstance = {
  instanceId: string;
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  settings: unknown;
  styleOverrides?: WidgetStyleOverrides;
};

export type GridLayout = {
  cols: number;
  rows: number;
  instances: WidgetInstance[];
};
