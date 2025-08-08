# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension that provides a customizable new tab page with a tile-based grid layout system. The extension is built with vanilla HTML, CSS, and JavaScript - no build process or framework dependencies.

## Architecture

The codebase follows a modular architecture with clear separation of concerns:

- **`newtab.html`** - Main entry point that defines the DOM structure for the new tab page
- **`settings.js`** - Handles all settings management, background customization, grid configuration, and import/export functionality. Defines the global `settings` object and persistence layer
- **`widgets.js`** - Manages widget lifecycle, rendering, positioning, and user interactions. Depends on `settings.js` being loaded first
- **`styles.css`** - Complete styling including glassmorphism effects, animations, and responsive grid system

## Key Components

### Settings System
- All configuration stored in localStorage as JSON
- Default settings defined in `settings.js` with clock widget and 4x4 grid
- Settings include background (color/image), grid dimensions, and widget configurations
- Import/export supports both text and file formats

### Widget System
- Widgets are JSON objects with position (x, y), size (w, h), type, and settings
- Currently supports clock widgets with customizable locale, time format, and display options
- Widget editing requires "jiggle mode" which enables drag-drop positioning and resize handles
- New widgets added through the widgets panel modal

### Grid Layout
- CSS Grid-based system with dynamic column/row counts
- Grid dimensions controlled by `--cols` and `--rows` CSS custom properties
- Widgets positioned using `grid-column` and `grid-row` spanning

## Development Workflow

### Testing the Extension
1. Open Chrome and navigate to `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked" and select the `extension/` folder
4. Open a new tab to test changes

### File Loading Order
Scripts must be loaded in this order in `newtab.html`:
1. `settings.js` (defines global settings, loadSettings, saveSettings functions)
2. `widgets.js` (depends on settings object and DOM elements)

### Common Development Tasks

**Adding New Widget Types:**
- Extend the `renderWidgets()` function in `widgets.js`
- Add corresponding render function (like `renderClockWidget`)
- Update `buildWidgetList()` and add configuration function
- Add default settings to `defaultSettings.widgets` in `settings.js`

**Modal/Panel Management:**
- Panels use `.hidden` class for visibility
- Settings panel slides in from right
- Widgets panel appears as centered modal
- Always pair panel visibility with corresponding button visibility

### Critical Dependencies

- The `widgetGrid` variable must be defined in `widgets.js` for grid operations
- Settings panel tabs require `data-tab` attributes matching `*-tab` element IDs
- Widget drag-and-drop requires `dataset.index` attributes on widget containers

## Extension Metadata

- Manifest V3 Chrome extension
- Overrides the new tab page via `chrome_url_overrides.newtab`
- No special permissions required - purely local functionality
- Version managed in `manifest.json`

### Versioning Scheme
The extension follows semantic versioning with the format `x.y.z`:
- **x** - Major release (significant feature additions or breaking changes)
- **y** - Minor/beta release (new features, improvements)
- **z** - Alpha/testing release (bug fixes, experimental features)

**IMPORTANT: Always increment the version in `manifest.json` whenever making code changes to the extension.**