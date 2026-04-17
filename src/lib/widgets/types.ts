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

/**
 * Props passed to every tab component in a tabbed widget settings modal.
 * Widgets that opt into tabs mode receive the usual settings pair plus the
 * appearance-edit state owned by WidgetSettingsDialog so an Appearance tab
 * can render inline without duplicating the commit/cancel machinery.
 */
export type WidgetSettingsTabProps<TSettings = unknown> = {
  settings: TSettings;
  updateSettings: (next: TSettings) => void;
  workingStyle: WidgetDefaults | null;
  setWorkingStyle: (next: WidgetDefaults) => void;
  hasOverrides: boolean;
  resetOverrides: () => void;
};

export type WidgetSettingsTab<TSettings = unknown> = {
  id: string;
  label: string;
  /** Optional Lucide-style SVG path `d` value; rendered in the tab button. */
  icon?: string;
  component: Component<WidgetSettingsTabProps<TSettings>>;
};

export type WidgetDefinition<TSettings = unknown> = {
  id: string;
  name: string;
  description?: string;
  component: Component<WidgetProps<TSettings>>;
  /** Legacy flat settings form. Rendered when `settingsTabs` is not set. */
  settingsComponent?: Component<WidgetSettingsProps<TSettings>>;
  /** When present, the widget settings dialog renders a tabbed layout. */
  settingsTabs?: WidgetSettingsTab<TSettings>[];
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
