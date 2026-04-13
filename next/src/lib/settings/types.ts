export type Theme = "light" | "dark";

export type BackgroundType = "gradient" | "solid" | "image" | "url";

export type GradientStop = { color: string };

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
  };
  url: {
    href: string;
    opacity: number;
  };
};

export type WidgetDefaults = {
  borderRadius: number;
  shadow: number;
  glow: number;
  textColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  borderColor: string;
};

export type GlobalSettings = {
  theme: Theme;
  background: BackgroundSettings;
  widgetDefaults: WidgetDefaults;
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
    image: { imageId: null, dataUrl: null, opacity: 100 },
    url: { href: "", opacity: 100 },
  },
  widgetDefaults: {
    borderRadius: 12,
    shadow: 0,
    glow: 0,
    textColor: "#f1f5f9",
    backgroundColor: "#0f172a",
    backgroundOpacity: 60,
    borderColor: "#334155",
  },
};
