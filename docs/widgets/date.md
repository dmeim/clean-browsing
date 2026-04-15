# Date

Displays the current date using a format string you control. The rendered text auto-scales to fill the widget, so the same widget works equally well as a small sidebar date or a large hero banner.

- **Widget ID:** `date`
- **Default size:** 4 × 2
- **Source:** [`src/lib/widgets/date/`](../../src/lib/widgets/date/)

## Usage

Add the Date widget from the **Add widget** menu in edit mode. By default it shows the current date as `YYYY-MM-DD` (ISO). Open the widget's settings to pick a different format — you get a live preview of what the format will render before you close the dialog.

Internally the widget uses [Day.js](https://day.js.org/docs/en/display/format) with the `advancedFormat` plugin, so every token listed in the Day.js documentation is supported, including ordinal helpers like `Do`.

## Settings

| Setting               | Type    | Default        | What it does                                                                                                |
| --------------------- | ------- | -------------- | ----------------------------------------------------------------------------------------------------------- |
| **Format string**     | text    | `YYYY-MM-DD`   | A Day.js format pattern. The settings dialog shows a live preview and turns red when the pattern is invalid. |
| **Quick examples**    | buttons | —              | One-click presets for ISO, US, long-form, ordinal, and "with literal text" formats. Clicking one fills in the format string. |
| **Vertical padding**  | 0–80 px | `0`            | Space between the date text and the top/bottom of the widget.                                               |
| **Horizontal padding** | 0–80 px | `0`            | Space between the date text and the left/right of the widget.                                               |

## Format reference

Common tokens you'll reach for:

| Token  | Meaning                     | Example    |
| ------ | --------------------------- | ---------- |
| `YYYY` | 4-digit year                | `2026`     |
| `MM`   | Zero-padded month (01–12)   | `04`       |
| `MMM`  | Short month name            | `Apr`      |
| `MMMM` | Full month name             | `April`    |
| `DD`   | Zero-padded day (01–31)     | `15`       |
| `Do`   | Day with ordinal suffix     | `15th`     |
| `ddd`  | Short weekday               | `Wed`      |
| `dddd` | Full weekday                | `Wednesday` |
| `HH`   | 24-hour                     | `14`       |
| `h`    | 12-hour                     | `2`        |
| `mm`   | Minutes                     | `32`       |
| `A`    | AM/PM                       | `PM`       |

Wrap literal text in square brackets so Day.js doesn't try to interpret it as a token — `[Today is] dddd` renders as `Today is Wednesday`.

## Tips

- Use the **Clock** widget for the time and the **Date** widget for the date; keeping them split lets you resize each independently.
- If you want a date that reads like a sentence, use a format such as `[Today is] dddd, MMMM Do YYYY`.
- The preview in the settings dialog always reflects "right now", so a format like `HH:mm:ss` will be frozen at the moment you open the dialog — for live seconds, use the Clock widget instead.
