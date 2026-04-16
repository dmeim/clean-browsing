import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import Notes from "./Notes.svelte";
import NotesSettingsForm from "./NotesSettings.svelte";

export type NotesFontFamily = "sans" | "serif" | "mono";

export type NotesSettings = {
  content: string; // markdown source
  fontFamily: NotesFontFamily;
  fontSize: number; // base px
  maxCharacters: number; // 0 = unlimited
  showCounter: boolean;
  paddingV: number; // px
  paddingH: number; // px
};

export const notesDefinition: WidgetDefinition<NotesSettings> = {
  id: "notes",
  name: "Notes",
  description: "A markdown sticky-note with interactive task lists",
  component: Notes,
  settingsComponent: NotesSettingsForm,
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 3, h: 2 },
  defaultSettings: {
    content: "",
    fontFamily: "sans",
    fontSize: 14,
    maxCharacters: 0,
    showCounter: false,
    paddingV: 12,
    paddingH: 16,
  },
};

registerWidget(notesDefinition);
