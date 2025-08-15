# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension that provides a customizable new tab page with a tile-based grid layout system. The extension is built with vanilla HTML, CSS, and JavaScript - no build process or framework dependencies.

## Architecture

The codebase follows a modular architecture with clear separation of concerns. For detailed architectural information, see the comprehensive [Documentation](docs/README.md).

**Core Files:**
- **`newtab.html`** - Main entry point that defines the DOM structure
- **`settings.js`** - Global settings management and persistence layer
- **`widgets.js`** - Core widget system and grid management
- **`styles.css`** - Complete styling with glassmorphism design system
- **`widgets/`** - Individual widget implementations (separate files)

**Documentation:**
- **[`docs/STYLING_GUIDE.md`](docs/STYLING_GUIDE.md)** - Complete design system and CSS patterns
- **[`docs/WIDGET_DEVELOPMENT.md`](docs/WIDGET_DEVELOPMENT.md)** - Widget creation guide and templates
- **[`docs/COMPONENT_RULES.md`](docs/COMPONENT_RULES.md)** - Architecture patterns and conventions
- **[`docs/UI_BEHAVIOR.md`](docs/UI_BEHAVIOR.md)** - Interaction patterns and UX standards

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

For detailed development workflows and patterns, refer to:
- **Widget Development**: See [`docs/WIDGET_DEVELOPMENT.md`](docs/WIDGET_DEVELOPMENT.md)
- **Styling Patterns**: See [`docs/STYLING_GUIDE.md`](docs/STYLING_GUIDE.md) 
- **Architecture Rules**: See [`docs/COMPONENT_RULES.md`](docs/COMPONENT_RULES.md)
- **UI Behaviors**: See [`docs/UI_BEHAVIOR.md`](docs/UI_BEHAVIOR.md)

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

### Quick Reference
- **Location**: `widgets/{widget-name}-widget.js` (kebab-case with `-widget.js` suffix)
- **HTML Integration**: Add `<script src="widgets/{widget-name}-widget.js"></script>` to `newtab.html` after `widgets.js`
- **Required Functions**: `render{Name}Widget()`, `open{Name}Config()`, `add{Name}Widget()`, `registerWidget()` call

### Complete Development Guide
For comprehensive widget development instructions, templates, and best practices, see:
**[`docs/WIDGET_DEVELOPMENT.md`](docs/WIDGET_DEVELOPMENT.md)**

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