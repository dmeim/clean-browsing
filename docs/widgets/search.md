# Search

A search bar that sends your query to Google, Bing, DuckDuckGo, Yahoo, or any custom URL template you provide. Drops you onto the engine's results page in whichever target window you prefer.

- **Widget ID:** `search`
- **Default size:** 8 × 2
- **Source:** [`src/lib/widgets/search/`](../../src/lib/widgets/search/)

## Usage

Add the Search widget from the **Add widget** menu in edit mode. Type a query and press **Enter** (or click the magnifier) to submit. The widget shows the logo of the selected engine on the left, a circular input in the middle, and a submit button on the right. Everything scales to fit the widget size.

The default engine is Google, opening results in a new tab. All of that is configurable.

## Settings

| Setting                | Type     | Default                              | What it does                                                                                                                  |
| ---------------------- | -------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Engine**             | dropdown | `Google`                             | Pick one of the built-in engines (Google, Bing, DuckDuckGo, Yahoo) or `Custom` to provide your own URL.                       |
| **Custom URL**         | text     | `https://www.google.com/search?q=%s` | URL template for `Custom` engine. `%s` or `%q` is replaced with the URL-encoded query. Used verbatim if `Custom` is selected. |
| **Custom image URL**   | text     | empty                                | Optional logo shown next to the input. Falls back to the built-in engine logo if left blank. Required for `Custom` engines.   |
| **Open results in**    | dropdown | `New tab`                            | Where the results page opens. Options: new tab, current tab, new window, private (incognito) window.                          |
| **Clear after search** | toggle   | `off`                                | When on, the input empties itself after you submit, so the widget is ready for the next query.                                |
| **Vertical padding**   | 0–80 px  | `8`                                  | Space between the input row and the top/bottom of the widget.                                                                 |
| **Horizontal padding** | 0–80 px  | `12`                                 | Space between the input row and the left/right of the widget.                                                                 |

### About the URL template

The `Custom URL` field works with either `%s` or `%q` as the query placeholder. For example:

- Kagi: `https://kagi.com/search?q=%s`
- Startpage: `https://www.startpage.com/do/search?q=%s`
- Ecosia: `https://www.ecosia.org/search?q=%s`
- GitHub code search: `https://github.com/search?type=code&q=%s`

The query is URL-encoded before substitution, so spaces and special characters are safe.

### About the target modes

- **New tab** — opens `window.open(url, "_blank")`. Works everywhere.
- **Current tab** — replaces the new-tab page with the results.
- **New window** — requests a 1024 × 768 window via the `browser.windows` API. Falls back to a new tab if the privileged API isn't available.
- **Private window** — same as New window but with `incognito: true`. Firefox will only honor this if the extension is allowed to run in private browsing (check `about:addons` → Clean Browsing → Run in Private Windows).

## Tips

- The logo height tracks the widget height, so if you want a smaller logo, use the horizontal/vertical padding sliders to push it inward.
- Leaving the engine on Google but changing **Custom URL** does nothing — the widget only reads the custom URL when engine is set to `Custom`.
- If you use the same engine all day, turn on **Clear after search** so each new search starts from an empty bar instead of whatever you typed last.
