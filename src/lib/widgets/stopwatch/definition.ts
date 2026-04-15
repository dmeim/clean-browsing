import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import Stopwatch from "./Stopwatch.svelte";
import StopwatchSettingsForm from "./StopwatchSettings.svelte";

export type StopwatchRunState = "idle" | "running" | "paused";

export type StopwatchLap = {
  index: number; // 1-based lap number
  splitMs: number; // time since previous lap (or start for lap 1)
  totalMs: number; // total elapsed at the moment the lap was recorded
  recordedAt: number; // Date.now() epoch ms
};

export type StopwatchPrecision = "ms" | "cs" | "s";

export type StopwatchSettings = {
  // Persisted runtime state — lets a running or paused stopwatch survive
  // a page reload. Only the Reset control clears these.
  runState: StopwatchRunState;
  startedAtEpoch: number; // Date.now() at last Start/Resume; 0 when not running
  elapsedBeforeResume: number; // accumulated ms from prior run segments

  // Display / behavior
  precision: StopwatchPrecision;
  maxLapsShown: number; // 0 = unlimited
  showSplits: boolean;
  soundFeedback: boolean;
  laps: StopwatchLap[];
  paddingV: number;
  paddingH: number;
};

// Hard cap on the persisted lap history so the settings blob stays small.
export const MAX_LAPS = 200;

export const stopwatchDefinition: WidgetDefinition<StopwatchSettings> = {
  id: "stopwatch",
  name: "Stopwatch",
  description: "Precision stopwatch with lap timing",
  component: Stopwatch,
  settingsComponent: StopwatchSettingsForm,
  defaultSize: { w: 4, h: 5 },
  defaultSettings: {
    runState: "idle",
    startedAtEpoch: 0,
    elapsedBeforeResume: 0,
    precision: "cs",
    maxLapsShown: 10,
    showSplits: true,
    soundFeedback: false,
    laps: [],
    paddingV: 8,
    paddingH: 8,
  },
};

registerWidget(stopwatchDefinition);
