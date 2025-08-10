# Embeds Widget

> **Status**: ⭕ Planned
> 
> **Development Stage**: Planning
> 
> **Note**: This is a planning document for a feature that is not yet implemented. It may change significantly or not be implemented at all. This document is used for brainstorming and planning purposes only.

## Overview

A versatile embed widget supporting HTML/JavaScript embed codes from popular platforms with security sandboxing, responsive scaling, and preview functionality for safe content integration.

## Core Features

### Primary Functions
- HTML/JavaScript embed code support with syntax validation
- Common platform integration (YouTube, Twitter/X, CodePen, JSFiddle, etc.)
- Iframe sandboxing with configurable security levels
- Responsive embed scaling that adapts to widget dimensions
- Embed code validation and sanitization before rendering
- Live preview functionality before applying embed codes
- Fallback handling for unsupported or blocked content
- Embed source whitelisting for security and performance

### Configuration Options
- **Embed Code Input**: Large text area for HTML/JavaScript embed codes
- **Security Level**: Strict, moderate, or permissive iframe sandbox settings
- **Scaling Options**: Responsive, fixed dimensions, or aspect ratio preservation
- **Platform Presets**: Quick setup for popular services (YouTube, Twitter, etc.)
- **Content Validation**: Enable/disable embed code sanitization
- **Fallback Behavior**: How to handle failed or blocked embeds
- **Refresh Settings**: Auto-refresh intervals for dynamic content

### User Interface
- Large embed code textarea with syntax highlighting
- Platform selection buttons for popular services
- Live preview window showing embed appearance
- Security indicator showing current sandbox level
- Apply/Cancel buttons with confirmation dialogs
- Error messages for invalid or dangerous embed codes
- Responsive iframe container with loading indicators
- Settings panel with advanced configuration options

## Technical Specifications

### Dependencies
- HTML sanitization library (DOMPurify or similar) for security
- CSP (Content Security Policy) configuration for iframe restrictions
- Iframe sandboxing with appropriate security attributes
- No external APIs required for basic functionality

### Implementation Details
- Comprehensive embed code parsing and validation system
- Dynamic iframe creation with security-focused sandbox attributes
- CSP header management for embedded content restrictions
- Responsive iframe sizing using ResizeObserver or container queries
- Content loading state management with error handling
- Whitelist-based platform support for known-safe embed sources

### File Structure
```
extension/widgets/embeds-widget.js (implementation)
extension/styles.css (embeds-widget styling)
extension/lib/embed-sanitizer.js (security utilities)
docs/features/embeds-widget.md (this file)
```

## Development Workflow

### Required Functions
- `renderEmbedsWidget(widget, index)` - Creates DOM structure and iframe container
- `setupEmbedsLogic(container, widget, index)` - Handles embed loading and security
- `openEmbedsConfig(existing, index)` - Configuration interface with preview
- `addEmbedsWidget(options)` - Creates new widget instance
- `registerWidget()` call - Registers with widget system

### Settings Schema
```javascript
{
  type: 'embeds',
  x: number,     // Grid X position (0-39)
  y: number,     // Grid Y position (0-23)
  w: number,     // Width in grid units (default: 6)
  h: number,     // Height in grid units (default: 4)
  settings: {
    embedCode: string,           // HTML/JavaScript embed code
    platform: string,           // Detected or selected platform
    securityLevel: string,       // 'strict', 'moderate', 'permissive'
    scalingMode: string,        // 'responsive', 'fixed', 'aspectratio'
    aspectRatio: string,        // '16:9', '4:3', 'custom'
    validateContent: boolean,   // Enable content validation
    allowedDomains: array,     // Whitelisted domains for embeds
    refreshInterval: number,   // Auto-refresh in minutes (0 = disabled)
    fallbackBehavior: string, // 'placeholder', 'error', 'hide'
    lastValidated: timestamp, // Last successful validation
    embedMetadata: object    // Cached embed information
  }
}
```

### Supported Platforms and Patterns
```javascript
const platformPatterns = {
  youtube: {
    pattern: /youtube\.com\/embed\/|youtu\.be\//,
    sandbox: 'allow-scripts allow-same-origin',
    aspectRatio: '16:9'
  },
  twitter: {
    pattern: /platform\.twitter\.com|publish\.twitter\.com/,
    sandbox: 'allow-scripts allow-same-origin allow-popups',
    aspectRatio: 'auto'
  },
  codepen: {
    pattern: /codepen\.io\/.*\/embed/,
    sandbox: 'allow-scripts allow-same-origin',
    aspectRatio: '4:3'
  },
  vimeo: {
    pattern: /player\.vimeo\.com\/video/,
    sandbox: 'allow-scripts allow-same-origin',
    aspectRatio: '16:9'
  },
  spotify: {
    pattern: /open\.spotify\.com\/embed/,
    sandbox: 'allow-scripts allow-same-origin',
    aspectRatio: '16:9'
  }
};
```

