import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import PingMonitor from "./PingMonitor.svelte";
import PingMonitorSettingsForm from "./PingMonitorSettings.svelte";

export type PingStatus = "reachable" | "slow" | "unreachable" | "unknown";
export type PingIntervalSec = 30 | 60 | 300 | 900 | 1800 | 3600;
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
  history: PingSample[];
};

export type PingMonitorSettings = {
  targets: PingTarget[];
  intervalSec: PingIntervalSec;
  timeoutMs: number;
  slowThresholdMs: number;
  notificationsOnTransition: boolean;
  paddingV: number;
  paddingH: number;
};

export const MAX_HISTORY = 200;

export const pingMonitorDefinition: WidgetDefinition<PingMonitorSettings> = {
  id: "ping-monitor",
  name: "Ping Monitor",
  description: "HTTP health checks with response times and uptime stats",
  component: PingMonitor,
  settingsComponent: PingMonitorSettingsForm,
  defaultSize: { w: 6, h: 3 },
  defaultSettings: {
    targets: [],
    intervalSec: 300,
    timeoutMs: 5000,
    slowThresholdMs: 1500,
    notificationsOnTransition: false,
    paddingV: 8,
    paddingH: 8,
  },
};

registerWidget(pingMonitorDefinition);
