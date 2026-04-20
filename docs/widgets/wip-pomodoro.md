# Pomodoro Widget (WIP)

> **Status:** :red_circle: Planned
>
> **Stage:** Design — builds on shipped Timer internals

## Overview

A focused work-session timer implementing the Pomodoro Technique: alternating work intervals (typically 25 minutes) and break intervals (5 minutes short / 15 minutes long), with an automatic session counter. The widget reuses the Timer widget's `browser.alarms` + notification infrastructure so sessions survive tab closure.

Where the Timer widget is a general-purpose countdown, Pomodoro is opinionated: it knows about work vs break phases, tracks how many sessions you've completed today, and auto-advances through the cycle.

## Core features

- Work / short-break / long-break cycle with configurable durations.
- Session counter (how many work intervals completed). Resets daily or manually.
- Auto-advance between phases (work -> break -> work) with an optional pause between phases.
- Visual phase indicator: distinct colors for work, short break, and long break.
- Progress ring (same SVG pattern as Timer) showing elapsed time within the current phase.
- OS notifications via `browser.alarms` at every phase transition.
- Optional alert sound (Web Audio API beep) on phase transition.
- Start / Pause / Skip / Reset controls.
- "Skip" jumps to the next phase (e.g. end a break early to start working).

## Open design questions

1. **Separate widget vs Timer mode.** The Timer already has presets and auto-reset. A "Pomodoro mode" toggle inside Timer would avoid a second widget, but it would bloat Timer's settings and muddy its identity. **Lean preference: separate widget.** The Pomodoro cycle state (current phase, session count, phase queue) is different enough from a plain countdown that sharing a component would be awkward. Shared code lives in utility functions, not shared UI.
2. **Session persistence across days.** Should the session counter reset at midnight automatically, or only on manual reset? Midnight auto-reset is more useful for "how many Pomodoros did I do today" tracking, but timezone handling adds edge cases. **Recommendation: reset at midnight local time, with a manual reset button as a fallback.**
3. **Long break trigger.** Classic Pomodoro says a long break comes every 4 work sessions. Should this be configurable? Probably yes — a simple "long break every N sessions" number input.
4. **Pause between phases.** Some users want the next phase to start automatically; others want to press Start when they're ready. Ship with "auto-advance" defaulting to off (user clicks to start each phase), with a toggle to enable auto-advance.
5. **Daily stats.** Showing "4/8 sessions today" is motivating but requires persisting a date + count that resets. This fits in widget settings as `{ todayDate: string, todayCount: number }` — simple enough for v1.

## Proposed widget ID & source layout

- **Widget ID:** `pomodoro`
- **Default size:** 4 x 4 (grid cells)
- **Minimum size:** 3 x 3
- **Source (proposed):** `src/lib/widgets/pomodoro/`
  - `Pomodoro.svelte`
  - `PomodoroSettings.svelte`
  - `definition.ts`
- **Registry wiring:** add `import "./pomodoro/definition.js";` to `src/lib/widgets/index.ts`.

## Proposed settings type

```ts
// src/lib/widgets/pomodoro/definition.ts
export type PomodoroPhase = "work" | "short-break" | "long-break";

export type PomodoroSettings = {
  workMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  longBreakEvery: number; // long break after every N work sessions
  autoAdvance: boolean; // auto-start next phase without waiting for user
  label: string;
  notificationsEnabled: boolean;
  alertSound: "none" | "beep";
  progressStyle: "ring" | "bar";
  todayDate: string; // ISO date string, e.g. "2026-04-20"
  todayCount: number; // work sessions completed today
  paddingV: number;
  paddingH: number;
};
```

Runtime state (current phase, time remaining, running/paused, session count within the current cycle) lives in component `$state`, not in persisted settings. Only the daily counter is persisted so it survives tab closure.

## Settings form outline

| Setting                | Control                | Default | Notes                                                       |
| ---------------------- | ---------------------- | ------- | ----------------------------------------------------------- |
| **Label**              | text                   | `Focus` | Shown in the OS notification body.                          |
| **Work duration**      | number (minutes)       | `25`    |                                                             |
| **Short break**        | number (minutes)       | `5`     |                                                             |
| **Long break**         | number (minutes)       | `15`    |                                                             |
| **Long break every**   | number (sessions)      | `4`     | Long break replaces the short break after every N sessions. |
| **Auto-advance**       | toggle                 | `off`   | On = next phase starts immediately after the previous ends. |
| **Notifications**      | toggle                 | `on`    | OS notification at every phase transition.                  |
| **Alert sound**        | segmented: None / Beep | `Beep`  | Web Audio API, foreground tab only.                         |
| **Progress style**     | segmented: Ring / Bar  | `Ring`  | Same SVG ring pattern as Timer.                             |
| **Vertical padding**   | range 0-80 px          | `8`     |                                                             |
| **Horizontal padding** | range 0-80 px          | `8`     |                                                             |

## Implementation notes

- **Reuse Timer patterns, not Timer code.** The SVG ring, `browser.alarms` scheduling, notification firing, and Web Audio beep are all patterns established by the Timer widget. Copy the approach (SVG `<g transform>` for the ring, alarm scheduling in `$effect`, etc.) but don't import Timer internals — the phase-cycling state machine is fundamentally different from a single countdown.
- **Phase state machine.** The component tracks `currentPhase: PomodoroPhase`, `timeRemainingMs: number`, `isRunning: boolean`, and `cyclePosition: number` (0-indexed, where `cyclePosition % longBreakEvery === 0` triggers a long break). Transitions happen when the countdown hits zero or the user clicks Skip.
- **Phase colors.** Use CSS custom properties: `--pomodoro-work` (warm/red), `--pomodoro-short-break` (cool/green), `--pomodoro-long-break` (blue). Define them in the widget's `<style>` block, respecting dark/light mode via existing `mode-watcher` integration.
- **Daily counter.** On mount, compare `settings.todayDate` to today's date. If different, reset `todayCount` to 0 and update `todayDate`. Increment on every work-phase completion.
- **SVG ring.** Follow the Timer widget's compositing-safe pattern: SVG as a direct child of `.widget-card`, positioned `absolute inset-0`. Ring color changes per phase.
- **Icons.** `lucide-svelte`: `Play`, `Pause`, `SkipForward`, `RotateCcw`, `Coffee`, `Brain`.

## Manifest impact

None. The `notifications` and `alarms` permissions are already declared for the Timer widget.

## Testing checklist (Firefox MV2)

- [ ] Widget appears in the **Add widget** dialog.
- [ ] Work phase counts down correctly; ring fills proportionally.
- [ ] Phase transitions correctly: work -> short break -> work -> ... -> long break.
- [ ] Long break triggers after the configured number of work sessions.
- [ ] OS notification fires at every phase transition.
- [ ] Closing the tab and reopening shows the correct state (alarm still fires).
- [ ] Auto-advance on: next phase starts without user interaction.
- [ ] Auto-advance off: widget pauses between phases until user clicks Start.
- [ ] Skip button advances to the next phase immediately.
- [ ] Reset button returns to idle (first work phase, counter preserved).
- [ ] Daily counter increments on work-phase completion and resets at midnight.
- [ ] Ring color changes per phase (work / short break / long break).
- [ ] Widget scales cleanly from 3 x 3 to large sizes.
- [ ] `npm run check` passes cleanly.

## Out of scope for v1

Task labeling per session, Pomodoro history/analytics dashboard, integration with the Notes widget, weekly/monthly session reports, custom phase sequences, ambient sounds during work phases, focus-mode screen dimming, calendar export of completed sessions. The widget is a timer with phase cycling and a daily counter — nothing more.
