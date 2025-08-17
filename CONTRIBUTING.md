# Contributing to Clean Browsing

Thank you for your interest in contributing to Clean Browsing! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Chrome or Chromium-based browser
- Basic knowledge of HTML, CSS, and JavaScript
- Git for version control

### Development Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/clean-browsing.git
   cd clean-browsing
   ```
3. Load the extension in Chrome:
   - Open `chrome://extensions`
   - Enable Developer mode
   - Click "Load unpacked" and select the `extension/` folder
4. Make your changes and test the extension features

## 🛠️ Development Guidelines

### Code Style
- **JavaScript**: Use ES6+ features, consistent indentation (2 spaces)
- **CSS**: Follow existing naming conventions, use CSS custom properties
- **HTML**: Semantic markup, consistent formatting

### Architecture Principles
- **Modular Design**: Keep widgets as separate, self-contained modules
- **No Build Process**: Maintain vanilla JavaScript compatibility
- **Local Storage**: All data must remain local to the user's browser
- **Privacy First**: No external tracking or data collection

### File Organization
```
extension/
├── newtab.html          # Main entry point
├── settings.js          # Settings management core
├── widgets.js           # Widget system core  
├── styles.css           # Complete styling system
├── widgets/             # Individual widget implementations
└── resources/           # Assets and resources
```

## 🧩 Adding New Widgets

### Widget Structure
Each widget should be a self-contained JavaScript module that registers itself:

```javascript
// widgets/my-widget.js
(function() {
  'use strict';

  function renderMyWidget(widget, index) {
    const container = createWidgetContainer(widget, index, 'my-widget');
    // Widget rendering logic
    setupJiggleModeControls(container, widget, index);
    widgetGrid.appendChild(container);
  }

  function addMyWidget(options) {
    const widget = {
      type: 'mywidget',
      x: 0, y: 0, w: 4, h: 3,
      settings: options
    };
    settings.widgets.push(widget);
    saveAndRender();
  }

  function openMyWidgetConfig(existing, index) {
    // Configuration UI logic
  }

  // Register the widget
  registerWidget('mywidget', {
    name: 'My Widget',
    render: renderMyWidget,
    openConfig: openMyWidgetConfig
  });
})();
```

### Widget Requirements
- Must use the widget registration system
- Should support appearance inheritance from global settings
- Must clean up resources (intervals, observers) in `renderWidgets()`
- Should work at all widget sizes (responsive design)

## 📝 Pull Request Process

### Before Submitting
1. **Test Thoroughly**: Verify your changes work across different widget sizes
2. **Version Update**: Increment version in `manifest.json` (alpha: +0.0.1)
3. **Code Style**: Follow existing patterns and formatting
4. **Documentation**: Update relevant documentation

### PR Guidelines
- **Clear Title**: Describe what your PR accomplishes
- **Detailed Description**: Explain the changes and reasoning
- **Screenshots**: Include before/after screenshots for UI changes
- **Testing Notes**: Describe how you tested the changes

### Review Process
1. Code review by maintainers
2. Testing in different browsers/environments
3. Documentation review
4. Final approval and merge

## 🐛 Bug Reports

### Before Reporting
- Check existing issues to avoid duplicates
- Test with a fresh extension installation
- Identify steps to reproduce the bug

### Bug Report Template
```markdown
**Bug Description**
Brief description of the issue

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should have happened

**Actual Behavior** 
What actually happened

**Environment**
- Browser: Chrome/Edge/etc
- Version: Extension version number
- OS: Windows/Mac/Linux

**Screenshots**
If applicable, add screenshots
```

## 💡 Feature Requests

We welcome feature requests! Please:
- Check existing issues for similar requests
- Describe the use case and benefits
- Consider implementation complexity
- Be open to discussion and alternatives

### Feature Request Template
```markdown
**Feature Description**
Clear description of the proposed feature

**Use Case**
Why would this feature be useful?

**Proposed Implementation**
Ideas for how this could work (optional)

**Alternatives Considered**
Any alternative solutions you've thought of
```

## 🏗️ Widget Development Best Practices

### Performance
- Use `ResizeObserver` for dynamic sizing
- Clean up intervals and observers in widget lifecycle
- Minimize DOM manipulations
- Use CSS transforms for animations

### Accessibility  
- Provide keyboard navigation support
- Use semantic HTML elements
- Include proper ARIA labels
- Ensure good color contrast

### Responsiveness
- Use container queries for widget-specific breakpoints
- Implement proper text scaling
- Handle very small widget sizes gracefully
- Test across different grid configurations

## 📚 Resources

### Documentation
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [CSS Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries)
- [Web Components Best Practices](https://developers.google.com/web/fundamentals/web-components)

### Tools
- Chrome DevTools for debugging
- Extension Reloader for faster development
- Git hooks for code quality checks

## 🤝 Community

### Communication
- Use GitHub Issues for bugs and feature requests
- Be respectful and constructive in discussions
- Help other contributors when possible

### Recognition
Contributors will be acknowledged in release notes and project documentation.

## 📄 License

By contributing to NewTab PlusProMaxUltra, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make NewTab PlusProMaxUltra better for everyone! 🚀