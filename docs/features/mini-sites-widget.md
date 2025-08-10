# Mini-Sites Widget

> **Status**: ⭕ Planned
> 
> **Development Stage**: Planning
> 
> **Note**: This is a planning document for a feature that is not yet implemented. It may change significantly or not be implemented at all. This document is used for brainstorming and planning purposes only.

## Overview

A website display widget that embeds external websites within iframe containers, featuring auto-refresh capabilities, zoom controls, and screenshot fallbacks for CORS-restricted sites.

## Core Features

### Primary Functions
- URL-based website embedding within widget boundaries
- Configurable auto-refresh intervals (1min, 5min, 15min, 30min, never)
- Interactive iframe controls with navigation options
- Zoom level adjustment from 25% to 200% for optimal viewing
- Screenshot mode for websites that block iframe embedding
- CORS handling with automatic fallback to screenshot service
- Loading states and error handling for failed embeds
- Website favoriting and quick-access management

### Configuration Options
- **Target URL**: Primary website URL to display
- **Refresh Interval**: Automatic page refresh frequency
- **Zoom Level**: Website scaling percentage for readability
- **Interaction Mode**: Full interaction, view-only, or screenshot mode
- **Fallback Behavior**: How to handle CORS-blocked sites
- **Loading Options**: Show loading indicators, enable/disable scripts
- **Navigation Controls**: Address bar, refresh button, external link button

### User Interface
- Iframe container with website content display
- Zoom controls with preset levels and custom input
- Navigation toolbar with URL, refresh, and external link buttons
- Loading indicator during page load and refresh operations
- Error messages for blocked content or failed loads
- Screenshot placeholder for non-embeddable sites
- Settings overlay for quick configuration adjustments

## Technical Specifications

### Dependencies
- Iframe embedding with sandbox security attributes
- Screenshot service or library for CORS-blocked content
- Zoom implementation using CSS transforms
- Host permissions for target websites (as needed)

### Implementation Details
- Intelligent CORS detection and fallback mechanism
- Screenshot capture service integration for blocked sites
- Efficient iframe reload management with state preservation
- Zoom level calculation and responsive scaling
- URL validation and security checking
- Performance optimization for refresh intervals and multiple instances

### File Structure
```
extension/widgets/mini-sites-widget.js (implementation)
extension/styles.css (mini-sites-widget styling)
extension/lib/screenshot-service.js (screenshot functionality)
docs/features/mini-sites-widget.md (this file)
```

## Development Workflow

### Required Functions
- `renderMiniSitesWidget(widget, index)` - Creates DOM structure and iframe container
- `setupMiniSitesLogic(container, widget, index)` - Handles website loading and controls
- `openMiniSitesConfig(existing, index)` - Configuration interface
- `addMiniSitesWidget(options)` - Creates new widget instance
- `registerWidget()` call - Registers with widget system

### Settings Schema
```javascript
{
  type: 'mini-sites',
  x: number,     // Grid X position (0-39)
  y: number,     // Grid Y position (0-23)
  w: number,     // Width in grid units (default: 8)
  h: number,     // Height in grid units (default: 6)
  settings: {
    targetUrl: string,           // Website URL to display
    refreshInterval: number,     // Auto-refresh interval in minutes (0 = never)
    zoomLevel: number,          // Zoom percentage (25-200)
    interactionMode: string,    // 'full', 'readonly', 'screenshot'
    fallbackMode: string,       // 'screenshot', 'placeholder', 'error'
    showNavigation: boolean,    // Display navigation toolbar
    enableScripts: boolean,     // Allow JavaScript in iframe
    corsBlocked: boolean,       // Whether site blocks iframe embedding
    lastRefresh: timestamp,     // Last successful refresh
    screenshotUrl: string,     // Cached screenshot for blocked sites
    loadingState: string       // Current loading state
  }
}
```

### Interaction Modes
```javascript
const interactionModes = {
  full: {
    sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups',
    userSelect: 'auto',
    pointerEvents: 'auto',
    description: 'Full website interaction enabled'
  },
  readonly: {
    sandbox: 'allow-scripts allow-same-origin',
    userSelect: 'none',
    pointerEvents: 'none',
    description: 'View-only mode, no user interaction'
  },
  screenshot: {
    sandbox: '',
    userSelect: 'none',
    pointerEvents: 'none',
    description: 'Static screenshot, no dynamic content'
  }
};
```

### Fallback Strategies
```javascript
const fallbackStrategies = {
  screenshot: {
    method: 'capture',
    updateInterval: 15, // minutes
    quality: 'medium',
    description: 'Capture screenshots when iframe blocked'
  },
  placeholder: {
    method: 'static',
    content: 'Site unavailable for embedding',
    showLink: true,
    description: 'Show placeholder with external link'
  },
  error: {
    method: 'message',
    content: 'Unable to load website',
    showTroubleshooting: true,
    description: 'Display error message with help'
  }
};
```

## Future Enhancements

