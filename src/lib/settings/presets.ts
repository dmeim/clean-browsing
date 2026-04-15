import { DEFAULT_WIDGET_DEFAULTS, type WidgetDefaults, type WidgetStylePreset } from "./types.js";

type PresetPatch = Omit<Partial<WidgetDefaults>, "background" | "border" | "glow" | "shadow"> & {
  background?: Partial<WidgetDefaults["background"]>;
  border?: Partial<WidgetDefaults["border"]>;
  glow?: Partial<WidgetDefaults["glow"]>;
  shadow?: Partial<WidgetDefaults["shadow"]>;
};

function preset(id: string, name: string, patch: PresetPatch): WidgetStylePreset {
  const base = structuredClone(DEFAULT_WIDGET_DEFAULTS);
  const { background, border, glow, shadow, ...rest } = patch;
  const style: WidgetDefaults = {
    ...base,
    ...rest,
    background: { ...base.background, ...(background ?? {}) } as WidgetDefaults["background"],
    border: { ...base.border, ...(border ?? {}) },
    glow: { ...base.glow, ...(glow ?? {}) },
    shadow: { ...base.shadow, ...(shadow ?? {}) },
  };
  return { id, name, builtin: true, style };
}

export const BUILTIN_PRESETS: WidgetStylePreset[] = [
  preset("builtin:glass", "Glass", {
    background: { type: "solid", solid: "#0f172a" },
    backgroundOpacity: 60,
    border: { color: "#334155", width: 1, radius: 12 },
    backdropBlur: 12,
  }),
  preset("builtin:solid", "Solid", {
    background: { type: "solid", solid: "#1e293b" },
    backgroundOpacity: 100,
    border: { color: "#475569", width: 1, radius: 10 },
    backdropBlur: 0,
    shadow: { color: "#000000", intensity: 30, offsetX: 0, offsetY: 4 },
  }),
  preset("builtin:outlined", "Outlined", {
    textColor: "#f1f5f9",
    accentColor: "#ffffff",
    background: { type: "solid", solid: "#000000" },
    backgroundOpacity: 0,
    border: { color: "#94a3b8", style: "solid", width: 2, radius: 8 },
    backdropBlur: 0,
  }),
  preset("builtin:neon", "Neon", {
    textColor: "#e0f2fe",
    accentColor: "#67e8f9",
    background: { type: "solid", solid: "#020617" },
    backgroundOpacity: 85,
    border: { color: "#22d3ee", style: "solid", width: 1, radius: 14 },
    glow: { color: "#22d3ee", intensity: 60 },
    shadow: { color: "#000000", intensity: 20, offsetX: 0, offsetY: 2 },
    backdropBlur: 4,
  }),
];
