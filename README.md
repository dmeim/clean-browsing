# newtab-pluspromaxultra

An open-source, next-generation new tab page for Chrome that aims to rival leading customizable dashboards while remaining entirely local and extensible.

## Vision
`newtab-pluspromaxultra` is built around a **tile-based grid layout**. Each tile hosts a widget, and widgets can be arranged, resized and configured to create a completely personal dashboard. Everything is stored locally and expressed as JSON so settings can be backed up, shared or modified by hand with ease.

## Features
- **Widgets everywhere** – search bars, links, weather, clocks, news feeds and more are all widgets. Users can create their own widgets and share them as JSON snippets.
- **Drag-and-drop grid** – arrange widgets on an intuitive grid of tiles to craft your own layout.
- **Custom backgrounds** – set a single image, cycle through images from albums or provide URLs for dynamic backgrounds.
- **Purely local** – no subscriptions, no backend infrastructure. The extension reads and writes JSON configuration on the user's machine.
- **Extensible defaults** – ships with a set of default widgets in JSON that can be tweaked or replaced entirely.

## Philosophy
The project embraces privacy and flexibility. All configuration is kept locally, and the widget system allows power users to exchange JSON configurations to extend or remix the default setup. If a widget needs external data (like weather or news), it fetches it directly from the web without passing through any server controlled by this project.

## Status
This repository is the starting point. More documentation, code and widgets will follow as the project evolves.

## Development

The extension code lives in the `extension/` directory. To try it out:

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension` folder.
4. Open a new tab to see the clock widget.

---
Bring unlimited power to your browser – *maximized pro-level ultra-ness* with zero subscriptions.