### Planned Improvements
- Multi-tab support within single widget
- Website bookmarking and favorites management
- Advanced screenshot scheduling and caching
- Mobile-responsive iframe handling
- Website performance metrics and load time monitoring

### Advanced Features (Long-term)
- Website comparison view (side-by-side or overlay)
- Automated website change detection and notifications
- Integration with browser bookmark sync
- Advanced navigation controls (back/forward history)
- Website annotation and highlighting tools
- Batch website monitoring with status dashboard

## Testing Checklist

### Functionality Testing
- [ ] Widget appears in widget list
- [ ] Configuration panel opens and saves correctly
- [ ] Widget renders properly in different grid sizes
- [ ] All core features work as expected
- [ ] Settings persist across browser sessions

### Integration Testing
- [ ] Widget works in jiggle mode (drag, resize, edit)
- [ ] Global appearance settings apply correctly
- [ ] Widget doesn't interfere with other widgets
- [ ] Performance is acceptable with multiple instances
- [ ] No console errors or warnings

### Cross-site Testing
- [ ] Embeddable sites load correctly in iframe
- [ ] CORS-blocked sites trigger appropriate fallbacks
- [ ] Screenshot mode works for restricted content
- [ ] Zoom controls function at different levels
- [ ] Refresh intervals work as configured

### Cross-browser Testing
- [ ] Chrome (primary target)
- [ ] Edge (Chromium-based)
- [ ] Other Chromium browsers (optional)

## Development Notes

### Implementation Challenges
- Many modern websites block iframe embedding via X-Frame-Options headers
- Screenshot services may require external dependencies or APIs
- Iframe sandbox security vs functionality requirements
- Performance impact of auto-refresh on multiple widgets
- Cross-origin communication limitations for embedded content

### Design Decisions
- Iframe-first approach with screenshot fallback vs screenshot-primary
- Auto-refresh vs manual refresh for content updates
- Zoom implementation using CSS transforms vs iframe scaling
- Navigation controls placement and visibility options
- Error handling strategies for various failure modes

### Technical Limitations
- X-Frame-Options: DENY/SAMEORIGIN prevents iframe embedding
- Content Security Policy restrictions on many modern sites
- Limited interaction capabilities in sandboxed iframes
- Screenshot quality vs file size trade-offs
- Browser security restrictions on cross-origin content

### Version History
- Future: Initial mini-sites widget with basic iframe embedding
- Future: Enhanced with screenshot fallback and zoom controls
- Future: Advanced navigation and multi-tab features

---

## Usage Guidelines

### Configuration Instructions
1. Click the widgets button (plus icon)
2. Select "Mini-Sites" from the widget list
3. Enter the website URL you want to display
4. Configure refresh interval and interaction preferences
5. Set zoom level for optimal viewing
6. Choose fallback method for blocked sites
7. Click "Add" to create the widget

### Tips and Best Practices
- Use larger widget sizes (8×6 or larger) for comfortable website viewing
- Test website compatibility by checking if it loads in regular iframe
- Enable screenshot mode for sites that block iframe embedding
- Use reasonable refresh intervals to avoid overwhelming target servers
- Consider read-only mode for informational sites to prevent accidental interactions
- Bookmark frequently accessed sites for quick widget setup

### Common Issues and Solutions
- **Website not loading**: Many sites block iframe embedding; try screenshot mode
- **Blank or error page**: Check URL validity and website accessibility
- **Content appears too small**: Increase widget size or adjust zoom level
- **Interactive elements not working**: Check interaction mode and iframe sandbox settings
- **Poor screenshot quality**: Adjust screenshot settings or try different fallback mode
- **High resource usage**: Reduce auto-refresh frequency or limit number of widgets

### Embeddable vs Non-Embeddable Sites
```
Usually Embeddable:
- Documentation sites (GitHub Pages, GitLab Pages)
- Personal websites and blogs
- Many corporate websites
- Internal/intranet sites
- Static content sites

Usually Non-Embeddable:
- Social media sites (Twitter, Facebook, Instagram)
- Banking and financial sites
- Major web applications (Gmail, Office 365)
- E-commerce sites (Amazon, eBay)
- Sites with strict security policies
```

### URL Format Examples
```
Standard websites:
https://example.com
https://docs.github.com
http://internal-server.local:3000

Documentation:
https://developer.mozilla.org/
https://docs.python.org/3/
https://reactjs.org/docs/

Development tools:
http://localhost:3000
https://codesandbox.io
https://replit.com/@username/project
```

### Zoom Level Recommendations
```
Zoom Levels by Use Case:
- 25-50%: Overview/dashboard view
- 75-100%: Normal reading (default)
- 125-150%: Enhanced readability
- 175-200%: Accessibility/large text

Widget Size Considerations:
- Small widgets (4×3): 50-75% zoom
- Medium widgets (6×4): 75-100% zoom  
- Large widgets (8×6+): 100-150% zoom
```

---

*This widget will provide essential website viewing functionality while demonstrating iframe handling and fallback strategies for other web content widgets.*