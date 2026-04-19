<p align="center">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="public/branding/banner-png-transparent/banner-color-white-transparent.png"
    />
    <img
      src="public/branding/banner-png-transparent/banner-color-black-transparent.png"
      alt="Clean Browsing"
      width="640"
    />
  </picture>
</p>

<p align="center">
  <a href="https://github.com/dmeim/clean-browsing/releases"><img src="https://img.shields.io/badge/version-1.6.1-blue" alt="Version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
  <a href="https://github.com/dmeim/clean-browsing"><img src="https://img.shields.io/badge/platform-Firefox%20Extension-orange" alt="Firefox Extension" /></a>
  <a href="src/"><img src="https://img.shields.io/badge/stack-Svelte%205%20%C2%B7%20Vite%20%C2%B7%20TS%20%C2%B7%20Tailwind%20v4-ff3e00" alt="Stack" /></a>
  <a href="docs/CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" /></a>
</p>

**A customizable new tab page for Firefox** — a grid of draggable, resizable widgets, built as a Manifest V2 extension. Everything lives locally; there are no subscriptions, accounts, or external services. Built with **Svelte 5 (runes)**, **Vite**, **TypeScript**, **Tailwind v4**, and **shadcn-svelte**.

## ✨ Highlights

- 🧩 **Widget grid** — drag, resize, and configure widgets on a 24×16 cell layout
- 🎛️ **Edit mode** — jiggle-style edit with free-flight drag (widgets float over each other; placement is validated on drop)
- 🔒 **Local-first** — layout and settings persist via `browser.storage.local` (falls back to `localStorage` in dev)
- 🧱 **Component library** — shadcn-svelte + bits-ui primitives, styled with Tailwind v4
- ⚡ **Fast feedback loop** — `vite build --watch` + `web-ext run` for live Firefox reloads

## 🧩 Supported Widgets

| Widget              | Description                                                                | Default size |
| ------------------- | -------------------------------------------------------------------------- | ------------ |
| 🕒 **Clock**        | Locale-aware time, 12/24h, seconds, AM/PM                                  | 4×2          |
| 📅 **Date**         | Day.js formatted date with customizable format                             | 4×2          |
| 🔍 **Search**       | Multi-engine search bar with Google, Bing, DDG, Yahoo, or custom           | 8×2          |
| 🧮 **Calculator**   | Simple calculator with keyboard support and history                        | 4×6          |
| 🖼️ **Picture**      | User-supplied image tile from the shared image library                     | 4×4          |
| 🌤️ **Weather**      | Current conditions + forecast from Open-Meteo (opt-in HTTP)                | 6×4          |
| ⏲️ **Timer**        | Countdown with presets, progress ring/bar, and notifications               | 4×4          |
| ⏱️ **Stopwatch**    | Precision stopwatch with lap timing and CSV export                         | 4×5          |
| 📝 **Notes**        | Markdown sticky-note with interactive task checkboxes                      | 6×4          |
| 📡 **Ping Monitor** | Single-endpoint health check with response time and uptime                 | 2×2          |
| 📈 **Stock**        | Single-ticker price, chart, and stats for stocks, ETFs, and crypto         | 4×4          |
| 📊 **Watchlist**    | Multi-ticker table with prices and sparklines for stocks, ETFs, and crypto | 4×6          |

Full per-widget docs live in [docs/widgets](docs/widgets/README.md). More widgets are on the [roadmap](docs/ROADMAP.md).

## 🚀 Quick Start

1. Download the latest `clean_browsing-*.xpi` (or `.zip`) from the [**Releases** page](https://github.com/dmeim/clean-browsing/releases/latest).
2. In Firefox, open `about:addons` → gear icon → **Install Add-on From File…** → pick the downloaded `.xpi`.
3. Open a new tab. Use the toolbar's ✎ button to toggle edit mode and drop in widgets.

> Unsigned builds may require `xpinstall.signatures.required = false` in `about:config`, or use Firefox Developer Edition / Nightly.

### Advanced: Build from source

Prefer to build it yourself? Clone the repo and load it as a temporary add-on:

```bash
git clone https://github.com/dmeim/clean-browsing.git
cd clean-browsing
npm install
npm run build
```

Then open `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → pick `dist/manifest.json`.

## 📚 Documentation

- **[Developer Setup](docs/DEVELOPER.md)** — local build, project structure, architecture overview
- **[Developer Guide](docs/README.md)** — stack overview and deep-dive
- **[Widget Docs](docs/widgets/README.md)** — user-facing widget list, usage, and settings
- **[Widget Development](docs/WIDGET_DEVELOPMENT.md)** — how to build a new widget
- **[Styling Guide](docs/STYLING_GUIDE.md)** — Tailwind v4 and design tokens
- **[Component Rules](docs/COMPONENT_RULES.md)** — Svelte 5 patterns and conventions
- **[UI Behavior](docs/UI_BEHAVIOR.md)** — edit mode, drag/resize, dialogs
- **[Roadmap](docs/ROADMAP.md)** — what's planned next
- **[Release Notes](docs/release-notes/)**

## 🤝 Contributing

PRs welcome. See [CONTRIBUTING.md](docs/CONTRIBUTING.md).

## 📄 License

MIT — see [LICENSE](LICENSE).
