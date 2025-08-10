# To-Do/Reminder Widget

> **Status**: ⭕ Planned
> 
> **Development Stage**: Planning
> 
> **Note**: This is a planning document for a feature that is not yet implemented. It may change significantly or not be implemented at all. This document is used for brainstorming and planning purposes only.

## Overview

A comprehensive task management widget with due dates, notifications, priority levels, and organizational features for productivity and reminder management.

## Core Features

### Primary Functions
- Add, edit, remove, and complete tasks with intuitive interface
- Due date and time assignment with calendar picker integration
- Priority levels (High, Medium, Low) with visual indicators
- Web notifications for due and overdue items
- Task completion with strikethrough and completion timestamps
- Sort options by date, priority, alphabetical, or creation order
- Task categories/tags for organization and filtering
- Recurring tasks support for regular reminders
- Search functionality across all tasks

### Configuration Options
- **Notification Timing**: Advance warning times (5min, 15min, 1hr, 1day before due)
- **Default Priority**: Set default priority level for new tasks
- **Sorting Preferences**: Default sort method and direction
- **Display Options**: Show/hide completed tasks, compact/detailed view
- **Date Format**: Due date display format preferences
- **Recurring Patterns**: Setup for daily, weekly, monthly recurring tasks
- **Category Management**: Create and manage task categories

### User Interface
- Clean task list with checkboxes for completion
- Add task input field with quick-add functionality
- Priority indicators using color coding or icons
- Due date display with overdue highlighting
- Category tags with color coding
- Compact/expanded view toggle for space efficiency
- Search/filter bar for finding specific tasks
- Settings panel for managing categories and preferences
- Notification status indicators

## Technical Specifications

### Dependencies
- Web Notifications API for due date alerts
- Local storage for task persistence with backup/export options
- Date/Time picker component for due date selection
- Additional permissions: "notifications" for browser alerts

### Implementation Details
- Task data structure with metadata (creation time, completion time, etc.)
- Efficient task filtering and sorting algorithms
- Notification scheduling system with cleanup on task deletion
- Recurring task generation with smart date calculation
- Data export/import functionality for backup and migration
- Search indexing for fast task lookup across large datasets

### File Structure
```
extension/widgets/todo-widget.js (implementation)
extension/styles.css (todo-widget styling)
docs/features/todo-widget.md (this file)
```

## Development Workflow

### Required Functions
- `renderTodoWidget(widget, index)` - Creates DOM structure and task list
- `setupTodoLogic(container, widget, index)` - Handles task management and notifications
- `openTodoConfig(existing, index)` - Configuration interface
- `addTodoWidget(options)` - Creates new widget instance
- `registerWidget()` call - Registers with widget system

### Settings Schema
```javascript
{
  type: 'todo',
  x: number,     // Grid X position (0-39)
  y: number,     // Grid Y position (0-23)
  w: number,     // Width in grid units (default: 6)
  h: number,     // Height in grid units (default: 6)
  settings: {
    notificationTiming: array,     // Advance warning times in minutes
    defaultPriority: string,       // 'high', 'medium', 'low'
    sortBy: string,               // 'date', 'priority', 'alphabetical', 'created'
    sortDirection: string,        // 'asc', 'desc'
    showCompleted: boolean,       // Display completed tasks
    compactView: boolean,         // Compact vs detailed task display
    dateFormat: string,          // Due date display format
    categories: array,           // User-defined task categories
    tasks: array,               // Array of task objects
    lastBackup: timestamp       // Last export/backup timestamp
  }
}
```

### Task Data Structure
```javascript
const taskStructure = {
  id: string,              // Unique task identifier
  title: string,           // Task description/title
  completed: boolean,      // Completion status
  priority: string,        // 'high', 'medium', 'low'
  dueDate: timestamp,      // Due date/time (null if no due date)
  category: string,        // Task category/tag
  createdAt: timestamp,    // Creation timestamp
  completedAt: timestamp,  // Completion timestamp (null if not completed)
  recurring: object,       // Recurring pattern configuration
  notes: string,          // Additional task notes/description
  notificationSent: boolean // Whether due notification was sent
};
```

## Future Enhancements

### Planned Improvements
- Subtask support with hierarchical task organization
- Task templates for common recurring patterns
- Time tracking integration with start/stop timers
- Task collaboration and sharing features
- Integration with calendar applications (Google Calendar, Outlook)
- Advanced recurring patterns (every N days, specific weekdays, etc.)

### Advanced Features (Long-term)
- Project management with task grouping and milestones
- Task dependencies and workflow management
- Advanced analytics and productivity insights
- Voice input for quick task creation
- Integration with external task management services
- Smart task suggestions based on patterns and history

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
- Notification permission handling and graceful fallbacks
- Efficient task storage and retrieval for large task lists
- Recurring task generation without creating excessive storage usage
- Due date calculation across time zones and daylight saving changes
- Search performance optimization for large datasets

### Design Decisions
- Local storage vs cloud sync for task persistence
- Single widget with all tasks vs categorized widget instances
- Notification timing granularity and user control options
- Task completion behavior (hide, strikethrough, or archive)
- Category/tag system implementation and visual representation

### Version History
- Future: Initial todo widget implementation with basic task management
- Future: Enhanced with due dates, notifications, and priority system
- Future: Advanced features including categories, recurring tasks, and search

---

## Usage Guidelines

### Configuration Instructions
1. Click the widgets button (plus icon)
2. Select "To-Do/Reminder" from the widget list
3. Configure notification preferences and default settings
4. Set up task categories if desired
5. Choose display options (compact/detailed, show completed)
6. Click "Add" to create the widget
7. Grant notification permission when prompted

### Tips and Best Practices
- Use larger widget sizes (6×6 or larger) for comfortable task management
- Set realistic due dates to avoid notification fatigue
- Use priority levels to focus on important tasks first
- Create categories for different areas of life (Work, Personal, Health)
- Regularly review and complete old tasks to maintain organization
- Export task data periodically as backup

### Common Issues and Solutions
- **Notifications not showing**: Verify notification permission in browser settings
- **Tasks not saving**: Check browser storage space and settings persistence
- **Due dates incorrect**: Verify browser timezone settings and date format preferences
- **Performance slow with many tasks**: Enable compact view or archive completed tasks
- **Categories not working**: Ensure category names are unique and properly saved
- **Recurring tasks creating duplicates**: Check recurring task settings and cleanup old instances

### Task Organization Best Practices
```
Recommended Categories:
- Work: Professional tasks and deadlines
- Personal: Household and personal commitments
- Health: Medical appointments and wellness reminders
- Finance: Bills, payments, and financial deadlines
- Projects: Specific project-related tasks

Priority Guidelines:
- High: Urgent and important (due soon, critical)
- Medium: Important but not urgent (can wait a few days)
- Low: Nice to have, no specific deadline
```

### Recurring Task Examples
```javascript
recurringPatterns: [
  { type: 'daily', interval: 1 },           // Every day
  { type: 'weekly', interval: 1, days: [1,3,5] }, // Mon, Wed, Fri
  { type: 'monthly', interval: 1, date: 15 },      // 15th of each month
  { type: 'yearly', interval: 1, month: 12, date: 25 } // December 25th annually
]
```

---

*This widget will provide essential productivity and task management functionality, demonstrating notification integration and data management patterns for other organizational widgets.*