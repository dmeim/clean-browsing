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

## Release Preparation Procedures

When the user asks for release preparation (major, beta, or alpha), follow these steps:

### 1. Release Notes Creation
- Create a new release notes file in the `releases/` directory
- Use the format `vX.Y.Z.md` matching the version number
- Include comprehensive feature list, changes, and technical specifications
- Document all user-facing features and capabilities
- Add installation instructions and what's next section

### 2. Documentation Updates
- Update the main `README.md` with:
  - Current version badges and links
  - Professional project description and overview
  - Feature highlights with emojis and formatting
  - Installation instructions for users and developers
  - Project structure and architecture overview
  - Roadmap and contribution guidelines
  - Professional GitHub presentation standards

### 3. Version Management
- Update `manifest.json` to the new release version
- Ensure version consistency across all documentation
- Follow semantic versioning principles strictly

### 4. Project Presentation Standards
- Use consistent emoji usage and professional formatting
- Include badges for version, license, and platform
- Maintain clear section headers and organized content
- Ensure all links and references are functional
- Keep documentation comprehensive but readable

### 5. Release Checklist
- [ ] Release notes created with full feature documentation
- [ ] README.md updated with professional presentation
- [ ] manifest.json version updated
- [ ] All documentation cross-references updated
- [ ] Project structure clearly documented
- [ ] Installation instructions verified
- [ ] Links and badges functional

## Widget Architecture Rules

**IMPORTANT: Every new widget MUST have its own separate JavaScript file in the `widgets/` directory.**

### Widget File Structure
- **Location**: `widgets/{widget-name}-widget.js`
- **Naming**: Always use kebab-case with `-widget.js` suffix
- **Examples**: 
  - `widgets/clock-widget.js`
  - `widgets/calculator-widget.js` 
  - `widgets/search-widget.js`

### Required Widget Structure
Each widget file must contain:
1. **registerWidget()** call with name, render function, and openConfig function
2. **render{WidgetName}Widget()** function that creates the widget UI
3. **setup{WidgetName}Logic()** function for widget-specific functionality (if needed)
4. **open{WidgetName}Config()** function for configuration UI
5. **add{WidgetName}Widget()** function to create new widget instances

### HTML Integration
- **ALL widget files must be loaded in `newtab.html`** after `widgets.js`
- Add script tag: `<script src="widgets/{widget-name}-widget.js"></script>`
- **Load order**: widgets.js → individual widget files → other scripts

### Widget Development Workflow
1. Create new `widgets/{name}-widget.js` file
2. Add script tag to `newtab.html` 
3. Follow existing widget patterns for consistency
4. Test widget registration and functionality
5. Never put widget code directly in `widgets.js`

## Version Management Rules

**IMPORTANT: Only increment alpha versions unless explicitly told otherwise.**

### Version Format: `X.Y.Z`
- **X** = Major release (breaking changes, significant features)
- **Y** = Beta release (new features, improvements) 
- **Z** = Alpha release (bug fixes, small features, iterations)

### Version Increment Rules
- **Default**: Always increment Z (alpha) by +1 for any changes
- **Beta (Y)**: Only when explicitly told "this is a beta release"
- **Major (X)**: Only when explicitly told "this is a major release"
- **Never assume** version increments beyond alpha

### Current Version Policy
- **Alpha increments**: 0.1.5 → 0.1.6 → 0.1.7 (normal workflow)
- **Beta increments**: Only when user says "make this beta 2" → 0.2.0
- **Major increments**: Only when user says "make this version 1" → 1.0.0