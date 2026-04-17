import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import PingMonitor from "./PingMonitor.svelte";
import WidgetAppearanceTab from "$lib/ui/settings/WidgetAppearanceTab.svelte";
import GeneralTab from "./tabs/GeneralTab.svelte";
import TargetTab from "./tabs/TargetTab.svelte";

export type PingStatus = "reachable" | "slow" | "unreachable" | "unknown";
export type PingMethod = "GET" | "HEAD" | "POST";

export type PingSample = {
  at: number;
  status: PingStatus;
  durationMs: number | null;
};

export type PingTarget = {
  id: string;
  label: string;
  url: string;
  method: PingMethod;
  intervalMs: number;
  timeoutMs: number;
  slowThresholdMs: number;
  history: PingSample[];
};

export type PingMonitorSettings = {
  target: PingTarget;
  notificationsOnTransition: boolean;
  /**
   * Two rolling-uptime windows (in hours) shown in the widget body.
   * Stored in selection order — oldest first — so the swap logic in the
   * settings tab can drop the least-recently-picked option when the user
   * activates a new one. Render order in the widget is sorted ascending.
   */
  uptimeWindows: number[];
  paddingV: number;
  paddingH: number;
};

export const UPTIME_WINDOW_OPTIONS = [1, 4, 8, 12, 18, 24] as const;
export const UPTIME_WINDOW_COUNT = 2;
export const DEFAULT_UPTIME_WINDOWS: readonly number[] = [1, 24];

export const MAX_HISTORY = 200;

export const DEFAULT_TARGET_INTERVAL_MS = 300_000; // 5 minutes
export const DEFAULT_TARGET_TIMEOUT_MS = 5_000;
export const DEFAULT_TARGET_SLOW_MS = 1_500;

// Clamp bounds for target duration inputs. Prevents accidental spam if a
// user types "5ms" into the interval field.
export const MIN_INTERVAL_MS = 1_000;
export const MIN_TIMEOUT_MS = 500;
export const MIN_SLOW_MS = 50;

export function blankTarget(): PingTarget {
  return {
    id: crypto.randomUUID(),
    label: "",
    url: "",
    method: "GET",
    intervalMs: DEFAULT_TARGET_INTERVAL_MS,
    timeoutMs: DEFAULT_TARGET_TIMEOUT_MS,
    slowThresholdMs: DEFAULT_TARGET_SLOW_MS,
    history: [],
  };
}

/**
 * Coerce stored `uptimeWindows` into exactly two valid options. Falls back
 * to the default pair if the stored value is missing, malformed, or
 * contains anything outside `UPTIME_WINDOW_OPTIONS`.
 */
export function normalizeUptimeWindows(raw: unknown): number[] {
  const allowed = new Set<number>(UPTIME_WINDOW_OPTIONS);
  const arr = Array.isArray(raw)
    ? (raw.filter((n) => typeof n === "number" && allowed.has(n)) as number[])
    : [];
  const deduped = Array.from(new Set(arr));
  if (deduped.length === UPTIME_WINDOW_COUNT) return deduped;
  return [...DEFAULT_UPTIME_WINDOWS];
}

export function normalizeTarget(t: unknown): PingTarget {
  const raw = (t ?? {}) as Partial<PingTarget> & Record<string, unknown>;
  return {
    id: typeof raw.id === "string" ? raw.id : crypto.randomUUID(),
    label: typeof raw.label === "string" ? raw.label : "",
    url: typeof raw.url === "string" ? raw.url : "",
    method: (raw.method as PingMethod) ?? "GET",
    intervalMs: typeof raw.intervalMs === "number" ? raw.intervalMs : DEFAULT_TARGET_INTERVAL_MS,
    timeoutMs: typeof raw.timeoutMs === "number" ? raw.timeoutMs : DEFAULT_TARGET_TIMEOUT_MS,
    slowThresholdMs:
      typeof raw.slowThresholdMs === "number" ? raw.slowThresholdMs : DEFAULT_TARGET_SLOW_MS,
    history: Array.isArray(raw.history) ? (raw.history as PingSample[]) : [],
  };
}

export const pingMonitorDefinition: WidgetDefinition<PingMonitorSettings> = {
  id: "ping-monitor",
  name: "Ping Monitor",
  description: "HTTP health check for a single endpoint with response time and uptime stats",
  component: PingMonitor,
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
    {
      id: "target",
      label: "Target",
      icon: "M12 2a10 10 0 1 0 10 10 M12 6a6 6 0 1 0 6 6 M12 10a2 2 0 1 0 2 2 M22 12h-4 M6 12H2 M12 2v4 M12 18v4",
      component: TargetTab,
    },
  ],
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 2 },
  defaultSettings: {
    target: blankTarget(),
    notificationsOnTransition: false,
    uptimeWindows: [...DEFAULT_UPTIME_WINDOWS],
    paddingV: 8,
    paddingH: 8,
  },
};

registerWidget(pingMonitorDefinition);
