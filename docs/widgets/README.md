# Widgets

User-facing documentation for every widget that ships with Clean Browsing, plus any widgets still in development. Each page describes what the widget does, how to add it to your grid, and every setting it exposes.

For the developer-facing "how do I build a new widget" walkthrough, see [`../WIDGET_DEVELOPMENT.md`](../WIDGET_DEVELOPMENT.md).

## Shipping widgets

| Widget                            | ID                | Default size | Summary                                                                |
| --------------------------------- | ----------------- | ------------ | ---------------------------------------------------------------------- |
| [Clock](./clock.md)               | `clock`           | 4 × 2        | Current time with configurable format and locale                       |
| [Date](./date.md)                 | `date`            | 4 × 2        | Current date formatted with a Day.js pattern                           |
| [Search](./search.md)             | `search`          | 8 × 2        | Search bar targeting Google, Bing, DuckDuckGo, Yahoo, or custom        |
| [Calculator](./calculator.md)     | `calculator`      | 4 × 6        | Basic calculator with optional history                                 |
| [Picture](./picture.md)           | `picture`         | 4 × 4        | Custom image from the shared image library                             |
| [Weather](./weather.md)           | `weather`         | 6 × 4        | Current conditions and forecast from Open-Meteo (opt-in HTTP)          |
| [Timer](./timer.md)               | `timer`           | 4 × 4        | Countdown timer with presets, progress ring, and OS alerts             |
| [Stopwatch](./stopwatch.md)       | `stopwatch`       | 4 × 5        | Precision stopwatch with lap timing and CSV export                     |
| [Notes](./notes.md)               | `notes`           | 6 × 4        | Markdown sticky-note with interactive task checkboxes                  |
| [Ping Monitor](./ping-monitor.md) | `ping-monitor`    | 2 × 2        | Single-endpoint HTTP health checks with response time and uptime stats |
| [Stock](./stock.md)               | `stock`           | 4 × 4        | Single-ticker price + chart + stats — stocks, ETFs, and crypto         |
| [Watchlist](./stock-watchlist.md) | `stock-watchlist` | 4 × 6        | Multi-ticker table with sparklines — stocks, ETFs, and crypto          |

## In development

These are design documents for widgets that are planned or at the brainstorming stage. None of them ship yet, and everything on these pages is provisional — scope, settings, and even whether a given widget lands at all are open questions. Each page flags the open design decisions that need to be resolved before implementation starts.

| Widget                            | Status                    | Notes                                                                      |
| --------------------------------- | ------------------------- | -------------------------------------------------------------------------- |
| [Pomodoro](./wip-pomodoro.md)     | :red_circle: Planned      | Focus-session timer with work/break cycles, built on Timer patterns.       |
| [Links](./wip-links.md)           | :red_circle: Planned      | Curated quick-access link grid with favicons and optional grouping.        |
| [Countdown](./wip-countdown.md)   | :red_circle: Planned      | Countdown to a specific date/event with multiple display styles.           |
| [Quote](./wip-quote.md)           | :red_circle: Planned      | Rotating quote display with bundled collection and user customization.     |
| [Converter](./wip-converter.md)   | :red_circle: Planned      | Unit and currency converter — offline units, opt-in exchange rates.        |
| [Group](./wip-group.md)           | :red_circle: Planned      | Container widget with collapse/expand; holds other widgets in a mini-grid. |
| [Mini-Sites](./wip-mini-sites.md) | :zzz: Deferred            | Iframe embed of an external URL; gracefully handles unembeddable sites.    |
| [Embeds](./wip-embeds.md)         | :zzz: Deferred            | Paste-an-embed-snippet widget (YouTube, Twitter, etc.) with sanitization.  |
| [To-Do / Reminder](./wip-todo.md) | :no_entry_sign: Cancelled | Superseded by Notes widget (v1.4.0); see doc for details.                  |

### Widgets that make network calls

Clean Browsing is local-first **by default**, but widgets whose core function requires network access (Weather, Ping Monitor, Stock, Watchlist, and future Embeds / Mini-Sites) are allowed to make HTTP requests under a consistent set of rules:

1. **Opt-in.** A freshly-added widget must not fire a network call before the user has configured it. The user has to enter a URL, pick a location, or paste an embed snippet first.
2. **Disclosed.** The settings dialog for any network-using widget shows a clear notice naming the host(s) the widget will contact and the rough frequency.
3. **Scoped permissions.** Host permissions in `public/manifest.json` are added only when a specific widget actually needs them. Wildcards like `"<all_urls>"` are not acceptable.
4. **Privacy policy.** `docs/PRIVACY_POLICY.md` is updated to list every host the extension can contact and which widget is responsible.
5. **No baseline traffic.** Toolbar, dialogs, settings, and styling never make network calls. The fingerprint of "nothing on the grid → zero outbound traffic" is preserved.

Widgets in `../ROADMAP.md` that aren't on this list don't have a design doc yet.

## Adding, configuring, and removing widgets

The grid lives on your new tab page. All grid editing happens in **edit mode**:

1. Click the **pencil** icon in the toolbar to enter edit mode.
2. Click **Add widget** to pick from the list above. The new widget is placed in the first free spot using its default size.
3. Drag a widget by its body to move it; drag the bottom-right handle to resize.
4. Click the **gear** icon on a widget to open its settings dialog. The options on that dialog are what each page here documents.
5. Click the **trash** icon on a widget to remove it. Layout changes are saved to `browser.storage.local` automatically.
6. Click the pencil icon again (or press `Escape`) to leave edit mode.

Global widget chrome — background, border, radius, blur, shadow, opacity — is controlled from the global **Settings** dialog and applies to every widget unless a per-widget override is set. This is separate from the per-widget settings documented on each page.
