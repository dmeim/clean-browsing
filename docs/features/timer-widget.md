# Timer Widget

> **Status**: 💡 Idea
> 
> **Development Stage**: Concept
> 
> **Note**: This is a planning document for a feature that is not yet implemented. It may change significantly or not be implemented at all. This document is used for brainstorming and planning purposes only.

## Overview

A countdown timer widget with notifications, multiple preset timers, and visual progress indication for productivity, cooking, and general timing needs.

## Core Features

### Primary Functions
- Hours, minutes, seconds countdown configuration
- Start, pause, stop, and reset controls with clear visual states
- Web notifications when timer expires
- Multiple preset timers for common durations (5min, 10min, 25min, etc.)
- Visual progress indicator (circular or linear progress bar)
- Custom alert sounds (future enhancement)
- Multiple concurrent timers (advanced mode)

### Configuration Options
- **Default Duration**: Set most commonly used timer length
- **Notification Preferences**: Enable/disable browser notifications
- **Alert Sound**: Choose from preset sounds or upload custom
- **Progress Style**: Circular progress ring or linear progress bar
- **Auto-Reset**: Automatically reset timer after completion
- **Preset Timers**: Configure quick-access timer buttons

### User Interface
- Large, clear time display showing remaining time
- Progress indicator showing completion percentage
- Start/pause button (play/pause icon that toggles)
- Stop/reset button for timer management
- Preset timer buttons for quick starts
- Visual state changes (colors, animations) based on timer status
- Notification display area for expired timer alerts

## Technical Specifications

### Dependencies
- Web Notifications API for timer completion alerts
- Audio API for custom alert sounds (future)
- Additional permissions: "notifications" for browser alerts
- High-precision timing using performance.now() for accuracy

### Implementation Details
- Precise countdown calculations accounting for JavaScript timer drift
- Background timer continuation using service workers (if needed)
- Local storage for timer state persistence across page reloads
- Visual progress animation using CSS transforms and transitions
- Notification scheduling and cleanup for multiple timers

### File Structure
```
extension/widgets/timer-widget.js (implementation)
extension/styles.css (timer-widget styling)
extension/resources/sounds/ (alert sound files)
docs/features/timer-widget.md (this file)
```

## Development Workflow

### Required Functions
- `renderTimerWidget(widget, index)` - Creates DOM structure and controls
- `setupTimerLogic(container, widget, index)` - Handles countdown and notifications
- `openTimerConfig(existing, index)` - Configuration interface
- `addTimerWidget(options)` - Creates new widget instance
- `registerWidget()` call - Registers with widget system

### Settings Schema
```javascript
{
  type: 'timer',
  x: number,     // Grid X position (0-39)
  y: number,     // Grid Y position (0-23)
  w: number,     // Width in grid units (default: 4)
  h: number,     // Height in grid units (default: 4)
  settings: {
    defaultDuration: number,    // Default timer length in seconds
    notifications: boolean,     // Enable browser notifications
    alertSound: string,        // Sound file name or 'none'
    progressStyle: string,     // 'circular' or 'linear'
    autoReset: boolean,        // Auto-reset after completion
    presetTimers: array,       // Array of preset durations
    currentState: object,      // Current timer state
    startTime: timestamp,      // When timer was started
    pausedAt: timestamp       // When timer was paused (if paused)
  }
}
```

### Timer State Management
```javascript
const timerStates = {
  STOPPED: 'stopped',    // Timer not running, at default or custom time
  RUNNING: 'running',    // Timer actively counting down
  PAUSED: 'paused',     // Timer paused, can be resumed
  EXPIRED: 'expired'     // Timer completed, showing completion state
};
```

## Future Enhancements

### Planned Improvements
- Pomodoro timer integration with work/break cycles
- Timer history and usage analytics
- Custom timer labels and descriptions
- Batch timer creation for complex workflows
- Integration with calendar for scheduled timers

### Advanced Features (Long-term)
- Multi-timer dashboard showing all active timers
- Timer templates for recurring activities
- Voice control for timer management
- Smart notifications based on device status
- Timer sharing and collaboration features

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
- Maintaining timer accuracy across browser tab switches and system sleep
- Managing multiple concurrent timers without performance issues
- Notification permission handling and fallback for denied permissions
- Visual progress animation performance at different widget sizes
- Timer state persistence across browser sessions and crashes

### Design Decisions
- Single timer per widget vs multi-timer dashboard approach
- Circular vs linear progress visualization for different use cases
- Preset timer configuration vs manual entry for common durations
- Browser notifications vs in-widget alerts for timer completion
- Timer precision requirements (seconds vs milliseconds)

### Version History
- Future: Initial timer widget implementation
- Future: Enhanced with preset timers and progress visualization
- Future: Advanced multi-timer and Pomodoro features

---

## Usage Guidelines

### Configuration Instructions
1. Click the widgets button (plus icon)
2. Select "Timer" from the widget list
3. Set default timer duration
4. Configure notification preferences
5. Set up preset timers for common durations
6. Choose progress visualization style
7. Click "Add" to create the widget
8. Grant notification permission when prompted

### Tips and Best Practices
- Use square widget sizes (4×4 or 5×5) for optimal circular progress display
- Enable notifications to ensure you don't miss timer completion
- Set up preset timers for frequently used durations
- Use descriptive labels for preset timers (e.g., "Tea", "Meeting", "Break")
- Consider auto-reset for recurring timers

### Common Issues and Solutions
- **Timer not accurate**: Check if browser tab is active, consider using background timers
- **Notifications not showing**: Verify notification permission is granted in browser settings
- **Progress animation laggy**: Try smaller widget size or linear progress style
- **Timer resets unexpectedly**: Check auto-reset setting in configuration
- **Sound not playing**: Verify browser audio settings and alert sound configuration
- **Multiple timers interfering**: Each widget instance manages one timer independently

### Preset Timer Suggestions
```javascript
presetTimers: [
  { label: "Quick Break", duration: 300 },      // 5 minutes
  { label: "Tea Timer", duration: 600 },        // 10 minutes  
  { label: "Pomodoro", duration: 1500 },        // 25 minutes
  { label: "Short Meeting", duration: 1800 },   // 30 minutes
  { label: "Lunch Break", duration: 3600 }      // 1 hour
]
```

---

*This widget will provide essential time management functionality and demonstrate notification integration patterns for other time-sensitive widgets.*