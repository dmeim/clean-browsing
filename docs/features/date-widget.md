# Date Widget

> **Status**: ✅ Completed
> 
> **Development Stage**: Shipped

## Overview

A powerful and flexible date display widget powered by Day.js, offering complete format customization through Day.js format strings, comprehensive locale support, and live preview functionality.

## Core Features

### Primary Functions
- **Complete format customization** using Day.js format strings
- Support for ALL Day.js tokens (YYYY, MM, DD, dddd, MMMM, Do, etc.)
- Locale-based formatting with automatic browser detection
- Dynamic locale loading for international support
- Live preview with instant validation
- Helpful examples and token reference built into UI
- Responsive text sizing based on widget dimensions
- Real-time date updates (refreshes every minute)

### Configuration Options
- **Format**: Enter any valid Day.js format string
- **Locale**: Specify language/region code or use 'auto' for browser detection
- **Live Preview**: See your format in action as you type
- **Built-in Help**: Examples and token reference directly in the UI

### User Interface
- Clean, centered date display
- Responsive font sizing using container queries
- Glassmorphism styling with global appearance inheritance
- Live preview showing exact formatting during setup
- Optimal readability with text shadows and spacing

## Technical Specifications

### Dependencies
- **Day.js** library (2KB gzipped) for powerful date formatting
- Day.js plugins: AdvancedFormat, LocalizedFormat, CustomParseFormat
- Dynamic locale loading via CDN for international support
- JavaScript Date API for date calculations
- No external APIs required for core functionality

### Implementation Details
- **Simplified single-input interface** for maximum flexibility
- Minute-based update system using setInterval for accuracy
- **Day.js integration** for professional date formatting
- Support for ALL Day.js format tokens
- Live validation with helpful error messages
- Dynamic locale loading on-demand to minimize bandwidth
- Locale fallback system with browser detection
- Backward compatibility with legacy preset formats
- Responsive sizing with container queries

### File Structure
```
extension/widgets/date-widget.js (implementation)
extension/styles.css (date-widget styling)  
docs/features/date-widget.md (this file)
```

## Development Workflow

### Required Functions
- ✅ `renderDateWidget(widget, index)` - Creates DOM structure and starts daily timer
- ✅ `setupDateLogic(container, widget, index)` - Handles date updates (integrated in render)
- ✅ `openDateConfig(existing, index)` - Configuration interface with live preview
- ✅ `addDateWidget(options)` - Creates new widget instance
- ✅ `registerWidget()` call - Registers with widget system

### Settings Schema
```javascript
{
  type: 'date',
  x: number,     // Grid X position (0-39)
  y: number,     // Grid Y position (0-23)
  w: number,     // Width in grid units (default: 4)
  h: number,     // Height in grid units (default: 2)
  settings: {
    format: string,      // Day.js format string (default: 'YYYY-MM-DD')
    locale: string       // Language/region code or 'auto'
  }
}
```

### Format Examples

Using Day.js tokens, you can create any date format you want:

#### Common Formats
- **YYYY-MM-DD** → 2025-01-14 (ISO standard)
- **MM/DD/YYYY** → 01/14/2025 (US format)
- **DD/MM/YYYY** → 14/01/2025 (EU format)
- **MMMM D, YYYY** → January 14, 2025
- **dddd, MMMM Do YYYY** → Tuesday, January 14th 2025
- **MMM D, YYYY** → Jan 14, 2025
- **DD-MMM-YYYY** → 14-Jan-2025

#### Creative Formats
- **[Today is] dddd** → Today is Tuesday
- **YYYY [Week] w** → 2025 Week 3
- **Q[Q] YYYY** → 1Q 2025
- **DD • MM • YYYY** → 14 • 01 • 2025
- **MMMM Do [at] h:mm A** → January 14th at 3:30 PM
- **YYYY-MM-DD HH:mm:ss** → 2025-01-14 15:30:45

#### Localized Formats (with LocalizedFormat plugin)
- **L** → Locale default date
- **LL** → Locale long date
- **LLL** → Locale date with time
- **LLLL** → Full locale date with weekday

#### Day.js Format Tokens

