import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import Timer from "./Timer.svelte";
import GeneralTab from "./GeneralTab.svelte";
import WidgetAppearanceTab from "$lib/ui/settings/WidgetAppearanceTab.svelte";

export type TimerRunState = "idle" | "running" | "paused" | "expired";

export type TimerPreset = {
  label: string;
  durationMs: number;
};

export type TimerSettings = {
  // Runtime state — `startedAtEpoch` is the Date.now() at which the
  // current running segment began. Unlike the Stopwatch, the Timer resets
  // when the new-tab page is reloaded unless it was running at the moment
  // of reload (we check the alarm on mount and recover if possible).
  runState: TimerRunState;
  startedAtEpoch: number; // epoch ms at Start/Resume; 0 when not running
  totalDurationMs: number; // what the timer was started with (for progress %)
  pausedRemainingMs: number; // remaining ms at the moment of Pause
  scheduledAlarmName: string; // name of the currently active browser alarm, or ""

  // Configuration
  label: string; // shown in notifications
  defaultDurationMs: number;
  notifications: boolean;
  sound: "none" | "beep";
  progressStyle: "ring" | "bar";
  autoReset: boolean;
  presets: TimerPreset[];
  paddingV: number;
  paddingH: number;
};

export const DEFAULT_PRESETS: TimerPreset[] = [
  { label: "Quick break", durationMs: 5 * 60_000 },
  { label: "Tea", durationMs: 10 * 60_000 },
  { label: "Pomodoro", durationMs: 25 * 60_000 },
  { label: "Meeting", durationMs: 30 * 60_000 },
  { label: "Lunch", durationMs: 60 * 60_000 },
];

export const timerDefinition: WidgetDefinition<TimerSettings> = {
  id: "timer",
  name: "Timer",
  description: "Countdown timer with presets and notifications",
  component: Timer,
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
    runState: "idle",
    startedAtEpoch: 0,
    totalDurationMs: 0,
    pausedRemainingMs: 0,
    scheduledAlarmName: "",
    label: "Timer",
    defaultDurationMs: 5 * 60_000,
    notifications: true,
    sound: "beep",
    progressStyle: "ring",
    autoReset: false,
    presets: DEFAULT_PRESETS,
    paddingV: 8,
    paddingH: 8,
  },
};

registerWidget(timerDefinition);
