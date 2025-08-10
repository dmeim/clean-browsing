# Notes Widget

> **Status**: ⭕ Planned
> 
> **Development Stage**: Planning
> 
> **Note**: This is a planning document for a feature that is not yet implemented. It may change significantly or not be implemented at all. This document is used for brainstorming and planning purposes only.

## Overview

A sticky note functionality widget providing multi-line text editing with rich text support, auto-save capabilities, and export functionality for quick note-taking and reminders.

## Core Features

### Primary Functions
- Multi-line text editing with textarea input
- Auto-save functionality with configurable intervals
- Rich text formatting (bold, italic, colors)
- Font size adjustment for readability
- Character and word count display
- Export notes to text file
- Note persistence across browser sessions

### Configuration Options
- **Font Family**: Choose from system fonts or custom font stack
- **Default Formatting**: Set default text style for new notes
- **Auto-save Interval**: Configure save frequency (1min, 5min, 15min, manual)
- **Max Character Limit**: Optional character limit with warning
- **Word Wrap**: Enable/disable word wrapping

### User Interface
- Clean textarea with minimal borders
- Formatting toolbar (when rich text enabled)
- Character counter in corner
- Auto-resize height based on content
- Export button for saving notes
- Visual save indicator showing last saved time

## Technical Specifications

### Dependencies
- Local storage for note persistence
- Rich text editor library (TinyMCE, Quill, or custom implementation)
- File download API for export functionality
- No external APIs required - fully offline functionality

### Implementation Details
- Debounced auto-save to prevent excessive localStorage writes
- Rich text content stored as HTML with sanitization
- Export functionality using Blob API and download links
- Responsive textarea sizing with minimum/maximum heights
- Integration with global appearance system for styling

### File Structure
```
extension/widgets/notes-widget.js (implementation)
extension/styles.css (notes-widget styling)
docs/features/notes-widget.md (this file)
```

## Development Workflow

### Required Functions
- `renderNotesWidget(widget, index)` - Creates DOM structure and editor
- `setupNotesLogic(container, widget, index)` - Handles editing and auto-save
- `openNotesConfig(existing, index)` - Configuration interface
- `addNotesWidget(options)` - Creates new widget instance
- `registerWidget()` call - Registers with widget system

### Settings Schema
```javascript
{
  type: 'notes',
  x: number,     // Grid X position (0-39)
  y: number,     // Grid Y position (0-23)
  w: number,     // Width in grid units (default: 6)
  h: number,     // Height in grid units (default: 4)
  settings: {
    fontFamily: string,      // Font family for notes text
    defaultFormatting: object, // Default rich text styles
    autoSaveInterval: number, // Auto-save interval in minutes
    maxCharacters: number,   // Character limit (0 = unlimited)
    wordWrap: boolean,       // Enable word wrapping
    content: string,         // Current note content
    lastSaved: timestamp     // Last save timestamp
  }
}
```

## Future Enhancements

### Planned Improvements
- Multiple notes per widget with tab system
- Note categories and tagging system
- Search functionality across all notes
- Note sharing via URL or export
- Markdown support for structured notes

### Advanced Features (Long-term)
- Collaborative editing with real-time sync
- Note templates for common use cases
- Integration with cloud storage services
- Voice-to-text note input
- Handwriting recognition for stylus input

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

### Cross-browser Testing
- [ ] Chrome (primary target)
- [ ] Edge (Chromium-based)
- [ ] Other Chromium browsers (optional)

## Development Notes

### Implementation Challenges
- Rich text editor integration without bloating the extension
- Auto-save performance with large notes
- HTML sanitization for security
- Responsive editor sizing within grid constraints
- File export functionality within extension context

### Design Decisions
- Simple textarea approach vs full rich text editor
- Local storage vs IndexedDB for note persistence
- Auto-save frequency balance between UX and performance
- Export format options (plain text, HTML, markdown)

### Version History
- Future: Initial notes widget implementation

---

## Usage Guidelines

### Configuration Instructions
1. Click the widgets button (plus icon)
2. Select "Notes" from the widget list
3. Configure font preferences and auto-save settings
4. Set character limits if desired
5. Click "Add" to create the widget
6. Resize to desired size for comfortable editing

### Tips and Best Practices
- Use larger widget sizes (6×4 or larger) for comfortable editing
- Enable auto-save for important notes to prevent data loss
- Consider character limits for performance with very large notes
- Use export functionality to backup important notes
- Rich text formatting should be used sparingly for better performance

### Common Issues and Solutions
- **Note not saving**: Check auto-save settings and ensure sufficient storage space
- **Rich text formatting lost**: Verify HTML content is properly sanitized and stored
- **Editor too small**: Increase widget size to provide more editing space
- **Export not working**: Ensure browser allows downloads from extensions
- **Performance issues**: Consider reducing auto-save frequency or character limits

---

*This widget will provide essential note-taking functionality and demonstrate rich text editing patterns for future content-focused widgets.*