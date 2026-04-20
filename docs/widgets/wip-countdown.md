# Countdown Widget (WIP)

> **Status:** :red_circle: Planned
>
> **Stage:** Design

## Overview

A countdown to a specific date and time. Set a target ("Vacation", "Product launch", "Birthday"), and the widget displays the remaining time in a clean, glanceable format. Fully offline — no network calls, no permissions, just date math against `Date.now()`.

This is distinct from the Timer widget: Timer counts down a duration you start manually; Countdown counts toward a fixed point in the future (or shows how long ago a date passed, if you leave it running past the target).

## Core features

- Set a target date and time via a date-time picker.
- Event label displayed above or below the countdown.
- Configurable display units: days + hours + minutes + seconds, or a subset (days only, days + hours, etc.).
- Live tick — updates every second when seconds are shown, every minute otherwise.
- Completion state: when the target passes, show "Event reached!" or flip to a count-up ("3 days ago") depending on a setting.
- Optional progress bar or ring showing how far through a user-defined span you are (e.g., "50 days into a 100-day countdown").
- Multiple display formats: segmented boxes (each unit in its own card), inline text, or minimal (just the biggest unit).
- Scales well from small (3 x 2: just days + label) to large (shows all units with labels).

## Open design questions

1. **Progress visualization.** A progress ring/bar needs a start date in addition to the target date. Without a start date, the widget can only show absolute time remaining, not "percent done." **Recommendation: optional start date field. When set, enable a progress ring. When unset, just show the countdown digits.** The start date defaults to "now" when the user first sets the target, but is editable.
2. **Past-target behavior.** Three options: (a) show "Done!" and stop, (b) flip to count-up mode, (c) hide the widget. **Lean preference: (b) count-up with a visual indicator (different color, "ago" suffix).** Users who set a birthday countdown want to see "2 days ago" the day after, not a blank widget.
3. **Timezone.** The target date-time is stored as a UTC epoch. Display uses the local timezone. No timezone picker for v1 — if someone needs a countdown in a different timezone, they can do the math themselves.
4. **Recurring events.** A birthday repeats every year. Supporting recurrence adds complexity (next occurrence calculation, leap years). **Defer to v2.** For v1, the user manually updates the target date after it passes.

## Proposed widget ID & source layout

- **Widget ID:** `countdown`
- **Default size:** 4 x 2 (grid cells)
- **Minimum size:** 2 x 1
- **Source (proposed):** `src/lib/widgets/countdown/`
  - `Countdown.svelte`
  - `CountdownSettings.svelte`
  - `definition.ts`
- **Registry wiring:** add `import "./countdown/definition.js";` to `src/lib/widgets/index.ts`.

## Proposed settings type

```ts
// src/lib/widgets/countdown/definition.ts
export type CountdownDisplayStyle = "segments" | "inline" | "minimal";

export type CountdownSettings = {
  label: string;
  targetMs: number; // UTC epoch milliseconds
  startMs: number | null; // optional start date for progress calculation
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
  displayStyle: CountdownDisplayStyle;
  showProgress: boolean; // ring/bar, requires startMs to be set
  countUpAfterTarget: boolean; // true = flip to count-up; false = show "Done!"
  paddingV: number;
  paddingH: number;
};
```

## Settings form outline

| Setting                | Control                                | Default     | Notes                                                                            |
| ---------------------- | -------------------------------------- | ----------- | -------------------------------------------------------------------------------- |
| **Label**              | text                                   | `Countdown` | Event name shown on the widget.                                                  |
| **Target date**        | `<input type="datetime-local">`        | empty       | Required. Stored as UTC epoch.                                                   |
| **Start date**         | `<input type="datetime-local">`        | empty       | Optional. Enables progress visualization. Defaults to "now" on first target set. |
| **Show days**          | toggle                                 | `on`        |                                                                                  |
| **Show hours**         | toggle                                 | `on`        |                                                                                  |
| **Show minutes**       | toggle                                 | `on`        |                                                                                  |
| **Show seconds**       | toggle                                 | `on`        |                                                                                  |
| **Display style**      | segmented: Segments / Inline / Minimal | `Segments`  | Segments = unit cards; Inline = "12d 5h 30m"; Minimal = "12 days".               |
| **Show progress**      | toggle                                 | `off`       | Requires start date. Renders a progress bar beneath the countdown.               |
| **After target**       | segmented: Count up / Done             | `Count up`  | What happens when the target date passes.                                        |
| **Vertical padding**   | range 0-80 px                          | `8`         |                                                                                  |
| **Horizontal padding** | range 0-80 px                          | `8`         |                                                                                  |

## Implementation notes

- **Tick interval.** If `showSeconds` is on, tick every 1000 ms via `setInterval` inside `$effect` with cleanup. If seconds are off, tick every 60000 ms. Switch dynamically when the setting changes.
- **Time decomposition.** `$derived` computes `{ days, hours, minutes, seconds }` from `targetMs - Date.now()`. Negative values mean the target has passed — flip sign and set a `isPast` flag.
- **Segments display.** Each unit renders in a small card: large number on top, unit label below ("days", "hrs", "min", "sec"). Use CSS Grid with `auto-fit` so the visible units reflow based on widget width.
- **Inline display.** A single line: `12d 5h 30m 12s`. Uses `fitText` action to scale with widget size.
- **Minimal display.** Shows only the largest non-zero unit: "12 days", "5 hours", "30 minutes". Uses `fitText`.
- **Progress bar.** A thin horizontal bar at the bottom of the widget. Fill percentage: `(now - startMs) / (targetMs - startMs) * 100`, clamped 0-100. Uses a `<div>` with `width: {percent}%` and a transition.
- **Empty state.** Before a target is set, show "Set a date in settings" with a calendar icon.
- **Auto-hide units.** When the countdown is under 1 day, the "days" segment hides automatically (if the user hasn't forced it on). When under 1 hour, hours hide. This keeps the display clean as the event approaches.
- **Icons.** `lucide-svelte`: `CalendarClock`, `PartyPopper` (for completion state), `Clock`.

## Manifest impact

None. No permissions or network calls required.

## Testing checklist (Firefox MV2)

- [ ] Widget appears in the **Add widget** dialog.
- [ ] Setting a future target date shows the countdown ticking.
- [ ] Setting a past target date shows count-up mode (or "Done!" per setting).
- [ ] Segments display: each unit renders in its own card.
- [ ] Inline display: single formatted line, scales with `fitText`.
- [ ] Minimal display: shows only the largest unit.
- [ ] Progress bar fills proportionally when start + target dates are set.
- [ ] Toggling unit visibility (days/hours/minutes/seconds) updates the display.
- [ ] Countdown persists across reloads.
- [ ] Tick interval switches between 1s and 60s based on `showSeconds`.
- [ ] Empty state renders when no target is set.
- [ ] Widget scales cleanly from 2 x 1 to large sizes.
- [ ] `npm run check` passes cleanly.

## Out of scope for v1

Recurring events, timezone picker, multiple countdowns in one widget instance, notification on target reached, calendar integration, shareable countdown links, custom completion animations, sound on completion. v1 is a single date target with live countdown — clean and simple.
