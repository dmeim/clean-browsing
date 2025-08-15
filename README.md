# Clean Browsing

[![Version](https://img.shields.io/badge/version-0.5.0-blue)](https://github.com/DimitriMeimaridis/clean-browsing/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/platform-Chrome%20Extension-brightgreen)](https://chromewebstore.google.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**A comprehensive browsing enhancement suite** – Two powerful Chrome extensions that transform your browsing experience with customizable dashboards and universal website embedding.

## 🌟 Overview

Clean Browsing is a monorepo containing two complementary Chrome extensions built with vanilla web technologies. Each extension focuses on a specific browsing enhancement while sharing common components and design principles.

### 🎯 **CB-NewTab** - Customizable Dashboard
Transform your new tab into a powerful, customizable dashboard with:
- 🧩 **Tile-based Widget System** - Calculator, clock, search, date, and more
- 🎨 **Infinite Customization** - Personalize every aspect of your dashboard  
- 📊 **40×24 Grid System** - Drag & drop positioning with visual overlay
- 🎨 **Glassmorphism Design** - Modern blur effects and transparency

### 🌐 **CB-Sidepanel** - Universal Website Access
Access any website through a convenient browser sidepanel with:
- 🔓 **Universal Embedding** - Embed ANY website with advanced iframe technology
- ⚡ **Instant Access** - Toggle sidepanel via extension icon
- 🎛️ **Flexible Opening** - Iframe embedding or new tab/window options
- 📱 **Responsive Design** - Optimized for narrow sidepanel constraints

## 🚀 Extensions

### 📊 CB-NewTab v0.5.0
**New Tab Dashboard Replacement**
- **Location**: `extensions/cb-newtab/`
- **Install**: Load `extensions/cb-newtab/` folder in Chrome
- **Features**: Widget system, customizable backgrounds, settings management

### 🌐 CB-Sidepanel v0.1.0  
**Universal Website Sidepanel**
- **Location**: `extensions/cb-sidepanel/`
- **Install**: Load `extensions/cb-sidepanel/` folder in Chrome
- **Features**: Universal iframe embedding, website management, background header stripping

## 📦 Quick Start

### Option 1: Install Both Extensions (Recommended)
```bash
# 1. Clone repository
git clone https://github.com/DimitriMeimaridis/clean-browsing.git
cd clean-browsing

# 2. Build shared components
npm run build

# 3. Install both extensions in Chrome
# - Go to chrome://extensions
# - Enable Developer mode
# - Load unpacked: select extensions/cb-newtab/
# - Load unpacked: select extensions/cb-sidepanel/
```

### Option 2: Install Individual Extensions
Install only the extension(s) you want:
- **CB-NewTab only**: Load `extensions/cb-newtab/` folder
- **CB-Sidepanel only**: Load `extensions/cb-sidepanel/` folder

## 🏗️ Architecture

### Monorepo Structure
```
clean-browsing/
├── extensions/
│   ├── cb-newtab/           # New Tab Dashboard Extension
│   │   ├── manifest.json    # v0.5.0, newtab-only permissions
│   │   ├── newtab.html      # Main dashboard HTML
│   │   ├── widgets.js       # Widget system core
│   │   ├── styles.css       # Dashboard-specific styles
│   │   └── widgets/         # Individual widget implementations
│   │
│   └── cb-sidepanel/        # Sidepanel Extension
│       ├── manifest.json    # v0.1.0, sidepanel-only permissions
│       ├── sidepanel.html   # Sidepanel HTML
│       ├── sidepanel.js     # Sidepanel functionality
│       ├── background.js    # Service worker for panel management
│       ├── iframe-tracker.js # URL tracking content script
│       └── frame-rules.json # Declarative net request rules
│
├── shared/                  # Shared Components
│   ├── storage/            # Storage management utilities
│   ├── styles/             # Common glassmorphism design system
│   ├── resources/          # Shared icons and assets
│   └── utils/              # Common helper functions
│
├── scripts/                # Build and development tools
├── docs/                   # Comprehensive documentation
└── release-notes/          # Version history
```

### Key Features by Extension

#### 🎛️ **CB-NewTab Widget Library**
| Widget | Description | Size | Documentation |
|--------|-------------|------|---------------|
| **🕒 Clock** | Real-time clock with locale & format options | 4×3 | [Details](docs/features/clock-widget.md) |
| **🧮 Calculator** | Full-featured calculator with keyboard support | 4×5 | [Details](docs/features/calculator-widget.md) |
| **🔍 Search** | Multi-engine search with custom targeting | 6×2 | [Details](docs/features/search-widget.md) |
| **📅 Date** | Day.js powered date display with unlimited formats | 4×2 | [Details](docs/features/date-widget.md) |

#### 🌐 **CB-Sidepanel Capabilities**
- **Universal iframe embedding** - Bypasses X-Frame-Options and CSP restrictions
- **Real-time URL tracking** - Shows current page, not just initial website
- **Intelligent fallback** - Automatic new tab opening for incompatible sites
- **Advanced navigation** - Back/forward support within embedded sites
- **Customizable appearance** - Background themes and layout options

## 📚 Documentation

### For Users
- **[Feature Documentation](docs/features/README.md)** - Complete guides for all features
- **[Release Notes](release-notes/)** - Version history and changes

### For Developers  
- **[Development Guide](docs/README.md)** - Architecture, setup, and workflows
- **[Widget Development](docs/WIDGET_DEVELOPMENT.md)** - Create new widgets step-by-step
- **[Styling Guide](docs/STYLING_GUIDE.md)** - Design system and CSS patterns
- **[Component Rules](docs/COMPONENT_RULES.md)** - Architecture standards and shared components

## 🛠️ Development

### Prerequisites
- Node.js 16+ (for build scripts)
- Chrome 114+ (for sidepanel API support)

### Development Workflow
```bash
# Install dependencies
npm install

# Start development mode (watches shared files)
npm run dev

# Build both extensions for production
npm run build

# Package for Chrome Web Store
npm run package
```

### Testing Extensions
1. Build shared components: `npm run build`
2. Load unpacked extensions in Chrome
3. Test individually or together
4. Verify shared storage synchronization

## 🔗 Shared Components

Both extensions share common code for consistency and maintainability:

- **Storage Management**: Unified settings persistence across extensions
- **Design System**: Glassmorphism styles and CSS variables
- **Resources**: Shared icons, logos, and assets
- **Utilities**: Common helper functions and message handlers

## 📈 Version History

### CB-NewTab Releases
- **v0.5.0** - Monorepo migration, shared component architecture
- **v0.4.0** - Enhanced widget system and global appearance controls
- **v0.3.0** - Glassmorphism design system and configuration management

### CB-Sidepanel Releases  
- **v0.1.0** - Initial standalone release with universal iframe embedding
- **Previous** - Integrated with CB-NewTab in v0.2.x - v0.4.x

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- Code standards and architecture
- Testing procedures  
- Pull request process
- Development environment setup

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Issues**: [GitHub Issues](https://github.com/DimitriMeimaridis/clean-browsing/issues)
- **Releases**: [GitHub Releases](https://github.com/DimitriMeimaridis/clean-browsing/releases)
- **Documentation**: [Full Docs](docs/README.md)

---

*Clean Browsing provides a comprehensive solution for browser customization, offering both dashboard replacement and universal website access through two powerful, independently installable Chrome extensions.*