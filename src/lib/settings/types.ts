export type Theme = "light" | "dark";

export type BackgroundType = "gradient" | "solid" | "image" | "url";

export type GradientStop = { color: string };

export type ImageFit = "cover" | "contain" | "fill" | "none";

export type BackgroundSettings = {
  type: BackgroundType;
  solid: string;
  gradient: {
    angle: number;
    stops: string[];
  };
  image: {
    imageId: string | null;
    dataUrl: string | null; // legacy fallback
    opacity: number;
    fit: ImageFit;
    positionX: number; // 0-100 %
    positionY: number; // 0-100 %
  };
  url: {
    href: string;
    opacity: number;
    fit: ImageFit;
    positionX: number;
    positionY: number;
  };
};

export type BorderStyle = "solid" | "dashed" | "dotted" | "none";

export type WidgetBorder = {
  color: string;
  style: BorderStyle;
  width: number; // px
  radius: number; // px
};

export type WidgetGlow = {
  color: string;
  intensity: number; // 0-100
};

export type WidgetShadow = {
  color: string;
  intensity: number; // 0-100
  offsetX: number; // px
  offsetY: number; // px
};

export type WidgetDefaults = {
  textColor: string;
  accentColor: string;
  background: BackgroundSettings;
  backgroundOpacity: number; // 0-100, applies to solid/gradient variants (image/url use their own type-specific opacity)
  border: WidgetBorder;
  glow: WidgetGlow;
  shadow: WidgetShadow;
  backdropBlur: number; // px
  opacity: number; // 0-100, outer card
};

export type WidgetStylePreset = {
  id: string;
  name: string;
  builtin?: boolean;
  style: WidgetDefaults;
};

export type GlobalSettings = {
  theme: Theme;
  background: BackgroundSettings;
  widgetDefaults: WidgetDefaults;
  widgetPresets: WidgetStylePreset[];
  schemaVersion: number;
};

export const CURRENT_SCHEMA_VERSION = 3;

export const DEFAULT_WIDGET_BACKGROUND: BackgroundSettings = {
  type: "solid",
  solid: "#0f172a",
  gradient: {
    angle: 135,
    stops: ["#0f172a", "#1e293b"],
  },
  image: {
    imageId: null,
    dataUrl: null,
    opacity: 60,
    fit: "cover",
    positionX: 50,
    positionY: 50,
  },
  url: {
    href: "",
    opacity: 60,
    fit: "cover",
    positionX: 50,
    positionY: 50,
  },
};

export const DEFAULT_WIDGET_DEFAULTS: WidgetDefaults = {
  textColor: "#f1f5f9",
  accentColor: "#e2e8f0",
  background: {
    ...DEFAULT_WIDGET_BACKGROUND,
    image: { ...DEFAULT_WIDGET_BACKGROUND.image, opacity: 60 },
    url: { ...DEFAULT_WIDGET_BACKGROUND.url, opacity: 60 },
  },
  backgroundOpacity: 60,
  border: {
    color: "#334155",
    style: "solid",
    width: 1,
    radius: 12,
  },
  glow: {
    color: "#6366f1",
    intensity: 0,
  },
  shadow: {
    color: "#000000",
    intensity: 0,
    offsetX: 0,
    offsetY: 0,
  },
  backdropBlur: 12,
  opacity: 100,
};

export const DEFAULT_SETTINGS: GlobalSettings = {
  theme: "dark",
  background: {
    type: "gradient",
    solid: "#0f172a",
    gradient: {
      angle: 135,
      stops: ["#020617", "#0f172a", "#1e293b"],
    },
    image: {
      imageId: null,
      dataUrl: null,
      opacity: 100,
      fit: "cover",
      positionX: 50,
      positionY: 50,
    },
    url: {
      href: "",
      opacity: 100,
      fit: "cover",
      positionX: 50,
      positionY: 50,
    },
  },
  widgetDefaults: structuredClone(DEFAULT_WIDGET_DEFAULTS),
  widgetPresets: [],
  schemaVersion: CURRENT_SCHEMA_VERSION,
};
