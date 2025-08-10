# Search Widget

> **Status**: ✅ Completed
> 
> **Development Stage**: Shipped

## Overview

A customizable search widget supporting multiple search engines with flexible targeting options and visual customization capabilities.

## Core Features

### Primary Functions
- Multiple search engine support (Google, Bing, DuckDuckGo, Yahoo, Custom)
- Custom search URL configuration for any search service
- Flexible target options (new tab, current tab, new window, incognito)
- Optional input clearing after search submission
- Custom logo/icon support for personalization
- Responsive input field with proper focus handling

### Configuration Options
- **Search Engine**: Predefined options or custom URL with {query} placeholder
- **Target**: Where to open search results (new tab, current tab, new window, incognito)
- **Clear Input**: Automatically clear search field after submission
- **Custom Logo**: URL to custom search engine logo/icon

### User Interface
- Clean search input field with search button
- Search engine logo display (when configured)
- Responsive design adapting to widget size
- Keyboard-friendly with Enter key submission
- Focus management and accessibility support

## Technical Specifications

### Dependencies
- No external APIs required - uses direct search engine URLs
- Chrome tabs API for target window management
- Standard form submission and URL construction

### Implementation Details
- URL template system with {query} placeholder substitution
- Safe URL encoding for search terms
- Logo loading with fallback handling
- Form event handling with proper preventDefault
- Integration with Chrome extension APIs for window management

### File Structure
```
extension/widgets/search-widget.js (implementation)
extension/styles.css (search-widget styling)
docs/features/search-widget.md (this file)
```

## Development Workflow

### Required Functions
- ✅ `renderSearchWidget(widget, index)` - Creates DOM structure and form
- ✅ `setupSearchLogic(container, widget, index)` - Handles form submission and events
- ✅ `openSearchConfig(existing, index)` - Configuration interface
- ✅ `addSearchWidget(options)` - Creates new widget instance
- ✅ `registerWidget()` call - Registers with widget system

### Settings Schema
```javascript
{
  type: 'search',
  x: number,     // Grid X position (0-39)
  y: number,     // Grid Y position (0-23)
  w: number,     // Width in grid units (default: 6)
  h: number,     // Height in grid units (default: 2)
  settings: {
    engine: string,        // 'google', 'bing', 'duckduckgo', 'yahoo', or custom URL
    target: string,        // 'newtab', 'currenttab', 'newwindow', 'incognito'
    clearInput: boolean,   // Clear input after search
    customLogo: string     // URL to custom logo image
  }
}
```

## Future Enhancements

### Planned Improvements
- Search history with autocomplete suggestions
- Quick search presets for common queries
- Search shortcuts and hotkeys
- Integration with browser bookmarks and history

### Advanced Features (Long-term)
- Multi-engine search with result aggregation
- Custom search scopes (site-specific searches)
- Search analytics and usage tracking
- Voice search integration
- Search result preview functionality

## Testing Checklist

### Functionality Testing
- [x] Widget appears in widget list
- [x] Configuration panel opens and saves correctly
- [x] Widget renders properly in different grid sizes
- [x] All core features work as expected
- [x] Settings persist across browser sessions

### Integration Testing
- [x] Widget works in jiggle mode (drag, resize, edit)
- [x] Global appearance settings apply correctly
- [x] Widget doesn't interfere with other widgets
- [x] Performance is acceptable with multiple instances
- [x] No console errors or warnings

### Cross-browser Testing
- [x] Chrome (primary target)
- [x] Edge (Chromium-based)
- [x] Other Chromium browsers

## Development Notes

### Implementation Challenges
- URL encoding for special characters in search queries
- Handling different search engine URL patterns and parameters
- Managing Chrome extension permissions for different target options
- Logo loading and display with proper fallbacks

### Design Decisions
- Chose form-based approach over direct URL manipulation for better UX
- Implemented flexible targeting system for different user workflows
- Used template-based URL system for easy custom engine support
- Optional logo display to maintain clean appearance when not needed

### Version History
- v0.1.0: Initial search widget with basic Google search
- v0.1.3: Added multiple search engines and targeting options
- v0.2.0: Enhanced with custom logo support and improved URL handling

---

## Usage Guidelines

### Configuration Instructions
1. Click the widgets button (plus icon)
2. Select "Search" from the widget list
3. Choose your preferred search engine or enter custom URL
4. Configure target window behavior
5. Optionally add custom logo URL
6. Click "Add" to create the widget
7. Resize to desired width for optimal input field size

### Tips and Best Practices
- Use wider widget sizes (6+ grid units) for comfortable typing
- Enable "Clear Input" for quick successive searches
- Use "New Tab" target to preserve your new tab page
- Custom logos should be small (32x32 or 64x64 pixels) for best appearance
- Test custom search URLs with the {query} placeholder before saving

### Common Issues and Solutions
- **Custom search not working**: Verify the URL includes {query} placeholder exactly
- **Logo not displaying**: Check that the logo URL is accessible and points to an image
- **Search opens in wrong location**: Review target setting in widget configuration
- **Input field too narrow**: Increase widget width to at least 6 grid units
- **Incognito not working**: Ensure extension has incognito permission in Chrome settings

### Custom Search Engine Examples
```
Google: https://www.google.com/search?q={query}
Bing: https://www.bing.com/search?q={query}
DuckDuckGo: https://duckduckgo.com/?q={query}
YouTube: https://www.youtube.com/results?search_query={query}
GitHub: https://github.com/search?q={query}
Stack Overflow: https://stackoverflow.com/search?q={query}
```

---

*This widget provides essential web navigation functionality and demonstrates form handling patterns for other interactive widgets.*