| Token | Output | Description |
|-------|---------|-------------|
| `YYYY` | 2025 | 4-digit year |
| `YY` | 25 | 2-digit year |
| `MM` | 01-12 | 2-digit month |
| `M` | 1-12 | Month |
| `MMMM` | January | Full month name |
| `MMM` | Jan | Short month name |
| `DD` | 01-31 | 2-digit day |
| `D` | 1-31 | Day |
| `Do` | 1st, 2nd | Day with ordinal |
| `dddd` | Monday | Full weekday |
| `ddd` | Mon | Short weekday |
| `dd` | Mo | Min weekday |
| `HH` | 00-23 | 24-hour hour |
| `H` | 0-23 | 24-hour |
| `hh` | 01-12 | 12-hour hour |
| `h` | 1-12 | 12-hour |
| `mm` | 00-59 | Minutes |
| `m` | 0-59 | Minute |
| `ss` | 00-59 | Seconds |
| `s` | 0-59 | Second |
| `A` | AM/PM | Uppercase |
| `a` | am/pm | Lowercase |
| `w` | 1-53 | Week of year |
| `Q` | 1-4 | Quarter |
| `X` | 1410715640 | Unix timestamp |
| `[text]` | text | Escaped text |

## Future Enhancements

### Planned Improvements
- Time zone display options with Day.js timezone plugin
- Calendar integration showing events/holidays
- Countdown to specific dates functionality
- Relative time display (e.g., "2 days ago")
- Duration calculations between dates

### Advanced Features (Long-term)
- Holiday and special date highlighting
- Multi-language day/month names
- Custom date format builder with preview
- Integration with calendar applications
- Historical date information display

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
- Integrating Day.js while maintaining backward compatibility
- Dynamic locale loading without impacting performance
- Handling invalid custom format strings gracefully
- Ensuring all existing saved widgets continue working
- Minimizing CDN dependencies for offline usage

### Design Decisions
- **Simplified to single input**: Removed preset dropdown for cleaner UX
- **Direct format control**: Users type exactly what they want to see
- **Integrated Day.js**: Professional formatting without reinventing the wheel
- **Live preview with validation**: Immediate feedback on format validity
- **Helpful inline documentation**: Examples and tokens right in the UI
- **Backward compatibility**: Legacy formats automatically converted
- **Minute-based updates**: Balance between accuracy and performance

### Version History
- v0.1.0: Initial date widget with basic MM/DD/YYYY format
- v0.1.4: Added comprehensive format system and separator options
- v0.2.0: Enhanced with locale support and live preview functionality
- v0.3.0: Integrated Day.js for powerful custom format support
- v0.3.1: Simplified to single format input for better UX

---

## Usage Guidelines

### Configuration Instructions
1. Click the widgets button (⬚)
2. Select "Date" from the widget list
3. Enter your desired Day.js format string (e.g., "YYYY-MM-DD")
4. Optionally set a specific locale (leave blank for auto-detection)
5. Use the live preview to confirm your format
6. Click "Add" to create the widget

### Tips and Best Practices
- **Start simple**: Try `YYYY-MM-DD` or `MM/DD/YYYY` first
- **Use the examples**: Copy and modify the provided examples
- **Preview first**: Always check the live preview before saving
- **Escape text**: Use brackets for literal text: `[Today is] dddd`
- **Size appropriately**: Longer formats need wider widgets
- **Locale matters**: Month/day names change with locale settings
- **Get creative**: Combine tokens for unique displays

### Common Issues and Solutions
- **"Invalid Format" error**: Check that tokens are uppercase (YYYY not yyyy)
- **Date truncated**: Increase widget width for longer formats
- **Wrong language**: Verify locale code (e.g., 'es' not 'spanish')
- **Preview not updating**: Format may be invalid - check console for errors
- **Tokens showing as text**: Remember tokens are case-sensitive
- **Locale not working**: Falls back to English if locale unavailable
- **Time not updating**: Widget refreshes every minute, not every second

### Format Recommendations by Use Case
- **International**: YYYY/MM/DD or DD/MM/YYYY
- **US Standard**: MM/DD/YYYY or Month DD, YYYY
- **European**: DD/MM/YYYY or DD Month YYYY  
- **Compact**: MM/DD/YY or DD/MM/YY
- **Descriptive**: Day, Month DD, YYYY
- **Minimal**: Month DD or DD Month

---

*This widget demonstrates the power of simplicity - by giving users direct access to Day.js formatting, we provide unlimited flexibility with a cleaner, more intuitive interface.*