import type { ImageFit } from "$lib/settings/types.js";
import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import Picture from "./Picture.svelte";
import GeneralTab from "./GeneralTab.svelte";
import WidgetAppearanceTab from "$lib/ui/settings/WidgetAppearanceTab.svelte";

export type PictureFit = ImageFit;

export type PictureSettings = {
  imageId: string; // "" when no image from library
  imageDataUrl: string; // legacy fallback for images not yet in library
  fit: PictureFit;
  opacity: number; // 10–100
  padding: number; // 0–30 px (inner image padding — distinct from widget padding)
  positionX: number; // 0–100 %
  positionY: number; // 0–100 %
};

export const pictureDefinition: WidgetDefinition<PictureSettings> = {
  id: "picture",
  name: "Picture",
  description: "Displays a custom image",
  component: Picture,
  settingsTabs: [
    {
      id: "appearance",
      label: "Appearance",
      icon: "M12 3a9 9 0 1 0 9 9c0-1.66-3-2-3-4s2.34-1 2-3c-.37-2.2-4-5-8-5z M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M12 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M16 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
      component: WidgetAppearanceTab,
    },
    {
      id: "general",
      label: "General",
      icon: "M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36-1.41 1.41M7.05 16.95l-1.41 1.41m12.72 0-1.41-1.41M7.05 7.05 5.64 5.64M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
      component: GeneralTab,
    },
  ],
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
