# Sidebar Extension Feature

> **Status**: ⭕ Planned
> 
> **Development Stage**: Planning
> 
> **Note**: This is a planning document for a feature that is not yet implemented. It may change significantly or not be implemented at all. This document is used for brainstorming and planning purposes only.

## Overview

A browser sidebar panel that provides quick access to user-configured websites through the Chrome extension icon. Users can toggle the sidebar open/closed by clicking the extension icon, providing instant access to frequently used sites like AI chat platforms, social media, productivity tools, or any custom websites without leaving their current tab.

## Core Features

### Primary Functions
- **Quick Website Access**: Launch user-configured websites in embedded iframes or new tabs
- **Extension Icon Toggle**: Click extension icon to open/close sidebar panel
- **Website Management**: Add, edit, remove, and reorder quick-access websites
- **Persistent Settings**: Website list and preferences stored with existing settings system
- **Responsive Design**: Optimized layout for narrow sidebar width constraints
- **Multiple Access Modes**: Open sites in sidebar iframe, new tab, or current tab

### Configuration Options
- **Website List**: User-defined list of quick-access websites with custom names and URLs
- **Display Mode**: Choose between iframe embedding, new tab opening, or current tab navigation
- **Icon/Logo Display**: Custom icons or favicons for each website entry
- **Sidebar Behavior**: Auto-close on link click, stay open, or user preference
- **Access Permissions**: Manage which sites can be embedded vs opened in new tabs
- **Theme Integration**: Match main extension's glassmorphism design system

### User Interface
- **Sidebar Panel**: Narrow vertical panel (typically 300-400px wide) with website list
- **Website Tiles**: Clean, clickable tiles/buttons for each configured website
- **Management Interface**: Add/edit forms integrated into main extension settings
- **Header Section**: Extension branding and close button
- **Quick Actions**: Icons for common operations (add, edit, remove websites)
- **Responsive Layout**: Adapts to different browser window sizes and sidebar widths

## Technical Specifications

### Dependencies
- **Chrome sidePanel API**: Requires Chrome 114+ for sidebar functionality
- **Extension Permissions**: sidePanel permission, optional host permissions for iframe embedding
- **Settings Integration**: Uses existing settings.js storage and persistence system
- **Background Script**: Service worker to handle extension icon clicks and panel behavior

### Implementation Details
- **sidePanel API Integration**: Configure panel opening on extension icon click
- **Message Passing**: Communication between sidebar, background script, and main extension
- **iframe Security**: Content Security Policy considerations for embedded websites
- **Host Permissions**: Dynamic permission requests for iframe-embedded sites
- **Favicon Handling**: Fetch and display website favicons or custom icons
- **Error Handling**: Graceful fallbacks for sites that can't be embedded

### File Structure
```
extension/sidepanel.html              (sidebar panel HTML)
extension/sidepanel.js               (sidebar panel logic)
extension/sidepanel.css              (sidebar-specific styles)
extension/background.js              (service worker for panel management)
extension/manifest.json              (updated with sidePanel permissions)
extension/settings.js                (extended with sidebar settings)
extension/newtab.html                (updated with sidebar settings UI)
docs/features/sidebar-extension.md   (this file)
```

## Development Workflow

### Required Functions
- `initializeSidebar()` - Set up sidebar panel and event listeners
- `renderSidebarWebsites(websites)` - Display user-configured website list
- `addWebsiteToSidebar(name, url, options)` - Add new website to sidebar
- `editSidebarWebsite(index, data)` - Modify existing website entry
- `removeSidebarWebsite(index)` - Remove website from sidebar list
- `openSidebarWebsite(url, mode)` - Handle website opening in iframe/tab
- `saveSidebarSettings(settings)` - Persist sidebar configuration
- `loadSidebarSettings()` - Restore saved sidebar configuration

### Settings Schema
```javascript
{
  sidebarEnabled: boolean,           // Enable/disable sidebar feature
  sidebarWebsites: [                // Array of configured websites
    {
      id: string,                    // Unique identifier
      name: string,                  // Display name
      url: string,                   // Website URL
      icon: string,                  // Custom icon URL or favicon
      openMode: string,              // 'iframe', 'newtab', 'currenttab'
      position: number               // Display order
    }
  ],
  sidebarBehavior: {
    autoClose: boolean,              // Close sidebar after clicking link
    defaultOpenMode: string,         // Default opening behavior
    showIcons: boolean,              // Display website icons
    compactMode: boolean             // Condensed layout option
  }
}
```

## Future Enhancements

