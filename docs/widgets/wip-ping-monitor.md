# Ping Monitor Widget (WIP)

> **Status:** ⭕ Planned
>
> **Stage:** Planning
>
> This is a design document for a widget that does **not** ship yet. Scope and settings are provisional.

## Overview

A service-availability monitor: ping a URL or LAN host on a schedule and show an at-a-glance status indicator (UP / WARNING / DOWN), with response times and basic uptime stats. Aimed at homelab users and small-ops dashboards — "is my Grafana still up?" sitting right next to the Grafana mini-site widget.

**This widget makes network calls by design.** That's allowed under Clean Browsing's network policy for widgets whose core function requires network (see [`docs/widgets/README.md`](./README.md)). The rules still apply: opt-in per widget instance (freshly-added widget makes zero network calls until the user enters a URL), disclosed in the settings dialog, and logged in the privacy policy.

## Hard constraints

1. **CORS.** Browsers enforce the same-origin policy for `fetch`. Most public websites don't send `Access-Control-Allow-Origin: *`, so a cross-origin `fetch("https://example.com")` from the extension's new-tab page will fail with an error even if the site is perfectly healthy. Two workarounds, each with trade-offs:
   - **Host permissions in the manifest.** Adding a site to `permissions` gives the extension full CORS-bypass access to that host. Accurate, but it means the user has to edit `manifest.json` (no way to add host permissions at runtime in MV2) or we declare a wildcard `"<all_urls>"`, which is a blunt instrument and will trip up Firefox's Add-ons review.
   - **`fetch(url, { mode: "no-cors" })`.** Returns an opaque response — no status code readable, no body, but it _does_ succeed or fail based on the network round trip. Good enough to distinguish "the server answered" from "it didn't," which is 80% of what users want from a ping monitor.

   **Lean preference: no-cors mode for v1.** Status categories collapse from `UP / WARNING / DOWN` based on HTTP code to `REACHABLE / UNREACHABLE / SLOW` based on whether the round trip succeeded and how long it took. Honest, correct, and works without per-site host permissions.

2. **LAN hosts.** `http://192.168.1.10` works fine in no-cors mode. Users on IPv6-only networks may need explicit IPv6 literals.
3. **"Real" ping (ICMP).** Browsers can't send ICMP packets. This widget is an HTTP health check, not a true ping. The widget name should probably reflect that — consider `HTTP Monitor` or `Uptime` — but `ping-monitor` is what the legacy docs called it, so v1 keeps the name and is explicit about the HTTP-only mechanism in its description.

## Core features (v1)

- Configure one target URL per widget, with optional custom port via the URL itself.
- Check interval: 30 s / 1 / 5 / 15 / 30 / 60 min.
- Status derived from `fetch(..., { mode: "no-cors" })` round-trip success + duration.
- Response-time history (last 20 samples) rendered as a small sparkline.
- Rolling uptime percentage over the last hour / 24 hours.
- Color-coded status indicator (green / yellow / red / grey).
- Manual "check now" button.
- Optional notification when status transitions between categories (opt-in).

## Open design questions

1. **Timing the no-cors round trip.** `fetch` in no-cors mode resolves when the network response is received, so wrapping the call in `performance.now()` deltas gives a usable (if slightly approximate) response time. Test under real conditions before trusting it.
2. **Multiple targets per widget.** Skip for v1 — use multiple widgets. A multi-target "uptime dashboard" widget is a separate concept and can be a later addition.
3. **History retention.** Long histories balloon the settings blob. Cap at 200 samples rolling, or 24 hours, whichever is shorter.
4. **Notifications fatigue.** Transition-only notifications (UP → DOWN, DOWN → UP) prevent spam. Don't notify on every failed check.

## Proposed widget ID & source layout

- **Widget ID:** `ping-monitor` (or rename to `http-monitor` — still undecided)
- **Default size:** 4 × 3 (grid cells)
- **Source (proposed):** `src/lib/widgets/ping-monitor/`
  - `PingMonitor.svelte`
  - `PingMonitorSettings.svelte`
  - `definition.ts`
- **Registry wiring:** add `import "./ping-monitor/definition.js";` to `src/lib/widgets/index.ts`.

## Proposed settings type

