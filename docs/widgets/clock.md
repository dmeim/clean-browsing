# Clock

Displays the current time, updated every second. Text auto-scales to fill whatever area the widget occupies, so resizing the widget also resizes the clock face.

- **Widget ID:** `clock`
- **Default size:** 4 × 2 (width × height in grid cells)
- **Source:** [`src/lib/widgets/clock/`](../../src/lib/widgets/clock/)

## Usage

Add the Clock from the **Add widget** menu in edit mode. It will immediately start displaying the current local time. There is nothing to configure to get a working clock — the defaults give you a 12-hour display with seconds and AM/PM, using the browser's locale.

Because the text auto-fits the widget, a 4 × 2 widget gives you a small clock and a 12 × 4 widget gives you a giant one. Padding lets you pull the digits away from the widget edges without resizing the widget itself.

## Settings

| Setting               | Type    | Default  | What it does                                                                                                                 |
| --------------------- | ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **24-hour format**    | toggle  | `off`    | When on, shows the time as `14:32:07`. When off, shows `2:32:07 PM`.                                                         |
| **Show seconds**      | toggle  | `on`     | Appends the seconds field (`:07`). Turn off for a minute-precision clock that only repaints once a minute.                   |
| **Show AM/PM**        | toggle  | `on`     | Only visible in 12-hour mode. When off, the suffix is hidden but the hour is still shown on a 12-hour base.                  |
| **Flashing separator** | toggle  | `off`    | When on, the `:` between hours/minutes blinks once per second like a classic digital clock. Purely cosmetic.                 |
| **Use daylight savings** | toggle | `on`     | Honors DST for the active locale. Turn off to pin the clock to standard time year-round.                                    |
| **Locale**            | text    | `auto`   | BCP-47 tag like `en-US`, `de-DE`, `ja-JP`, `fr-FR`. Blank or `auto` uses your browser's language so formatting follows the OS. |
| **Vertical padding**  | 0–80 px | `0`      | Space between the clock text and the top/bottom of the widget.                                                               |
| **Horizontal padding** | 0–80 px | `0`      | Space between the clock text and the left/right of the widget.                                                               |

## Tips

- For a minimal clock, turn off seconds and AM/PM, and use the 24-hour format. The widget will then look identical to a system menu-bar clock.
- If you change your OS language, the clock picks it up automatically as long as **Locale** is set to `auto`.
- The flashing separator is synced to the second tick, so enabling it implicitly enables the once-per-second repaint even when seconds are hidden.
