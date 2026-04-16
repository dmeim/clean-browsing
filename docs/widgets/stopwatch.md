# Stopwatch

A precision stopwatch with lap timing, an optional click sound on lap, and CSV export of the full lap history. Elapsed time is computed from a stored `Date.now()` anchor on every render frame, so there is no drift and a running stopwatch survives page reloads.

- **Widget ID:** `stopwatch`
- **Default size:** 4 × 5 (width × height in grid cells)
- **Source:** [`src/lib/widgets/stopwatch/`](../../src/lib/widgets/stopwatch/)

## Permissions

None. Stopwatch uses only `storage`, which is already present for every widget. It makes no network requests.

## Usage

1. Add **Stopwatch** from the **Add widget** menu in edit mode.
2. Press the primary **Start** button to begin counting up.
3. Press the **Lap** button (flag icon) while running to record a split. Laps append to a scrollable history inside the widget.
4. Press the primary button again to **Pause**. Press once more to **Resume** — the elapsed time continues from where you paused.
5. Press **Reset** (counter-clockwise arrow) to return the elapsed time to zero. Reset only clears the counter; the lap history is kept until you clear it from the settings dialog.

A running or paused stopwatch survives a page reload: the widget persists its state into `browser.storage.local` and rehydrates on mount. Close and reopen the new tab, restart Firefox — the elapsed time and lap history all come back intact.

## Settings

| Setting                   | Type                       | Default | What it does                                                                                                                                             |
| ------------------------- | -------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Precision**             | segmented: ms / cs / s     | `cs`    | Controls how many fractional digits the elapsed time shows. `ms` = milliseconds, `cs` = centiseconds (two digits), `s` = whole seconds.                  |
| **Max laps shown**        | number (0–200)             | `10`    | How many laps render inside the widget at once. `0` shows the full history. Only affects rendering — the stored history is always capped at 200 entries. |
| **Show splits**           | toggle                     | `on`    | When on, each lap shows the delta from the previous lap (the split). When off, each lap shows the cumulative total at the moment it was recorded.        |
| **Sound feedback on Lap** | toggle                     | `off`   | Synthesized click via the Web Audio API when the Lap button is pressed. Handy for hands-free use where you want audible confirmation without looking.    |
| **Lap history**           | Export CSV / Clear history | —       | Export downloads the full lap history (up to 200 entries) as a CSV with `index,split_ms,total_ms,recorded_at_iso` columns. Clear wipes the stored laps.  |
| **Vertical padding**      | 0–80 px                    | `8`     | Space between the widget content and its top/bottom edges.                                                                                               |
| **Horizontal padding**    | 0–80 px                    | `8`     | Space between the widget content and its left/right edges.                                                                                               |

**Clear history** is a two-step confirm: the first click arms the button, the second click within three seconds actually clears. There is no undo.

## Tips

- The display uses `font-variant-numeric: tabular-nums`, so digits don't jitter as they change — handy when you want to read a precise value mid-run.
- If you want a pure stopwatch with no history, set **Max laps shown** to `10` and just never press Lap.
- The CSV export is newest-last (sorted by index ascending), so the rows read chronologically even though the in-widget list shows newest-first.
- Laps are capped at 200 entries in the settings blob; if you exceed that, the oldest laps are dropped. Export first if you need to keep them.

## Out of scope (today)

Per-lap labels or tagging, summary statistics (fastest / slowest / average), multi-stopwatch dashboards, and external timing integrations are not implemented. Keep it lean; add widgets for what you need.
