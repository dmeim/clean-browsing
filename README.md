# NewTab PlusProMaxUltra

[![Version](https://img.shields.io/badge/version-0.1.0--beta-orange)](https://github.com/DimitriMeimaridis/newtab-pluspromaxultra/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/platform-Chrome%20Extension-brightgreen)](https://chromewebstore.google.com)

**The PRO PREMIUM MAXED-OUT ULTRA new tab experience** – A next-generation customizable new tab page for Chrome that puts you in complete control of your browsing dashboard.

## 🌟 Overview

NewTab PlusProMaxUltra is an open-source Chrome extension that transforms your new tab page into a powerful, customizable dashboard. Built around a flexible tile-based grid system, it offers unlimited customization while keeping all your data local and private.

### ✨ Key Highlights
- 🎯 **Zero Subscriptions** - Completely free and open source
- 🔒 **Privacy First** - All data stored locally, no external services
- 🎨 **Infinite Customization** - Personalize every aspect of your dashboard
- 🧩 **Extensible Widget System** - Modular architecture for future expansion
- ⚡ **Performance Optimized** - Lightweight with no external dependencies

## 🚀 Features

### 🏗️ **Advanced Grid System**
- **Dynamic 40x24 grid** with customizable dimensions
- **Drag & drop positioning** with precision controls
- **Smart resize handles** for perfect widget sizing
- **Visual grid overlay** for accurate placement

### 🎛️ **Widget Ecosystem**
| Widget Type | Features |
|-------------|----------|
| **🕒 Clock** | Multiple locales, 12/24h format, seconds display, flashing separators, DST support |
| **🔍 Search** | Google, Bing, DuckDuckGo, Yahoo + custom engines, multiple target options |

### 🎨 **Appearance Engine**
- **Background Customization**:
  - Solid colors with full color picker
  - Custom image uploads
  - Built-in gradient overlays
- **Typography Control**:
  - Auto-scaling text system
  - Font weight and style options
  - Color and opacity controls
- **Visual Effects**:
  - Glassmorphism blur effects
  - Customizable border radius
  - Opacity and padding controls
- **Inheritance System**: Global settings with per-widget overrides

### ⚙️ **Advanced Settings**
- **Import/Export**: Save and share configurations as JSON
- **Jiggle Mode**: Visual editing with handles and grid overlay
- **Real-time Preview**: See changes instantly
- **Container Queries**: Responsive scaling at all widget sizes

## 📦 Installation

### For Users
1. Download the latest release from [Releases](./releases/)
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `extension` folder
5. Open a new tab to start customizing!

### For Developers
```bash
git clone https://github.com/DimitriMeimaridis/newtab-pluspromaxultra.git
cd newtab-pluspromaxultra/extension
# Load the extension/ folder as an unpacked extension in Chrome
```

## 🛠️ Development

### Project Structure
```
extension/
├── newtab.html          # Main entry point
├── settings.js          # Settings management & persistence
├── widgets.js           # Widget system core
├── styles.css           # Complete styling system
├── widgets/             # Individual widget implementations
│   ├── clock-widget.js
│   └── search-widget.js
├── resources/           # Search engine logos & assets
└── manifest.json        # Chrome extension manifest
```

### Architecture
- **Modular Widget System**: Extensible plugin-like architecture
- **Zero Build Process**: Pure HTML/CSS/JavaScript
- **Local Storage**: All settings persisted locally
- **Container Queries**: Modern responsive design
- **Manifest V3**: Latest Chrome extension standards

### Adding New Widgets
Widgets are registered using the simple plugin system:
```javascript
registerWidget('mywidget', {
  name: 'My Widget',
  render: renderMyWidget,
  openConfig: openMyWidgetConfig
});
```

## 📋 Versioning

We follow semantic versioning with the format `x.y.z`:
- **x** - Major release (significant features or breaking changes)
- **y** - Minor/beta release (new features, improvements)
- **z** - Alpha/testing release (bug fixes, experimental features)

Current version: **v0.1.0-beta** (First public beta)

## 🗺️ Roadmap

- [ ] **Weather Widget** - Local weather with multiple providers
- [ ] **Bookmark Widget** - Visual bookmark management
- [ ] **Notes Widget** - Quick note-taking capabilities
- [ ] **RSS/News Widget** - Feed aggregation
- [ ] **Calendar Widget** - Event display and management
- [ ] **System Info Widget** - Browser and system statistics
- [ ] **Custom Widget Creator** - Visual widget builder

## 📝 Release Notes

Detailed release notes for each version can be found in the [releases](./releases/) directory.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:
- Code style and standards
- Pull request process
- Widget development guidelines
- Testing procedures

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web standards and Chrome Extension Manifest V3
- Inspired by the need for privacy-focused browser customization
- Community-driven development approach

---

**Ready to maximize your new tab experience?** Install NewTab PlusProMaxUltra and transform your browser into a personalized command center – with zero subscriptions and unlimited customization power.

[📥 Download Latest Release](./releases/) | [🐛 Report Issues](../../issues) | [💡 Request Features](../../issues)