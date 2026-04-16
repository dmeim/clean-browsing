# Timer

A countdown timer with presets, a circular progress ring, and OS-level notifications that fire even if the new tab is closed. Uses `browser.alarms` in a non-persistent background page so a running timer survives closing the tab or restarting Firefox; a foreground tab also plays an optional beep on expiry.

- **Widget ID:** `timer`
- **Default size:** 4 × 4 (width × height in grid cells)
- **Source:** [`src/lib/widgets/timer/`](../../src/lib/widgets/timer/)

## Permissions

Timer is the only widget that uses these two permissions, declared in [`public/manifest.json`](../../public/manifest.json):

| Permission      | What it enables                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `notifications` | Firing a system notification when a timer expires, so you get the alert even if the new tab is no longer focused or has been closed.                         |
| `alarms`        | Scheduling timer expiry through `browser.alarms` in a non-persistent background page. This is how the timer stays accurate even when the tab is not running. |

Both permissions are passive until you actually start a timer. A new tab page with no Timer widget on the grid does not use them.

No network requests are made.

## Usage

1. Add **Timer** from the **Add widget** menu in edit mode.
2. Open its settings (gear icon) to set the **default duration** and optional **presets**.
3. Press the primary **Start** button to begin counting down. The ring fills as time elapses; the digits switch to centisecond precision under 10 seconds.
4. Press the primary button again to **Pause**. Press once more to **Resume** from where you paused. The **Reset** button clears the countdown back to idle.
5. When the timer hits zero, an OS notification fires (if enabled) and the digits flash red. If **Auto-reset** is on, the timer immediately restarts from the total duration.

If you close the new tab while a timer is running, the alarm still fires the notification at the scheduled time. Reopening the new tab after expiry shows the widget in the expired state; reopening it before expiry resumes the live countdown.

## Settings

| Setting                  | Type                          | Default    | What it does                                                                                                                                     |
| ------------------------ | ----------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Label**                | text                          | `Timer`    | Shown as the body of the OS notification when the timer expires.                                                                                 |
| **Default duration**     | hours / minutes / seconds     | `5 min`    | Used when the primary Start button is pressed without a preset.                                                                                  |
| **Notifications**        | toggle                        | `on`       | When on, schedules a `browser.alarms` entry that fires a notification at expiry. When off, the timer only signals expiry in its own tab.         |
| **Alert sound**          | segmented: None / Beep        | `Beep`     | Synthesized beep via the Web Audio API, played in the foreground tab on expiry. The OS notification sound (if any) is separate and always plays. |
| **Progress style**       | segmented: Ring / Bar         | `Ring`     | Ring renders an SVG progress ring behind the digits. Bar renders a horizontal fill bar underneath.                                               |
| **Auto-reset on expiry** | toggle                        | `off`      | When on, the timer restarts from the total duration as soon as it hits zero. The next cycle re-arms a fresh background alarm.                    |
| **Presets**              | editable list (label + h/m/s) | 5 defaults | Quick-start buttons saved for later runs. Each preset has a label and a duration; **Add preset** appends a new row, the trash icon removes one.  |
| **Vertical padding**     | 0–80 px                       | `8`        | Space between the widget content and its top/bottom edges.                                                                                       |
| **Horizontal padding**   | 0–80 px                       | `8`        | Space between the widget content and its left/right edges.                                                                                       |

## Tips

- The digits drop to centisecond precision under 10 seconds so the last moments of a run feel responsive; above that the widget only repaints once a second.
- The progress ring uses a fixed SVG aspect so it scales cleanly from a 4 × 4 widget up to very large sizes — resize it like any other widget if you want a giant countdown.
- **Notifications** off is handy if you only want a visual countdown on the new tab page. The timer state itself still persists and recomputes on mount.
- Running timers carry their scheduled expiry through a full Firefox restart: on mount the widget verifies the `browser.alarms` entry still exists and re-schedules it if Firefox dropped it on shutdown.

## Out of scope (today)

Multi-timer dashboards, Pomodoro cycle automation, calendar integration, external alert sounds, and per-preset sound selection are not implemented. They may land as follow-ups — the current widget is intentionally small and self-contained.
