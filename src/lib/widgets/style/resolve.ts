import type {
  BackgroundSettings,
  WidgetDefaults,
} from "$lib/settings/types.js";
import { imageLayerCss } from "$lib/settings/backgroundCss.js";
import type { WidgetStyleOverrides } from "$lib/widgets/types.js";

type ImageResolver = (id: string | null | undefined) => string | null;

export function deepMerge<T>(base: T, patch: unknown): T {
  if (patch == null) return base;
  if (typeof base !== "object" || base === null || Array.isArray(base)) {
    return patch as T;
  }
  if (typeof patch !== "object" || patch === null || Array.isArray(patch)) {
    return patch as T;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(patch as Record<string, unknown>)) {
    const pv = (patch as Record<string, unknown>)[key];
    if (pv === undefined) continue;
    const bv = (base as Record<string, unknown>)[key];
    out[key] = deepMerge(bv, pv);
  }
  return out as T;
}

export function resolveWidgetStyle(
  defaults: WidgetDefaults,
  overrides?: WidgetStyleOverrides
): WidgetDefaults {
  if (!overrides) return defaults;
  return deepMerge(defaults, overrides);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let s = m[1];
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  const num = parseInt(s, 16);
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

function rgba(hex: string, alpha01: number): string {
  const rgb = hexToRgb(hex);
  const a = clamp(alpha01, 0, 1);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

export function widgetBackgroundCss(
  style: WidgetDefaults,
  resolveImage: ImageResolver = () => null
): string {
  const bg = style.background;
  const alpha = clamp(style.backgroundOpacity, 0, 100) / 100;
  switch (bg.type) {
    case "solid":
      return rgba(bg.solid, alpha);
    case "gradient": {
      const stops = bg.gradient.stops
        .filter(Boolean)
        .map((s) => rgba(s, alpha))
        .join(", ");
      return `linear-gradient(${bg.gradient.angle}deg, ${stops})`;
    }
    case "image": {
      const resolved = resolveImage(bg.image.imageId) ?? bg.image.dataUrl;
      if (!resolved) return rgba(bg.solid, alpha);
      const imgAlpha = clamp(bg.image.opacity, 0, 100) / 100;
      // Layer a translucent veil over the image so lower opacity reveals the
      // widget's solid color (and whatever is behind it) without needing a
      // pseudo-element.
      const veil = rgba(bg.solid, 1 - imgAlpha);
      const layer = imageLayerCss(resolved, bg.image.fit, bg.image.positionX, bg.image.positionY);
      return `linear-gradient(${veil}, ${veil}), ${layer}`;
    }
    case "url": {
      if (!bg.url.href) return rgba(bg.solid, alpha);
      const urlAlpha = clamp(bg.url.opacity, 0, 100) / 100;
      const veil = rgba(bg.solid, 1 - urlAlpha);
      const layer = imageLayerCss(bg.url.href, bg.url.fit, bg.url.positionX, bg.url.positionY);
      return `linear-gradient(${veil}, ${veil}), ${layer}`;
    }
  }
}

function shadowCss(style: WidgetDefaults): string {
  const shadowPart = (() => {
    const i = clamp(style.shadow.intensity, 0, 100) / 100;
    if (i === 0) return null;
    const blur = 2 + i * 30; // px
    const spread = 0;
    const alpha = 0.15 + i * 0.45;
    const rgb = hexToRgb(style.shadow.color);
    const color = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : style.shadow.color;
    return `${style.shadow.offsetX}px ${style.shadow.offsetY}px ${blur}px ${spread}px ${color}`;
  })();

  const glowPart = (() => {
    const i = clamp(style.glow.intensity, 0, 100) / 100;
    if (i === 0) return null;
    const spread = i * 18; // px
    const blur = 4 + i * 20;
    const alpha = 0.2 + i * 0.55;
    const rgb = hexToRgb(style.glow.color);
    const color = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : style.glow.color;
    return `0 0 ${blur}px ${spread}px ${color}`;
  })();

  const parts = [shadowPart, glowPart].filter(Boolean);
  return parts.length === 0 ? "none" : parts.join(", ");
}

export function styleToCssVars(
  style: WidgetDefaults,
  resolveImage: ImageResolver = () => null
): Record<string, string> {
  return {
    "--widget-text": style.textColor,
    "--widget-accent": style.accentColor,
    "--widget-bg": widgetBackgroundCss(style, resolveImage),
    "--widget-border-color": style.border.color,
    "--widget-border-style": style.border.style,
    "--widget-border-width": `${Math.max(0, style.border.width)}px`,
    "--widget-border-radius": `${Math.max(0, style.border.radius)}px`,
    "--widget-backdrop-blur": `${Math.max(0, style.backdropBlur)}px`,
    "--widget-box-shadow": shadowCss(style),
    "--widget-opacity": `${clamp(style.opacity, 0, 100) / 100}`,
  };
}

export function cssVarsToInlineStyle(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join(" ");
}

// Re-export for callers that prefer a single entry point.
export function widgetStyleToInlineStyle(
  style: WidgetDefaults,
  resolveImage?: ImageResolver
): string {
  return cssVarsToInlineStyle(styleToCssVars(style, resolveImage));
}

/**
 * Diff `candidate` against `base`, returning the minimal object that
 * captures every leaf where the two differ. Used to compute a
 * WidgetStyleOverrides patch from a fully-resolved edit buffer.
 */
export function diffAgainst<T>(base: T, candidate: T): unknown {
  if (base === candidate) return undefined;
  if (
    typeof base !== "object" ||
    base === null ||
    typeof candidate !== "object" ||
    candidate === null ||
    Array.isArray(base) ||
    Array.isArray(candidate)
  ) {
    // Primitives / arrays: shallow-compare via JSON for arrays, direct for primitives.
    if (JSON.stringify(base) === JSON.stringify(candidate)) return undefined;
    return candidate;
  }
  const out: Record<string, unknown> = {};
  const bObj = base as Record<string, unknown>;
  const cObj = candidate as Record<string, unknown>;
  const keys = new Set([...Object.keys(bObj), ...Object.keys(cObj)]);
  for (const key of keys) {
    const sub = diffAgainst(bObj[key], cObj[key]);
    if (sub !== undefined) out[key] = sub;
  }
  return Object.keys(out).length === 0 ? undefined : out;
}

export function isBackgroundTranslucent(style: WidgetDefaults): boolean {
  const bg = style.background;
  if (bg.type === "solid" || bg.type === "gradient") {
    return style.backgroundOpacity < 100;
  }
  if (bg.type === "image") return bg.image.opacity < 100;
  if (bg.type === "url") return bg.url.opacity < 100;
  return false;
}

export type { ImageResolver };
export { hexToRgb };
