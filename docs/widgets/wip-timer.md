# Timer Widget (WIP)

> **Status:** 💡 Idea
>
> **Stage:** Concept / brainstorming
>
> This is a design document for a widget that does **not** ship yet. Scope, settings, and even whether this lands as a widget at all are provisional.

## Overview

A countdown timer widget for productivity, cooking, and general reminders. A single active countdown per widget instance, with preset buttons for common durations, a visual progress ring or bar, and browser notifications when the timer expires. Multiple timers are supported by dropping multiple Timer widgets onto the grid.

## Core features

- Configure a countdown in hours / minutes / seconds.
- Start, pause, resume, and reset controls with clear visual states.
- Web Notifications API alert when the timer hits zero.
- Preset buttons for common durations (5 min, 10 min, Pomodoro 25, etc.), configurable in settings.
- Visual progress — a circular ring (default) or a linear bar.
- Optional alert sound (see "Open design questions" below).
- Optional auto-reset after expiry so the widget is ready for the next run.

## Open design questions

1. **Background accuracy.** Firefox throttles `setInterval` in inactive tabs. The new tab page is almost always in a foreground tab, which makes this much less of an issue than for an in-tab widget — but a long timer can still drift. Use a wall-clock approach: store a `startedAt` timestamp and recompute `remaining = totalMs - (performance.now() - startedAt)` on every render. That's accurate regardless of interval throttling.
2. **Notifications permission.** Requires adding `"notifications"` to `public/manifest.json` and prompting the user on first use. This is a new permission for the extension — call it out in the release notes when the widget lands.
3. **Sound asset bundling.** Bundling a WAV/OGG alert adds a few KB to the extension and is one more thing to style-check. Option B: use a short `AudioContext` beep synthesized on the fly (zero assets). **Lean preference: start with a synthesized beep; add bundled sounds only if users ask.**
4. **Multi-timer UI.** Out of scope for v1 — use multiple Timer widgets.

## Proposed widget ID & source layout

- **Widget ID:** `timer`
- **Default size:** 4 × 4 (grid cells — square is best for the circular progress ring)
- **Source (proposed):** `src/lib/widgets/timer/`
  - `Timer.svelte`
  - `TimerSettings.svelte`
  - `definition.ts`
- **Registry wiring:** add `import "./timer/definition.js";` to `src/lib/widgets/index.ts`.

## Proposed settings type

```ts
// src/lib/widgets/timer/definition.ts
export type TimerPreset = {
  label: string;
  durationMs: number;
};

export type TimerSettings = {
  defaultDurationMs: number; // the duration used by Start when no preset is picked
  notifications: boolean; // fire a browser notification on expiry
  sound: "none" | "beep" | "chime"; // "beep" = synthesized, "chime" = bundled (if/when added)
  progressStyle: "ring" | "bar";
  autoReset: boolean; // reset to default after expiry
  presets: TimerPreset[]; // user-configurable quick buttons
  paddingV: number;
  paddingH: number;
};

export const DEFAULT_PRESETS: TimerPreset[] = [
  { label: "Quick break", durationMs: 5 * 60_000 },
  { label: "Tea", durationMs: 10 * 60_000 },
  { label: "Pomodoro", durationMs: 25 * 60_000 },
  { label: "Meeting", durationMs: 30 * 60_000 },
  { label: "Lunch", durationMs: 60 * 60_000 },
];
```

The widget's **runtime** state (`startedAt`, `pausedAt`, `state: "idle" | "running" | "paused" | "expired"`) lives as Svelte `$state` inside the component itself — it doesn't belong in `TimerSettings` because it shouldn't survive a page reload the way a note's content should. The timer simply resets when the new-tab page is reloaded. If a persistent "ongoing timer" is desired later, `startedAt` can be added to the settings type.

## Settings form outline

| Setting                | Control                          | Default    | Notes                                                                  |
| ---------------------- | -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| **Default duration**   | three number inputs (h / m / s)  | `5 min`    | Used when Start is pressed with no preset selected.                    |
| **Notifications**      | toggle                           | `on`       | First toggle-on prompts the user via `Notification.requestPermission`. |
| **Alert sound**        | select: none / beep / chime      | `beep`     | Chime only available if bundled assets land.                           |
| **Progress style**     | segmented: ring / bar            | `ring`     | Ring uses an SVG stroke-dasharray.                                     |
| **Auto-reset**         | toggle                           | `off`      | When on, expiry resets back to the default duration.                   |
| **Presets**            | editable list (label + duration) | 5 defaults | Use the shadcn-svelte `Input` + drag-handle pattern.                   |
| **Vertical padding**   | range 0–80 px                    | `8`        |                                                                        |
| **Horizontal padding** | range 0–80 px                    | `8`        |                                                                        |

## Implementation notes

- **Timing.** Use `performance.now()` deltas, not `Date.now()`, for drift-free countdown. A `$effect` with `requestAnimationFrame` gives smooth progress ring updates while the tab is focused.
- **Progress ring.** A simple SVG `<circle>` with `stroke-dasharray` / `stroke-dashoffset` animated via `$derived`. Icon sizing should use the `widgetScaler` action like the other widgets.
- **Notifications.** Guard `Notification.requestPermission()` behind a first-use prompt inside the settings dialog, not on widget mount, so the user opts in intentionally. Always check `Notification.permission` before firing.
- **Sound (synthesized).** Build an `AudioContext` lazily on first beep — creating one at module load throws in Firefox due to autoplay restrictions.
- **Icons.** `lucide-svelte` has `Play`, `Pause`, `RotateCcw`, and `Bell` icons that fit the rest of the UI.

## Manifest impact

Adding the Timer widget requires:

```diff
  "permissions": [
    "storage",
-   "unlimitedStorage"
+   "unlimitedStorage",
+   "notifications"
  ]
```

Flag this in the release notes when the widget ships.

## Testing checklist (Firefox MV2)

- [ ] Widget appears in the **Add widget** dialog.
- [ ] Settings dialog opens, presets edit and persist, reload restores them.
- [ ] Countdown stays accurate over long runs (verify against a wall clock for a 15–30 min test).
- [ ] Notification fires once at expiry, not repeatedly.
- [ ] Permission prompt only appears after the user opts in to notifications in settings.
- [ ] Works in edit mode (drag/resize/delete).
- [ ] Progress ring/bar scales cleanly across widget sizes via `widgetScaler`.
- [ ] `npm run check` passes cleanly.

## Out of scope for v1

Multi-timer dashboard, Pomodoro cycle automation, calendar integration, voice control, usage analytics, and timer sharing. All of these are future enhancements; keep the v1 widget small and focused.
