import type { ImageFit } from "./types.js";

export function imageLayerCss(
  url: string,
  fit: ImageFit,
  positionX: number,
  positionY: number
): string {
  const size =
    fit === "cover"
      ? "cover"
      : fit === "contain"
        ? "contain"
        : fit === "fill"
          ? "100% 100%"
          : "auto"; // "none"
  return `${positionX}% ${positionY}% / ${size} no-repeat url("${url}")`;
}
