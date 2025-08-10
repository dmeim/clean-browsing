# Stopwatch Widget

> **Status**: ⭕ Planned
> 
> **Development Stage**: Planning
> 
> **Note**: This is a planning document for a feature that is not yet implemented. It may change significantly or not be implemented at all. This document is used for brainstorming and planning purposes only.

## Overview

A precision stopwatch widget with lap timing functionality, providing accurate time measurements for sports, productivity tracking, and general timing needs.

## Core Features

### Primary Functions
- Precision stopwatch with millisecond accuracy
- Start/stop toggle button for timing control
- Lap time recording with timestamp markers
- Reset functionality to clear all recorded times
- Lap time history display with scrollable list
- Export lap times to text or CSV format
- Split time vs lap time display modes
- Visual time formatting (MM:SS.mmm or HH:MM:SS.mmm)

### Configuration Options
- **Precision Level**: Display milliseconds, centiseconds, or seconds only
- **Max Laps Display**: Number of recent lap times to show (5, 10, 20, unlimited)
- **Auto-Reset Options**: Reset on start, manual reset only, or time-based reset
- **Time Format**: Choose between different time display formats
- **Export Format**: Text file or CSV export options
- **Sound Feedback**: Audio cues for lap recording (optional)

### User Interface
- Large, prominent time display with high contrast
- Single start/stop button with clear visual states
- Lap button for recording split times
- Reset button for clearing stopwatch
- Scrollable lap time history with timestamps
- Export button for saving lap data
- Visual feedback for button presses and state changes
- Color-coded lap times (fastest, slowest, average indicators)

## Technical Specifications

### Dependencies
- High-precision timing using `performance.now()` for accuracy
- Local storage for lap time persistence
- File download API for lap time export
- No external APIs required - fully offline functionality

### Implementation Details
- Continuous time calculation to prevent drift from setInterval inaccuracy
- Lap time storage with efficient array management for large datasets
- Real-time DOM updates optimized for performance
- State persistence across browser sessions and widget reloads
- Memory management for long-duration timing sessions
- Precision timing calculations accounting for JavaScript execution delays

### File Structure
```
extension/widgets/stopwatch-widget.js (implementation)
extension/styles.css (stopwatch-widget styling)
docs/features/stopwatch-widget.md (this file)
```

## Development Workflow

### Required Functions
- `renderStopwatchWidget(widget, index)` - Creates DOM structure and display
- `setupStopwatchLogic(container, widget, index)` - Handles timing and lap recording
- `openStopwatchConfig(existing, index)` - Configuration interface
- `addStopwatchWidget(options)` - Creates new widget instance
- `registerWidget()` call - Registers with widget system

### Settings Schema
```javascript
{
  type: 'stopwatch',
  x: number,     // Grid X position (0-39)
  y: number,     // Grid Y position (0-23)
  w: number,     // Width in grid units (default: 4)
  h: number,     // Height in grid units (default: 5)
  settings: {
    precisionLevel: string,    // 'milliseconds', 'centiseconds', 'seconds'
    maxLapsDisplay: number,    // Maximum lap times to show
    autoReset: string,         // 'onstart', 'manual', 'timed'
    timeFormat: string,        // 'MMSS', 'HHMMSS', 'compact'
    exportFormat: string,      // 'text', 'csv', 'json'
    soundFeedback: boolean,    // Audio cues for interactions
    currentState: object,      // Current stopwatch state
    lapTimes: array,          // Array of recorded lap times
    startTime: timestamp,     // When stopwatch was started
    elapsedTime: number      // Total elapsed time in milliseconds
  }
}
```

### Stopwatch State Management
```javascript
const stopwatchStates = {
  STOPPED: 'stopped',    // Stopwatch not running, shows 00:00.000
  RUNNING: 'running',    // Stopwatch actively timing
  PAUSED: 'paused',     // Stopwatch paused, can be resumed (future)
  RESET: 'reset'        // Stopwatch reset to zero with cleared laps
};
```

## Future Enhancements

### Planned Improvements
- Split time mode showing interval between laps vs total elapsed time
- Stopwatch comparison mode for multiple simultaneous timings
- Custom lap labels and descriptions
- Statistics analysis (average lap time, fastest/slowest laps)
- Integration with fitness tracking applications

### Advanced Features (Long-term)
- Multi-stopwatch dashboard with synchronized timing
- Advanced statistics and lap time analysis
- Voice control for hands-free operation
- Integration with external timing systems
- Lap time sharing and collaboration features
- Photo/video synchronization for timed events

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
- Maintaining precision timing accuracy over extended periods
- Managing memory usage with large numbers of lap times
- Preventing timing drift from JavaScript execution delays
- Responsive UI updates during rapid lap recording
- State persistence during browser tab switches and system sleep

### Design Decisions
- Chose `performance.now()` over `Date.now()` for better precision
- Single widget per stopwatch vs multi-timing dashboard approach
- Lap time storage limit vs unlimited history with performance trade-offs
- Export functionality prioritizing simple formats over complex analysis
- Visual design emphasizing readability and quick interaction

### Version History
- Future: Initial stopwatch widget implementation with basic timing
- Future: Enhanced with lap recording and export functionality
- Future: Advanced statistics and multi-timing features

---

## Usage Guidelines

### Configuration Instructions
1. Click the widgets button (plus icon)
2. Select "Stopwatch" from the widget list
3. Configure precision level and display preferences
4. Set lap recording options and export format
5. Click "Add" to create the widget
6. Use Start/Stop and Lap buttons for timing

### Tips and Best Practices
- Use larger widget sizes (5×6 or 6×5) for optimal lap history display
- Choose precision level based on your timing needs (milliseconds for sports, seconds for general use)
- Enable sound feedback for hands-free lap recording confirmation
- Export lap times regularly to prevent data loss from browser issues
- Reset stopwatch between different timing sessions for clarity

### Common Issues and Solutions
- **Timing appears inaccurate**: Check if browser tab is active; background timing may be throttled
- **Lap times not saving**: Verify sufficient browser storage space and permissions
- **Export not working**: Ensure browser allows downloads and check file format settings
- **Performance issues with many laps**: Consider reducing max lap display or exporting/clearing old laps
- **Display too cluttered**: Increase widget size or reduce lap display count in settings
- **Stopwatch resets unexpectedly**: Check auto-reset settings and browser session handling

### Lap Time Management
```
Best Practices:
- Record laps consistently for accurate interval analysis
- Use descriptive export filenames with date/time stamps
- Clear old lap data periodically to maintain performance
- Export important timing sessions before browser updates/changes
```

---

*This widget will provide essential precision timing functionality and demonstrate high-accuracy timing patterns for other time-sensitive widgets.*