```ts
// src/lib/widgets/ping-monitor/definition.ts
export type PingStatus = "reachable" | "slow" | "unreachable" | "unknown";
export type PingIntervalSec = 30 | 60 | 300 | 900 | 1800 | 3600;

export type PingSample = {
  at: number; // epoch ms
  status: PingStatus;
  durationMs: number | null; // null if the request threw
};

export type PingMonitorSettings = {
  targetUrl: string;
  intervalSec: PingIntervalSec;
  timeoutMs: number; // default 5000
  slowThresholdMs: number; // default 1500 — above this we mark SLOW
  notificationsOnTransition: boolean;
  history: PingSample[]; // rolling buffer, capped
  paddingV: number;
  paddingH: number;
};

export const MAX_HISTORY = 200;
```

## Settings form outline

| Setting                | Control                                | Default   | Notes                                                           |
| ---------------------- | -------------------------------------- | --------- | --------------------------------------------------------------- |
| **Target URL**         | text input with validation             | empty     | Accept `http`/`https`; reject `javascript:` and anything weird. |
| **Check interval**     | select: 30s / 1 / 5 / 15 / 30 / 60 min | `5 min`   | Shorter intervals put pressure on the target — warn users.      |
| **Timeout**            | range 1–30 s                           | `5 s`     | Above timeout, the sample is `unreachable`.                     |
| **Slow threshold**     | range 100–5000 ms                      | `1500 ms` | Round trip above this flips status from `reachable` to `slow`.  |
| **Notify on changes**  | toggle                                 | `off`     | Opt-in; prompts for notification permission on first toggle.    |
| **Clear history**      | danger button                          | —         | Resets the history array.                                       |
| **Vertical padding**   | range 0–80 px                          | `8`       |                                                                 |
| **Horizontal padding** | range 0–80 px                          | `8`       |                                                                 |

A clear "This widget will send HTTP requests to the URL you configure, on an interval" notice should appear at the top of the settings form — matching Weather's disclosure style.

## Implementation notes

- **Check loop.** One `$effect` sets up a `setInterval` at `intervalSec * 1000` and tears it down on unmount. Don't create an interval per render. The first check runs immediately on mount.
- **Fetch pattern.**
  ```ts
  const started = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), settings.timeoutMs);
  try {
    await fetch(settings.targetUrl, { mode: "no-cors", signal: controller.signal });
    const durationMs = performance.now() - started;
    status = durationMs > settings.slowThresholdMs ? "slow" : "reachable";
  } catch {
    status = "unreachable";
  } finally {
    clearTimeout(timeoutId);
  }
  ```
- **History.** Push, then slice to `MAX_HISTORY`. Call `updateSettings` after every check. Settings writes are small — no need for debouncing.
- **Sparkline.** A tiny inline SVG with a single polyline. No chart library.
- **Notification transitions.** Keep the previous status in Svelte `$state`; compare against the new sample and fire a notification only when it changes between reachable/slow and unreachable.
- **Icons.** `lucide-svelte`: `Wifi` / `WifiOff`, `Activity`, `RotateCw`, `Bell`.

## Manifest impact

```diff
  "permissions": [
    "storage",
    "unlimitedStorage",
+   "notifications"
  ]
```

We do **not** want a host-permission wildcard (`"<all_urls>"`) — that would make the extension much scarier to review and install. Sticking with `mode: "no-cors"` avoids the need for host permissions entirely.

## Testing checklist (Firefox MV2)

- [ ] Widget appears in the **Add widget** dialog.
- [ ] Settings dialog opens; URL input validates.
- [ ] `https://example.com` check returns reachable with a round-trip duration.
- [ ] A non-routable URL (`https://10.255.255.1`) times out and flips to unreachable.
- [ ] LAN host (`http://192.168.1.1`) works when reachable.
- [ ] Sparkline renders the last 20 samples correctly.
- [ ] Transition notifications fire once per change, not on every check.
- [ ] History is capped at `MAX_HISTORY`.
- [ ] `npm run check` passes cleanly.
- [ ] Privacy policy and README note the network behavior.

## Out of scope for v1

Multi-target dashboards, HTTP-status-code interpretation (needs host permissions), SSL certificate expiration, traceroute, incident management integration, percentile analytics, mobile push notifications. The v1 widget is one host, no-cors round trip, small sparkline. That's it.
