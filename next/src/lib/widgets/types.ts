import type { Component } from "svelte";

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
};

export type GridLayout = {
  cols: number;
  rows: number;
  instances: WidgetInstance[];
};