### Security Sandbox Levels
```javascript
const securityLevels = {
  strict: {
    sandbox: 'allow-scripts',
    allowedDomains: ['youtube.com', 'vimeo.com', 'codepen.io'],
    validateContent: true,
    description: 'Maximum security, limited functionality'
  },
  moderate: {
    sandbox: 'allow-scripts allow-same-origin',
    allowedDomains: [], // All domains allowed with validation
    validateContent: true,
    description: 'Balanced security and functionality'
  },
  permissive: {
    sandbox: 'allow-scripts allow-same-origin allow-popups allow-forms',
    allowedDomains: [], // All domains allowed
    validateContent: false,
    description: 'Maximum functionality, reduced security'
  }
};
```

## Future Enhancements

### Planned Improvements
- Advanced embed template system for custom integrations
- Embed gallery with community-shared embed codes
- Advanced iframe communication for supported platforms
- Embed performance monitoring and optimization
- Batch embed management for multiple widgets

### Advanced Features (Long-term)
- Custom embed code builder with visual interface
- Integration with content management systems
- Advanced analytics for embed engagement
- Dynamic embed rotation and A/B testing
- Mobile-optimized embed handling and touch interactions
- Integration with bookmark management for embed collections

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

### Security Testing
- [ ] Malicious embed codes are properly sanitized
- [ ] Iframe sandboxing prevents unauthorized access
- [ ] CSP headers block dangerous content
- [ ] Validation catches common exploit patterns
- [ ] Unknown domains are handled safely

### Cross-browser Testing
- [ ] Chrome (primary target)
- [ ] Edge (Chromium-based)
- [ ] Other Chromium browsers (optional)

## Development Notes

### Implementation Challenges
- Balancing security with embed functionality requirements
- Handling diverse embed code formats and validation edge cases
- Responsive iframe sizing across different content types
- CSP configuration that doesn't break legitimate embeds
- Performance optimization for resource-heavy embedded content

### Design Decisions
- Whitelist vs blacklist approach for domain restrictions
- Client-side vs server-side embed validation methods
- Iframe sandbox attributes for different security levels
- Preview functionality implementation and safety measures
- Error handling strategies for blocked or failed embeds

### Security Considerations
- All embed codes must be sanitized before rendering
- Iframe sandbox attributes should be as restrictive as possible
- Unknown domains require additional validation
- User education about embed security risks
- Regular security audits of supported platforms

### Version History
- Future: Initial embeds widget with basic HTML embed support
- Future: Enhanced with platform presets and security sandboxing
- Future: Advanced features with custom validation and performance optimization

---

## Usage Guidelines

### Configuration Instructions
1. Click the widgets button (plus icon)
2. Select "Embeds" from the widget list
3. Choose security level appropriate for your needs
4. Paste embed code into the text area or select a platform preset
5. Use live preview to verify appearance and functionality
6. Configure scaling options for responsive behavior
7. Click "Add" to create the widget

### Tips and Best Practices
- Always use the preview function before applying embed codes
- Choose the strictest security level that still allows your content to function
- Test embeds in different widget sizes to ensure responsive behavior
- Keep a backup of working embed codes for reference
- Regularly update embed codes from source platforms as they may change
- Use platform presets when available for optimal compatibility

### Common Issues and Solutions
- **Embed not loading**: Check that the platform is allowed in security settings
- **Content blocked by CSP**: Adjust security level or add domain to whitelist
- **Responsive sizing issues**: Try different scaling modes or aspect ratio settings
- **Preview shows errors**: Validate embed code syntax and check for typos
- **Performance problems**: Consider reducing auto-refresh intervals or widget size
- **Security warnings**: Review embed source and consider using stricter security settings

### Supported Embed Examples
```html
<!-- YouTube Video -->
<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>

<!-- Twitter Tweet -->
<blockquote class="twitter-tweet"><a href="https://twitter.com/user/status/123"></a></blockquote>
<script async src="https://platform.twitter.com/widgets.js"></script>

<!-- CodePen -->
<iframe height="400" src="https://codepen.io/user/embed/abcdef" frameborder="0" allowtransparency="true"></iframe>

<!-- Spotify Playlist -->
<iframe src="https://open.spotify.com/embed/playlist/37i9dQZF1DX0XUsuxWHRQd" width="300" height="380" frameborder="0"></iframe>
```

### Platform-Specific Notes
- **YouTube**: Use embed URLs (youtube.com/embed/) rather than watch URLs
- **Twitter/X**: May require JavaScript for full functionality
- **CodePen**: Supports both full embed and result-only modes
- **Vimeo**: Similar to YouTube but with different domain patterns
- **Spotify**: Works well for playlists and albums, limited for individual tracks

---

*This widget will provide essential content embedding functionality while demonstrating security-conscious iframe handling patterns for other content-integration widgets.*