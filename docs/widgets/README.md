# Widgets

User-facing documentation for every widget that ships with Clean Browsing, plus any widgets still in development. Each page describes what the widget does, how to add it to your grid, and every setting it exposes.

For the developer-facing "how do I build a new widget" walkthrough, see [`../WIDGET_DEVELOPMENT.md`](../WIDGET_DEVELOPMENT.md).

## Shipping widgets

| Widget                       | ID           | Default size | Summary                                                 |
| ---------------------------- | ------------ | ------------ | ------------------------------------------------------- |
| [Clock](./clock.md)          | `clock`      | 4 × 2        | Current time with configurable format and locale       |
| [Date](./date.md)            | `date`       | 4 × 2        | Current date formatted with a Day.js pattern            |
| [Search](./search.md)        | `search`     | 8 × 2        | Search bar targeting Google, Bing, DuckDuckGo, or custom |
| [Calculator](./calculator.md) | `calculator` | 4 × 6        | Basic calculator with optional history                  |
| [Picture](./picture.md)      | `picture`    | 4 × 4        | Custom image from the shared image library              |

## In development

These are design documents for widgets that are planned or at the brainstorming stage. None of them ship yet, and everything on these pages is provisional — scope, settings, and even whether a given widget lands at all are open questions. Each page flags the open design decisions that need to be resolved before implementation starts.

| Widget                                   | Status     | Notes                                                                             |
| ---------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| [Notes](./wip-notes.md)                  | ⭕ Planned | Sticky-note editor with auto-save. Plain-text v1, rich text deferred.             |
| [Timer](./wip-timer.md)                  | 💡 Idea    | Countdown timer with presets and browser notifications.                           |
| [Stopwatch](./wip-stopwatch.md)          | ⭕ Planned | Precision up-timer with lap history and CSV export.                               |
| [To-Do / Reminder](./wip-todo.md)        | ⭕ Planned | Per-widget task list with due dates, priority, and opt-in notifications.          |
| [Weather](./wip-weather.md)              | ⭕ Planned | Open-Meteo-based weather. Makes network calls — opt-in and disclosed in settings. |
| [Mini-Sites](./wip-mini-sites.md)        | ⭕ Planned | Iframe embed of an external URL; gracefully handles unembeddable sites.           |
| [Embeds](./wip-embeds.md)                | ⭕ Planned | Paste-an-embed-snippet widget (YouTube, Twitter, etc.) with sanitization.         |
| [Ping Monitor](./wip-ping-monitor.md)    | ⭕ Planned | HTTP health check with sparkline. Makes network calls by design.                  |

### Widgets that make network calls

Clean Browsing is local-first **by default**, but widgets whose core function requires network access (Weather, Ping Monitor, Embeds, Mini-Sites) are allowed to make HTTP requests under a consistent set of rules:

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
