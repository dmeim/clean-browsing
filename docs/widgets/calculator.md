# Calculator

A simple four-function calculator with optional history. Supports both mouse clicks and full keyboard input.

- **Widget ID:** `calculator`
- **Default size:** 4 × 6
- **Source:** [`src/lib/widgets/calculator/`](../../src/lib/widgets/calculator/)

## Usage

Add the Calculator from the **Add widget** menu in edit mode. It supports addition, subtraction, multiplication, and division. Use **C** to clear, **⌫** to backspace, and **=** (or **Enter**) to evaluate.

When keyboard support is enabled (the default), clicking anywhere on the widget body gives it focus, and the following keys work:

| Key             | Action            |
| --------------- | ----------------- |
| `0`–`9`, `.`    | Enter digit       |
| `+` `-` `*` `/` | Select operator   |
| `Enter` or `=`  | Evaluate          |
| `Backspace`     | Delete last digit |
| `Escape`        | Clear             |

Division by zero displays `0` rather than crashing — results that would be `NaN` or `Infinity` display `Error`. Numeric results are rounded to 10 decimal places to keep the display tidy.

## History

When **History** is enabled, every completed calculation is appended to a local history list (up to 50 entries). Click the small clock icon in the top-right of the display to open the history drawer, then click any entry to load its result back into the display.

History is stored inside the widget's settings, which means:

- It persists across sessions via `browser.storage.local`.
- It's per-instance — two Calculator widgets keep separate histories.
- Turning **History** off does not delete previously recorded entries; it only stops new ones from being added and hides the drawer. Use the **Clear** button inside the drawer to erase them permanently.

## Settings

| Setting                | Type    | Default | What it does                                                                                                          |
| ---------------------- | ------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| **Keyboard support**   | toggle  | `on`    | Enables the keyboard shortcuts listed above. When off, only mouse/touch input works and the widget never traps focus. |
| **Round buttons**      | toggle  | `on`    | When on, keys are circular. When off, keys are rounded squares. Purely cosmetic.                                      |
| **Color operators**    | toggle  | `on`    | Tints the `+ − × ÷` keys orange so they stand out from number keys.                                                   |
| **Color equals**       | toggle  | `on`    | Tints the `=` key green.                                                                                              |
| **Color clear**        | toggle  | `on`    | Tints the `C` key red.                                                                                                |
| **History**            | toggle  | `on`    | Records completed calculations and exposes the history drawer. Capped at 50 entries.                                  |
| **Vertical padding**   | 0–80 px | `8`     | Space between the keypad and the top/bottom of the widget.                                                            |
| **Horizontal padding** | 0–80 px | `8`     | Space between the keypad and the left/right of the widget.                                                            |

## Tips

- The keypad scales to whatever size you give the widget, but a 4 × 6 minimum is recommended — smaller than that and the keys start overlapping.
- If you want a minimalist calculator, turn off all three color toggles and the flat-button style (round off) to get a uniform keypad.
- For a "no distractions" calculator, turn off **History**: the clock icon in the corner disappears and the display becomes a single line.