### Planned Improvements
- **Drag & Drop Reordering**: Rearrange website order in sidebar settings
- **Website Categories**: Group websites into folders or categories
- **Quick Search**: Search/filter websites in sidebar
- **Keyboard Shortcuts**: Hotkeys to open specific websites or toggle sidebar
- **Import/Export**: Share sidebar configurations between devices

### Advanced Features (Long-term)
- **Website Thumbnails**: Preview images for each website
- **Recent Activity**: Show recently accessed websites at top
- **Context Integration**: Show relevant websites based on current tab content
- **Multiple Profiles**: Different sidebar configurations for work/personal use
- **Sync Integration**: Chrome sync support for cross-device configuration

## Testing Checklist

### Functionality Testing
- [ ] Extension icon click toggles sidebar open/closed
- [ ] Sidebar displays configured websites correctly
- [ ] Website links open in correct mode (iframe/tab)
- [ ] Add/edit/remove website functionality works
- [ ] Settings persist across browser sessions
- [ ] Sidebar respects Chrome's sidePanel constraints

### Integration Testing
- [ ] Sidebar settings integrate with main extension settings
- [ ] Background script handles extension icon events
- [ ] Message passing between components works correctly
- [ ] No conflicts with existing extension functionality
- [ ] Performance acceptable with many configured websites

### Cross-browser Testing
- [ ] Chrome 114+ (primary target with sidePanel API)
- [ ] Edge (Chromium-based, sidePanel support)
- [ ] Other Chromium browsers with sidePanel support

## Development Notes

### Implementation Challenges
- **Chrome sidePanel API**: Relatively new API, requires Chrome 114+
- **iframe Security**: Many sites block iframe embedding with X-Frame-Options
- **Permission Management**: Dynamic host permissions for iframe embedding
- **Content Security Policy**: Restrictions on embedded content and scripts
- **Sidebar Width Constraints**: Designing for narrow panel width (300-400px)

### Design Decisions
- **Icon-based Approach**: Use extension icon click to toggle sidebar (standard pattern)
- **Flexible Opening Modes**: Support both iframe and tab opening to handle all websites
- **Settings Integration**: Leverage existing settings system rather than separate storage
- **Glassmorphism Consistency**: Match main extension's visual design system
- **Progressive Enhancement**: Graceful fallback for sites that can't be embedded

### Version History
- v0.2.1: Initial sidebar implementation with basic website management
- v0.2.2: Enhanced with iframe support and improved error handling
- v0.3.0: Advanced features like categories and keyboard shortcuts

---

## Usage Guidelines

### Configuration Instructions
1. Click the settings button (gear icon) in the main extension
2. Navigate to the "Sidebar" configuration tab
3. Enable the sidebar feature if disabled
4. Click "Add Website" to configure quick-access sites
5. Enter website name, URL, and choose opening mode
6. Save settings and test by clicking the extension icon

### Tips and Best Practices
- **Test iframe compatibility**: Some sites block iframe embedding - use "new tab" mode for these
- **Use descriptive names**: Short, recognizable names work best in narrow sidebar
- **Organize by frequency**: Put most-used websites at the top of the list
- **Consider security**: Be cautious with sensitive sites in iframe mode
- **Monitor performance**: Too many websites might slow down sidebar loading

### Common Issues and Solutions
- **Website won't load in iframe**: Site blocks embedding - change to "new tab" mode
- **Sidebar not opening**: Check Chrome version (requires 114+) and extension permissions
- **Icons not displaying**: Verify icon URLs are accessible and point to valid images
- **Extension icon not clickable**: Ensure sidePanel permission is granted in manifest
- **Settings not saving**: Check browser storage permissions and settings integration

### Compatible Website Examples
```
Good for iframe embedding:
- Most AI chat platforms (ChatGPT, Claude, etc.)
- Documentation sites
- Simple web tools and calculators
- Custom web apps

Require "new tab" mode:
- Social media sites (Twitter, Facebook, etc.)
- Banking and financial sites
- Sites with strict security policies
- Most Google services
```

---

## Technical Implementation Notes

### Chrome sidePanel API Usage
```javascript
// manifest.json
{
  "permissions": ["sidePanel"],
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "background": {
    "service_worker": "background.js"
  }
}

// background.js
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
```

### Message Passing Pattern
```javascript
// Communication between main extension and sidebar
chrome.runtime.sendMessage({
  action: 'updateSidebarSettings',
  settings: newSidebarSettings
});
```

---

*This feature represents a significant enhancement to the extension, providing users with convenient access to their favorite websites while maintaining the clean, professional design of the main new tab interface.*