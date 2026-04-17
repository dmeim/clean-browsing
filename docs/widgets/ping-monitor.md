# Ping Monitor

A service-availability widget that pings a single URL or LAN host on a schedule and shows at-a-glance status, response time, and rolling uptime stats — inspired by UniFi Network's service dashboard. Each Ping Monitor widget watches **one** endpoint; place several widgets on the grid to monitor several hosts independently.

- **Widget ID:** `ping-monitor`
- **Default size:** 2 × 2 normal cells (4 × 4 in dense grid mode)
- **Minimum size:** 2 × 2 normal cells (4 × 4 in dense grid mode) — the layout doesn't read well below this
- **Source:** [`src/lib/widgets/ping-monitor/`](../../src/lib/widgets/ping-monitor/)

## How "ping" actually works (read this before configuring a target)

Despite the name, this widget is **not** an ICMP ping — browsers can't send raw IP packets at all. Each check is an HTTP `fetch()` request to the target URL on its standard web port (443 for HTTPS, 80 for HTTP), and "reachable" means the round-trip completed end-to-end.

That has one important consequence: **the target has to be running an HTTP / HTTPS server on a port the browser can reach.** A host that responds to terminal `ping` won't necessarily respond here.

Things that work:

- Public websites — `https://example.com`, `https://1.1.1.1`, `https://github.com`.
- LAN devices with a web UI — `http://192.168.1.1`, your NAS, your router admin page, Pi-hole, Home Assistant, a Plex server, etc.
- Tailnet / VPN nodes that run an HTTP server (NAS web UI, self-hosted dashboards at `http://100.x.y.z:port`).
- A throwaway HTTP responder you start yourself: `python3 -m http.server 8000` on any host.

Things that don't:

- **Tailscale's `100.100.100.100`** — that's the MagicDNS resolver. It listens on UDP / TCP 53 for DNS queries, not HTTP. Use a tailnet host that actually serves a web UI instead, or `https://login.tailscale.com` if you just want to know whether Tailscale-the-service is up.
- DNS-only servers in general (`8.8.8.8` is a notable exception — Google runs an HTTPS server on it).
- Services that only listen on non-standard ports — unless you write the port into the URL (`http://host:8080`).
- Anything reachable only by ICMP / SSH / SMB / etc. with no web server.

If you set up a target and it stays red, the most likely cause is "no HTTP server on the standard port", not a connectivity issue.

## Permissions

No new permissions. The widget reuses `notifications` (already shipped in v1.3.0 for the Timer widget) for its optional transition alerts.

Network calls use `fetch(url, { mode: "no-cors" })`, which means **no per-host manifest permissions are required**. The trade-off: responses are opaque — the widget can tell whether the round-trip completed and how long it took, but not the HTTP status code. "Reachable" therefore means "the server answered any kind of response", not "the server returned 200 OK".

## Usage

1. Add **Ping Monitor** from the **Add widget** menu in edit mode.
2. Open its settings (gear icon) and go to the **Target** tab.
3. Fill in:
   - **Label** — a friendly name (e.g. "Google DNS"). Shown below the graph as the widget's title.
   - **Address** — a URL with scheme (`https://1.1.1.1`) or a bare hostname / IP (`1.1.1.1` — HTTPS is assumed).
   - **Method** — `GET` (default), `HEAD`, or `POST`.
   - **Check every** — how often to ping. Type a duration: `5s`, `30s`, `1m`, `15m`, `1h`.
   - **Timeout** — how long to wait before marking a sample unreachable.
   - **Slow threshold** — round trips above this mark as "slow" rather than "reachable".
4. Hover the widget body to reveal the **⟳** refresh icon in the top-right; click it to check immediately instead of waiting for the next tick. The icon hides during edit mode.
5. To monitor more endpoints, add another Ping Monitor widget.

## Status meanings

| State           | Color  | Meaning                                                                                                        |
| --------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| **Reachable**   | Green  | The fetch completed within the slow threshold.                                                                 |
| **Slow**        | Orange | The fetch completed, but above the configured slow threshold.                                                  |
| **Unreachable** | Red    | The fetch threw (timeout, connection refused, DNS failure). The sparkline spikes to the top for these samples. |
| **Unknown**     | Gray   | No samples yet. Either the widget was just added or the target hasn't completed its first check.               |

## Settings

### Target tab

| Field              | Type                         | Default  | Notes                                                                                       |
| ------------------ | ---------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| **Label**          | text                         | empty    | Display name shown below the graph and in transition notifications.                         |
| **Address**        | text                         | empty    | Full URL or a bare hostname / IP. HTTPS is assumed when no scheme is given.                 |
| **Method**         | segmented: GET / HEAD / POST | `GET`    | Only methods that work with `mode: "no-cors"`. For a pure health check, `HEAD` is lightest. |
| **Check every**    | duration text input          | `5m`     | Accepts `ms` / `s` / `m` / `h` suffixes. Minimum 1 s.                                       |
| **Timeout**        | duration text input          | `5s`     | Minimum 500 ms. Samples over this deadline are marked unreachable.                          |
| **Slow threshold** | duration text input          | `1500ms` | Minimum 50 ms. Round trips above this mark flip the status from reachable to slow.          |

### General tab

| Setting                      | Type   | Default      | What it does                                                                                                                                                                                                                                                                                    |
| ---------------------------- | ------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Uptime windows**           | pills  | `1h` + `24h` | Pick which two rolling-uptime windows show under the graph. Available: 1h / 4h / 8h / 12h / 18h / 24h. Tapping an inactive pill swaps it in for the older of the two active ones — exactly two stay active at all times. Both are computed from the same per-widget history cap of 200 samples. |
| **Notify on status changes** | toggle | `off`        | Fires a system notification when the target transitions between reachable and unreachable. `slow ↔ reachable` is suppressed to avoid chatter. Only active while the new tab page is open.                                                                                                       |
| **Clear history**            | button | —            | Wipes the response-time history for this widget. Resets the sparkline and the configured uptime stats.                                                                                                                                                                                          |

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
- **One widget, one target.** To monitor more endpoints, add more Ping Monitor widgets and place them side-by-side on the grid. Each widget keeps its own response-time history (capped at 200 samples) and its own uptime numbers — nothing is shared between widgets, even when two widgets point at the same URL.
- **Checks pause when the tab is closed.** Because each widget schedules via `setInterval` on the new tab page itself, closing the tab stops the checks (and any pending transition notifications). Reopening resumes from the last persisted sample.

## Out of scope (today)

SSL certificate expiry checks, true TCP / ICMP pings (browsers can't send raw packets — see ["How ping actually works"](#how-ping-actually-works-read-this-before-configuring-a-target) above), HTTP status-code interpretation (would require host permissions), traceroute, per-widget notification rules, percentile analytics (p95 / p99), incident-management webhook integrations, and cross-tab background scheduling are not implemented. The widget is deliberately small: one host per widget, no-cors round trip, compact sparkline, inline uptime row.
