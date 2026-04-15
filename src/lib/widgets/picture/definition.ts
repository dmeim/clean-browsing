import type { ImageFit } from "$lib/settings/types.js";
import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import Picture from "./Picture.svelte";
import PictureSettingsForm from "./PictureSettings.svelte";

export type PictureFit = ImageFit;

export type PictureSettings = {
  imageId: string; // "" when no image from library
  imageDataUrl: string; // legacy fallback for images not yet in library
  fit: PictureFit;
  opacity: number; // 10–100
  padding: number; // 0–30 px
  positionX: number; // 0–100 %
  positionY: number; // 0–100 %
};

export const pictureDefinition: WidgetDefinition<PictureSettings> = {
  id: "picture",
  name: "Picture",
  description: "Displays a custom image",
  component: Picture,
  settingsComponent: PictureSettingsForm,
  defaultSize: { w: 4, h: 4 },
  defaultSettings: {
    imageId: "",
    imageDataUrl: "",
    fit: "cover",
    opacity: 100,
    padding: 0,
    positionX: 50,
    positionY: 50,
  },
};

registerWidget(pictureDefinition);
