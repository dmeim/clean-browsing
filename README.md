# Clean NewTab

[![Version](https://img.shields.io/badge/version-0.4.0-blue)](https://github.com/DimitriMeimaridis/clean-newtab/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/platform-Chrome%20Extension-brightgreen)](https://chromewebstore.google.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**A clean, customizable new tab experience** – Transform your new tab into a powerful, customizable dashboard with zero subscriptions and unlimited personalization.

## 🌟 Overview

A privacy-first Chrome extension that replaces your new tab page with a flexible tile-based grid system and revolutionary browser sidepanel. Built with vanilla web technologies, offering complete customization while keeping all your data local.

### ✨ Key Highlights
- 🎯 **Zero Subscriptions** - Completely free and open source
- 🔒 **Privacy First** - All data stored locally, no external services  
- 🌐 **Universal Sidepanel** - Embed ANY website with advanced iframe technology
- 🎨 **Infinite Customization** - Personalize every aspect of your dashboard
- 🧩 **Extensible Widgets** - Calculator, clock, search, date, and more
- ⚡ **Performance Optimized** - Lightweight with no external dependencies

## 🚀 Current Features

### 🎛️ **Available Widgets**
| Widget | Description | Size | Documentation |
|--------|-------------|------|---------------|
| **🕒 Clock** | Real-time clock with locale & format options | 4×3 | [Details](docs/features/clock-widget.md) |
| **🧮 Calculator** | Full-featured calculator with keyboard support | 4×5 | [Details](docs/features/calculator-widget.md) |
| **🔍 Search** | Multi-engine search with custom targeting | 6×2 | [Details](docs/features/search-widget.md) |
| **📅 Date** | Day.js powered date display with unlimited formats | 4×2 | [Details](docs/features/date-widget.md) |

### 🏗️ **Core Capabilities**
- **40×24 Grid System** - Drag & drop positioning with visual overlay
- **Universal Sidepanel** - Embed ANY website with advanced header stripping
- **Glassmorphism Design** - Modern blur effects and transparency
- **Global Appearance** - Unified styling with per-widget overrides  
- **Import/Export** - Save and share configurations as JSON
- **Responsive Scaling** - Container queries for all widget sizes

📋 **[View All Features & Roadmap](docs/features/README.md)**

## 📦 Quick Start

### 5-Minute Setup
1. **Download**: Get the latest release from [Releases](./releases/)
2. **Install**: Load unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked → select `extension` folder)
3. **Customize**: Open new tab and start adding widgets!

### For Developers
```bash
git clone https://github.com/DimitriMeimaridis/clean-newtab.git
cd clean-newtab
# Load extension/ folder in Chrome extensions
```

🛠️ **[Full Development Setup](docs/README.md#getting-started)**

## 📚 Documentation Hub

### For Users
- **[Feature Documentation](docs/features/README.md)** - Complete widget guides and roadmap
- **[Release Notes](release-notes/)** - Version history and changes

### For Developers  
- **[Development Guide](docs/README.md)** - Architecture, setup, and workflows
- **[Widget Development](docs/WIDGET_DEVELOPMENT.md)** - Create new widgets step-by-step
- **[Styling Guide](docs/STYLING_GUIDE.md)** - Design system and CSS patterns
- **[Component Rules](docs/COMPONENT_RULES.md)** - Architecture standards

### Project Structure
```
extension/
├── newtab.html          # Main entry point
├── settings.js          # Settings & persistence  
├── widgets.js           # Core widget system
├── styles.css           # Complete styling
├── widgets/             # Individual widgets
└── manifest.json        # Extension config
```

## 📊 Project Status

**Current Version**: v0.3.0 - Date Widget & Universal Sidepanel  
**Development Stage**: Active development with regular releases  
**Widget Count**: 4 shipped widgets, unlimited website embedding via sidepanel

### Recent Highlights
- ✅ **Universal Sidepanel** - Embed ANY website with advanced iframe technology
- ✅ **Date Widget** - Day.js powered formatting with unlimited customization
- ✅ **Enhanced Architecture** - Improved widget system and resource management

### Coming Next
- 🚧 **Notes Widget** - Rich text note-taking with auto-save
- ⭕ **Weather Widget** - Local weather with NWS API integration
- ⭕ **Sidepanel Enhancements** - Bookmarking, history, and session management

📋 **[Full Roadmap & Status](docs/features/README.md)**  
📝 **[Release Notes](release-notes/)**

## 🤝 Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation:

- **[Contributing Guidelines](CONTRIBUTING.md)** - Code standards and pull request process
- **[Widget Development Guide](docs/WIDGET_DEVELOPMENT.md)** - Create new widgets step-by-step  
- **[Architecture Rules](docs/COMPONENT_RULES.md)** - Follow established patterns

**Quick Start**: Fork → Create widget → Test → Submit PR

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Ready to maximize your new tab experience?** Transform your browser into a personalized command center with zero subscriptions and unlimited customization.

[📥 Download Latest](./releases/) | [🐛 Report Issues](../../issues) | [💡 Request Features](../../issues) | [📚 Full Documentation](docs/README.md)