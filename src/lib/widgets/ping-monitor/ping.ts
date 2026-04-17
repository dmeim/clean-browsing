import type { PingMethod, PingSample, PingStatus } from "./definition.js";

type BrowserLike = {
  notifications?: {
    create: (options: {
      type: "basic";
      title: string;
      message: string;
      iconUrl?: string;
    }) => Promise<string>;
  };
};

declare const browser: BrowserLike | undefined;

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isValidPingInput(input: string): boolean {
  if (!input || !input.trim()) return false;
  try {
    const url = new URL(normalizeUrl(input));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function checkUrl(
  url: string,
  timeoutMs: number,
  slowThresholdMs: number,
  method: PingMethod = "GET",
): Promise<PingSample> {
  const started = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(url, { mode: "no-cors", method, signal: controller.signal });
    const durationMs = Math.round(performance.now() - started);
    const status: PingStatus = durationMs > slowThresholdMs ? "slow" : "reachable";
    return { at: Date.now(), status, durationMs };
  } catch {
    return { at: Date.now(), status: "unreachable", durationMs: null };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function statusTransitioned(prev: PingStatus, curr: PingStatus): boolean {
  const wasUp = prev === "reachable" || prev === "slow";
  const isUp = curr === "reachable" || curr === "slow";
  return wasUp !== isUp;
}

function canNotify(): boolean {
  return typeof browser !== "undefined" && !!browser?.notifications?.create;
}

export function fireTransitionNotification(
  label: string,
  url: string,
  prev: PingStatus,
  curr: PingStatus,
): void {
  if (!canNotify()) return;
  const isDown = curr === "unreachable";
  const title = isDown ? `${label || url} — Unreachable` : `${label || url} — Recovered`;
  const message = `Status changed from ${prev} to ${curr}`;
  browser!
    .notifications!.create({
      type: "basic",
      title,
      message,
      iconUrl: "branding/logo-png-transparent/logo-color-transparent.png",
    })
    .catch(() => {});
}

export function uptimePercent(history: PingSample[], windowMs: number): number | null {
  const cutoff = Date.now() - windowMs;
  const relevant = history.filter((s) => s.at >= cutoff);
  if (relevant.length === 0) return null;
  const up = relevant.filter((s) => s.status === "reachable" || s.status === "slow").length;
  return (up / relevant.length) * 100;
}
