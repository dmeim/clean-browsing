# Stopwatch Widget (WIP)

> **Status:** ⭕ Planned
>
> **Stage:** Planning
>
> This is a design document for a widget that does **not** ship yet. Scope and settings are provisional.

## Overview

A precision stopwatch with lap timing. Complements the Timer widget: Timer counts *down* to an alarm, Stopwatch counts *up* and records splits. Uses `performance.now()` for drift-free timing.

## Core features

- Start / stop / reset with a single primary button that toggles state.
- Lap button records the current elapsed time as a split.
- Precise timing via `performance.now()` deltas (millisecond precision).
- Scrollable lap history list.
- Time display format configurable (MM:SS.mmm, MM:SS.cc, or HH:MM:SS).
- Export lap history to a `.txt` or `.csv` file.
- Clear history button.

## Open design questions

1. **Persistence of a running stopwatch.** Should a stopwatch that's running when the new-tab page reloads pick up where it left off, or reset to zero? **Lean preference: reset.** The new-tab page is the user's home view and they'll frequently reload it — a resuming stopwatch is surprising. Matches how the Timer widget behaves.
2. **Lap history persistence.** Recorded laps *should* survive reloads, so they live in settings as an array. Cap at 200 entries to keep the settings blob small.
3. **Sound feedback.** Nice-to-have for hands-free lap recording. Same trade-off as the Timer widget — prefer a synthesized click over a bundled audio asset.

## Proposed widget ID & source layout

- **Widget ID:** `stopwatch`
- **Default size:** 4 × 5 (grid cells)
- **Source (proposed):** `src/lib/widgets/stopwatch/`
  - `Stopwatch.svelte`
  - `StopwatchSettings.svelte`
  - `definition.ts`
- **Registry wiring:** add `import "./stopwatch/definition.js";` to `src/lib/widgets/index.ts`.

## Proposed settings type

```ts
// src/lib/widgets/stopwatch/definition.ts
export type StopwatchLap = {
  index: number;        // 1-based lap number
  splitMs: number;      // time since previous lap (or start for lap 1)
  totalMs: number;      // total elapsed at the moment the lap was recorded
  recordedAt: number;   // epoch ms
};

export type StopwatchPrecision = "ms" | "cs" | "s"; // milliseconds / centiseconds / seconds

export type StopwatchSettings = {
  precision: StopwatchPrecision;
  maxLapsShown: number;          // default 10, 0 = unlimited
  showSplits: boolean;           // show per-lap split vs cumulative
  soundFeedback: boolean;        // synthesized click on lap
  laps: StopwatchLap[];          // persisted lap history
  paddingV: number;
  paddingH: number;
};

export const MAX_LAPS = 200;     // hard cap on the settings blob
```

The **runtime** state (`startedAt`, `elapsedBeforePause`, `state: "idle" | "running" | "paused"`) lives in Svelte `$state` inside the component, not in the settings type. On reload the component starts in `idle` with `elapsedMs = 0`, and the persisted `laps` array is rendered as history.

## Settings form outline

| Setting              | Control                                    | Default   | Notes                                                        |
| -------------------- | ------------------------------------------ | --------- | ------------------------------------------------------------ |
| **Precision**        | segmented: ms / cs / s                     | `cs`      | `cs` = two digits after the decimal. Easier on the eyes.      |
| **Max laps shown**   | number (0 for unlimited)                   | `10`      | Doesn't affect stored count — only what's rendered inline.    |
| **Show splits**      | toggle                                     | `on`      | On = per-lap delta; off = running total.                     |
| **Sound feedback**   | toggle                                     | `off`     | Synthesized click on Lap.                                    |
| **Clear history**    | danger button                              | —         | Confirms via a shadcn-svelte `AlertDialog`.                  |
| **Export history**   | button                                     | —         | Downloads a `.csv` of all recorded laps.                     |
| **Vertical padding** | range 0–80 px                              | `8`       |                                                              |
| **Horizontal padding** | range 0–80 px                            | `8`       |                                                              |

## Implementation notes

- **Timing.** `let startedAt = $state(0); let elapsedBeforePause = $state(0);` and a `$derived` that computes `elapsedMs = state === "running" ? (performance.now() - startedAt + elapsedBeforePause) : elapsedBeforePause`. A `requestAnimationFrame` loop updates a trigger state while running so `$derived` re-evaluates smoothly.
- **Formatting.** A tiny `formatElapsed(ms, precision)` helper. Use `font-variant-numeric: tabular-nums` on the display so digits don't jitter as they change.
- **Lap recording.** Push onto the `laps` array and call `updateSettings`. Debounce storage writes if the user taps Lap rapidly (e.g. coalesce inside a single `requestAnimationFrame` tick).
- **Export.** Generate CSV client-side, wrap in a `Blob`, trigger a download via an invisible `<a>`. No extra permissions needed.
- **Icons.** `lucide-svelte` has `Play`, `Pause`, `Flag`, `RotateCcw`, `Download`.

## Manifest impact

None. Stopwatch only needs `storage`, already present.

## Testing checklist (Firefox MV2)

- [ ] Widget appears in the **Add widget** dialog.
- [ ] Start/Stop/Lap/Reset behave correctly across full state cycle.
- [ ] Elapsed time stays accurate over a 10+ minute run (verify against a phone stopwatch).
- [ ] Lap list persists across reloads; settings respect the `MAX_LAPS` cap.
- [ ] Export produces a valid `.csv` with one row per lap.
- [ ] Widget scales cleanly from 4×5 to 8×8 via `widgetScaler`.
- [ ] `npm run check` passes cleanly.

## Out of scope for v1

Multi-stopwatch dashboards, lap labels / tagging, statistics (fastest/slowest/average), voice control, external timing integrations, paused-state resumption across reloads, and photo/video sync.
