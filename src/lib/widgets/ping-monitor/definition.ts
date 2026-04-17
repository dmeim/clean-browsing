import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import PingMonitor from "./PingMonitor.svelte";
import AppearanceTab from "./tabs/AppearanceTab.svelte";
import GeneralTab from "./tabs/GeneralTab.svelte";
import TargetsTab from "./tabs/TargetsTab.svelte";

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
  targets: PingTarget[];
  notificationsOnTransition: boolean;
  paddingV: number;
  paddingH: number;
};

export const MAX_HISTORY = 200;

export const DEFAULT_TARGET_INTERVAL_MS = 300_000; // 5 minutes
export const DEFAULT_TARGET_TIMEOUT_MS = 5_000;
export const DEFAULT_TARGET_SLOW_MS = 1_500;

// Clamp bounds for per-target duration inputs. Prevents accidental spam
// if a user types "5ms" into the interval field.
export const MIN_INTERVAL_MS = 1_000;
export const MIN_TIMEOUT_MS = 500;
export const MIN_SLOW_MS = 50;

/**
 * Normalize a target from any schema version (current or pre-v2 with
 * shared top-level interval/timeout/slow fields) into the current shape.
 * The `legacy` object is the raw settings blob — we look for the old
 * top-level fields there as a fallback.
 */
export function normalizeTarget(t: unknown, legacy: Record<string, unknown>): PingTarget {
  const raw = (t ?? {}) as Partial<PingTarget> & Record<string, unknown>;
  const legacyIntervalSec = typeof legacy.intervalSec === "number" ? legacy.intervalSec : undefined;
  const legacyTimeout = typeof legacy.timeoutMs === "number" ? legacy.timeoutMs : undefined;
  const legacySlow =
    typeof legacy.slowThresholdMs === "number" ? legacy.slowThresholdMs : undefined;

  return {
    id: typeof raw.id === "string" ? raw.id : crypto.randomUUID(),
    label: typeof raw.label === "string" ? raw.label : "",
    url: typeof raw.url === "string" ? raw.url : "",
    method: (raw.method as PingMethod) ?? "GET",
    intervalMs:
      typeof raw.intervalMs === "number"
        ? raw.intervalMs
        : legacyIntervalSec != null
          ? legacyIntervalSec * 1000
          : DEFAULT_TARGET_INTERVAL_MS,
    timeoutMs:
      typeof raw.timeoutMs === "number"
        ? raw.timeoutMs
        : (legacyTimeout ?? DEFAULT_TARGET_TIMEOUT_MS),
    slowThresholdMs:
      typeof raw.slowThresholdMs === "number"
        ? raw.slowThresholdMs
        : (legacySlow ?? DEFAULT_TARGET_SLOW_MS),
    history: Array.isArray(raw.history) ? (raw.history as PingSample[]) : [],
  };
}

export const pingMonitorDefinition: WidgetDefinition<PingMonitorSettings> = {
  id: "ping-monitor",
  name: "Ping Monitor",
  description: "HTTP health checks with response times and uptime stats",
  component: PingMonitor,
  settingsTabs: [
    {
      id: "appearance",
      label: "Appearance",
      icon: "M12 3a9 9 0 1 0 9 9c0-1.66-3-2-3-4s2.34-1 2-3c-.37-2.2-4-5-8-5z M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M12 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M16 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
      component: AppearanceTab,
    },
    {
      id: "general",
      label: "General",
      icon: "M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36-1.41 1.41M7.05 16.95l-1.41 1.41m12.72 0-1.41-1.41M7.05 7.05 5.64 5.64M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
      component: GeneralTab,
    },
    {
      id: "targets",
      label: "Targets",
      icon: "M12 2a10 10 0 1 0 10 10 M12 6a6 6 0 1 0 6 6 M12 10a2 2 0 1 0 2 2 M22 12h-4 M6 12H2 M12 2v4 M12 18v4",
      component: TargetsTab,
    },
  ],
  defaultSize: { w: 6, h: 3 },
  defaultSettings: {
    targets: [],
    notificationsOnTransition: false,
    paddingV: 8,
    paddingH: 8,
  },
};

registerWidget(pingMonitorDefinition);
