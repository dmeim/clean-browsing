# Ping Monitor

A service-availability monitor that pings URLs or LAN hosts on a schedule and shows at-a-glance status, response time, and rolling uptime stats — inspired by UniFi Network's service dashboard. Each target has its own schedule so you can poll a DNS server every few seconds while checking a home-lab service hourly from the same widget.

- **Widget ID:** `ping-monitor`
- **Default size:** 6 × 3 (width × height in grid cells)
- **Source:** [`src/lib/widgets/ping-monitor/`](../../src/lib/widgets/ping-monitor/)

## Permissions

No new permissions. The widget reuses `notifications` (already shipped in v1.3.0 for the Timer widget) for its optional transition alerts.

Network calls use `fetch(url, { mode: "no-cors" })`, which means **no per-host manifest permissions are required**. The trade-off: responses are opaque — the widget can tell whether the round-trip completed and how long it took, but not the HTTP status code. "Reachable" therefore means "the server answered any kind of response", not "the server returned 200 OK".

## Usage

1. Add **Ping Monitor** from the **Add widget** menu in edit mode.
2. Open its settings (gear icon) and go to the **Targets** tab.
3. Click **Add target** and fill in:
   - **Label** — a friendly name (e.g. "Google DNS").
   - **Address** — a URL with scheme (`https://1.1.1.1`) or a bare hostname / IP (`1.1.1.1` — HTTPS is assumed).
   - **Method** — `GET` (default), `HEAD`, or `POST`.
   - **Check every** — how often to ping this target. Type a duration: `5s`, `30s`, `1m`, `15m`, `1h`.
   - **Timeout** — how long to wait before marking a sample unreachable.
   - **Slow threshold** — round trips above this mark as "slow" rather than "reachable".
4. Add as many targets as you need — the widget's card grid wraps on narrow widgets.
5. Press the **⟳** icon in the widget header to check every target immediately instead of waiting for its next tick.

## Status meanings

| State           | Color  | Meaning                                                                                                        |
| --------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| **Reachable**   | Green  | The fetch completed within the slow threshold.                                                                 |
| **Slow**        | Orange | The fetch completed, but above the configured slow threshold.                                                  |
| **Unreachable** | Red    | The fetch threw (timeout, connection refused, DNS failure). The sparkline spikes to the top for these samples. |
| **Unknown**     | Gray   | No samples yet. Either the widget was just added or the target hasn't completed its first check.               |

## Settings

### Targets tab

Each target card exposes the following controls. Remove a target with the ✕ button on the card.

| Field              | Type                         | Default  | Notes                                                                                       |
| ------------------ | ---------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| **Label**          | text                         | empty    | Display name on the card and in transition notifications.                                   |
| **Address**        | text                         | empty    | Full URL or a bare hostname / IP. HTTPS is assumed when no scheme is given.                 |
| **Method**         | segmented: GET / HEAD / POST | `GET`    | Only methods that work with `mode: "no-cors"`. For a pure health check, `HEAD` is lightest. |
| **Check every**    | duration text input          | `5m`     | Accepts `ms` / `s` / `m` / `h` suffixes. Minimum 1 s.                                       |
| **Timeout**        | duration text input          | `5s`     | Minimum 500 ms. Samples over this deadline are marked unreachable.                          |
| **Slow threshold** | duration text input          | `1500ms` | Minimum 50 ms. Round trips above this mark flip the status from reachable to slow.          |

### General tab

| Setting                      | Type   | Default | What it does                                                                                                                                                                              |
| ---------------------------- | ------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Notify on status changes** | toggle | `off`   | Fires a system notification when any target transitions between reachable and unreachable. `slow ↔ reachable` is suppressed to avoid chatter. Only active while the new tab page is open. |
| **Clear all history**        | button | —       | Wipes the response-time history for every target. Resets sparklines and the aggregate uptime stats.                                                                                       |

### Appearance tab

Standard widget appearance controls — padding, the placeholder "Inherit global appearance" toggle (coming soon), and the full per-instance appearance editor (background, border, glow, shadow, opacity, blur, presets).

## Duration input format

The interval / timeout / slow-threshold fields accept any of these forms:

| Input       | Parsed as                                     |
| ----------- | --------------------------------------------- |
| `2000ms`    | 2,000 ms                                      |
| `5s`, `5 s` | 5,000 ms                                      |
| `1.5s`      | 1,500 ms                                      |
| `30m`       | 1,800,000 ms                                  |
| `1h`        | 3,600,000 ms                                  |
| `0.5h`      | 1,800,000 ms                                  |
| `2000`      | 2,000 ms (bare numbers are interpreted as ms) |

Invalid input shows a red border and the value isn't committed. On blur, valid input is normalized to the largest unit that divides evenly — `90000ms` displays as `90s`, `3600000ms` displays as `1h`.

## Tips

- **Pick realistic intervals.** Mis-scheduling could get you IP-banned or trip rate limiters — the widget fires real HTTP requests. `30s` is often frequent enough for uptime monitoring; `5s` is reserved for LAN hosts and anycast DNS servers that truly expect it.
- **Use HEAD for traffic-sensitive targets.** `HEAD` asks the server for headers only — it's the lightest legitimate health check.
- **LAN hosts work.** `http://192.168.1.1` is fine. IPv6 literals work too.
- **Uptime stats are aggregate.** The 1 h / 24 h percentages at the bottom of the widget blend every target's history together. For per-target uptime, read the sparkline — a mostly-flat line at the bottom means low latency; spikes to the ceiling are unreachable samples.
- **Checks pause when the tab is closed.** Because the widget schedules via `setInterval` on the new tab page itself, closing the tab stops the checks (and any pending transition notifications). Reopening resumes from the last persisted sample.

## Out of scope (today)

SSL certificate expiry checks, TCP / ICMP pings (browsers can't send raw packets), HTTP status-code interpretation (would require host permissions), traceroute, per-target notification rules, percentile analytics (p95 / p99), incident-management webhook integrations, and cross-tab background scheduling are not implemented. The widget is deliberately small: one host per target, no-cors round trip, compact sparkline.
