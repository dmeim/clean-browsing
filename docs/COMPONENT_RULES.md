# Component Architecture Rules

This document defines the architectural patterns, conventions, and rules for organizing and developing components in the NewTab PlusProMaxUltra extension.

## File Organization

### Core Architecture Files
```
extension/
├── newtab.html          # Main entry point, defines DOM structure
├── settings.js          # Global settings management and persistence
├── widgets.js           # Core widget system and grid management
├── styles.css           # Complete styling system
└── widgets/             # Individual widget implementations
    ├── clock-widget.js
    ├── calculator-widget.js
    ├── date-widget.js
    └── search-widget.js
```

### Loading Order Dependencies
The extension follows a strict loading order that MUST be maintained:

1. **DOM Ready**: `newtab.html` defines structure
2. **Settings Layer**: `settings.js` - Provides global settings object
3. **Widget System**: `widgets.js` - Core widget management functions
4. **Widget Types**: `widgets/*.js` - Individual widget implementations
5. **Initialization**: Event-driven setup after DOM content loaded

## Global State Management

### Settings Object Structure
The `settings` object is the single source of truth for all configuration:

```javascript
const settings = {
  // Background configuration
  background: { type: 'color|image', value: string },
  lastColor: string,
  
  // Global widget appearance defaults
  globalWidgetAppearance: {
    fontSize: number,        // Percentage (100 = default)
    fontWeight: number,      // CSS font-weight values
    italic: boolean,
    underline: boolean,
    textColor: string,       // Hex color
    textOpacity: number,     // Percentage
    backgroundColor: string, // Hex color
    backgroundOpacity: number, // Percentage
    blur: number,           // Backdrop filter blur amount
    borderRadius: number,   // Border radius in pixels
    opacity: number,        // Overall widget opacity
    textAlign: string,      // 'left'|'center'|'right'
    verticalAlign: string,  // 'top'|'center'|'bottom'
    padding: number         // Internal padding in pixels
  },
  
  // Widget instances array
  widgets: [
    {
      type: string,         // Widget type identifier
      x: number,           // Grid X position (0-39)
      y: number,           // Grid Y position (0-23) 
      w: number,           // Width in grid units
      h: number,           // Height in grid units
      settings: object     // Widget-specific configuration
    }
  ]
};
```

### Settings Persistence
Settings are automatically persisted to `localStorage` using these functions:

```javascript
// Load settings from localStorage with defaults
function loadSettings() { /* Merges stored + default settings */ }

// Save settings to localStorage
function saveSettings() { /* Persists current settings object */ }

// Convenience function for save + re-render
function saveAndRender() { /* Calls saveSettings() + renderWidgets() */ }
```

## Widget Registry System

### Registry Pattern
All widgets must register with the global widget system:

```javascript
// Widget registration (called by each widget file)
registerWidget('widget-type', {
  name: 'Display Name',
  render: renderFunction,
  openConfig: configFunction
});

// Registry lookup
const definition = getWidgetDefinition('widget-type');
```

### Global Widget Variables
These variables are available globally after `widgets.js` loads:

```javascript
let widgetGrid;        // Main grid DOM element
let jiggleMode;        // Boolean - edit mode state
let activeIntervals;   // Array - tracks timers for cleanup
let widgetRegistry;    // Object - registered widget types
```

## Component Lifecycle

### Initialization Sequence
1. **DOM Content Loaded**: Core UI elements initialized
2. **Settings Load**: `loadSettings()` called to restore user configuration
3. **Widget Registry**: Widget files register their types
4. **Initial Render**: `renderWidgets()` called to display saved widgets
5. **Event Binding**: UI interactions set up (buttons, drag/drop, etc.)

### Widget Lifecycle
1. **Registration**: Widget type added to registry
2. **Creation**: User configures and adds widget instance
3. **Rendering**: `render{Widget}Widget()` creates DOM elements
4. **Setup**: Widget-specific event handlers and timers initialized
5. **Updates**: Widget responds to settings changes or external events
6. **Cleanup**: Intervals cleared when widget is removed or page refreshed

### Cleanup Requirements
All components must properly clean up resources:

```javascript
// Track intervals for cleanup
const intervalId = setInterval(updateFunction, 1000);
activeIntervals.push(intervalId);

// Cleanup is handled automatically during re-renders
function clearActiveIntervals() {
  activeIntervals.forEach(clearInterval);
  activeIntervals.length = 0;
}
```

## DOM Manipulation Rules

### Element Selection Patterns
Use consistent selectors and caching:

```javascript
// Cache DOM elements during initialization
const settingsButton = document.getElementById('settings-button');
const widgetGrid = document.getElementById('widget-grid');

// Use specific IDs for configuration forms
const configInput = document.getElementById('{widget-type}-{setting-name}');
```

### Container Creation Standards
Always use the provided helper functions:

```javascript
// For widgets - includes positioning, styling, and interaction setup
const container = createWidgetContainer(widget, index, 'additional-class');

// For modals and panels - consistent show/hide patterns
element.classList.add('hidden');    // Hide
element.classList.remove('hidden'); // Show
```

### Event Handling Patterns
Follow consistent event handling approaches:

```javascript
// Button click handlers
button.addEventListener('click', (e) => {
  e.stopPropagation(); // Prevent unintended bubbling
  // Handle click
});

// Form submissions  
form.addEventListener('submit', (e) => {
  e.preventDefault(); // Prevent default form behavior
  // Handle form data
});

// Drag and drop (use provided helpers)
setupJiggleModeControls(container, widget, index);
```

## Naming Conventions

### JavaScript Naming
- **Functions**: camelCase - `renderClockWidget()`, `saveSettings()`
- **Variables**: camelCase - `widgetGrid`, `jiggleMode`, `activeIntervals`
- **Constants**: camelCase - `defaultSettings`, `widgetRegistry`
- **Widget Functions**: Specific pattern - `render{Type}Widget()`, `open{Type}Config()`

### CSS Class Naming
- **Widget Base**: `.{type}-widget` - `.clock-widget`, `.calculator-widget`
- **Component Parts**: `.{component}-{part}` - `.calc-display`, `.calc-button`
- **State Classes**: `.{state}` - `.jiggle-mode`, `.dragging`, `.hidden`
- **Utility Classes**: `.{utility}-{variant}` - `.input-group`, `.checkbox-group`

### HTML ID Naming
- **Static Elements**: kebab-case - `settings-button`, `widget-grid`
- **Dynamic Elements**: `{type}-{setting}` - `clock-show-seconds`, `calc-round-buttons`
- **Form Elements**: Match JavaScript access patterns

### File Naming
- **Widget Files**: `{name}-widget.js` - Always kebab-case with `-widget` suffix
- **Core Files**: Single descriptive word - `settings.js`, `widgets.js`

## Data Flow Architecture

### Unidirectional Data Flow
```
User Interaction → Settings Update → Save to localStorage → Re-render UI
```

### Settings Flow Pattern
1. User interacts with configuration UI
2. Configuration values collected and validated  
3. Settings object updated in memory
4. `saveSettings()` persists to localStorage
5. `renderWidgets()` updates display to match new settings

### Widget Communication
Widgets communicate through the settings system, not direct references:

```javascript
// CORRECT: Update via settings
widget.settings.newValue = value;
saveAndRender();

// INCORRECT: Direct DOM manipulation across widgets
document.querySelector('.other-widget').textContent = value;
```

## Modal and Panel Management

### Panel Visibility Pattern
Consistent show/hide pattern for all modals and panels:

```javascript
// Show pattern
panel.classList.remove('hidden');
relatedButton.classList.add('hidden'); // Hide trigger button

// Hide pattern  
panel.classList.add('hidden');
relatedButton.classList.remove('hidden'); // Show trigger button
```

### Tab Management Pattern
For panels with multiple tabs:

```javascript
// Tab switching logic
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Clear all active states
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.add('hidden'));
    
    // Set new active state
    btn.classList.add('active');
    document.getElementById(`${btn.dataset.tab}-tab`).classList.remove('hidden');
  });
});
```

### Modal Position Management
Modals should reset position on open for consistent UX:

```javascript
if (settings.resetModalPosition) {
  modal.style.transform = 'translate(0, 0)';
}
```

## Helper Functions Standards

### Configuration Helper Usage
Always use provided helpers for consistent behavior:

```javascript
// Widget configuration buttons (save/cancel logic)
setupWidgetConfigButtons(isEdit, 'widget-type', index, addFunction, optionsFunction);

// Widget appearance application
applyWidgetAppearance(container, widget);

// Jiggle mode controls (drag, resize, edit buttons)
setupJiggleModeControls(container, widget, index);
```

### Validation and Error Handling
Implement consistent validation patterns:

```javascript
function validateInput(value, type, min, max) {
  if (type === 'number') {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
  }
  return typeof value === type;
}

function showError(message) {
  console.error(message);
  // Could extend to show user-visible error messages
}
```

## Integration Requirements

### Settings Integration
All components must properly integrate with the settings system:

```javascript
// REQUIRED: Check settings availability
if (typeof settings === 'undefined') {
  console.error('Settings not available');
  return;
}

// REQUIRED: Initialize default widget settings
if (!settings.widgets) settings.widgets = [];

// REQUIRED: Apply global appearance settings
applyWidgetAppearance(container, widget);
```

### Grid System Integration
Components that render in the grid must follow positioning rules:

```javascript
// REQUIRED: Use grid positioning
container.style.gridColumn = `${widget.x + 1} / ${widget.x + widget.w + 1}`;
container.style.gridRow = `${widget.y + 1} / ${widget.y + widget.h + 1}`;

// REQUIRED: Enable container queries for responsive behavior
container.style.containerType = 'size';
```

### Jiggle Mode Integration
Interactive widgets must support edit mode:

```javascript
// REQUIRED: Respond to jiggle mode changes
if (jiggleMode) {
  // Add edit controls, resize handles, etc.
  setupJiggleModeControls(container, widget, index);
}
```

## Performance Considerations

### Efficient Rendering
Minimize DOM manipulation and reflows:

```javascript
// GOOD: Batch DOM changes
const fragment = document.createDocumentFragment();
widgets.forEach(widget => {
  const container = renderWidget(widget);
  fragment.appendChild(container);
});
widgetGrid.appendChild(fragment);

// AVOID: Individual DOM insertions in loops
widgets.forEach(widget => {
  const container = renderWidget(widget);
  widgetGrid.appendChild(container); // Causes multiple reflows
});
```

### Memory Management
Prevent memory leaks through proper cleanup:

```javascript
// Clean up intervals
activeIntervals.forEach(clearInterval);
activeIntervals.length = 0;

// Remove event listeners when elements are destroyed
element.removeEventListener('click', handlerFunction);

// Clear references to DOM elements
componentReferences = null;
```

### Efficient State Updates
Batch state changes when possible:

```javascript
// GOOD: Batch multiple setting changes
widget.settings.prop1 = value1;
widget.settings.prop2 = value2;
widget.settings.prop3 = value3;
saveAndRender(); // Single render

// AVOID: Multiple individual updates
widget.settings.prop1 = value1;
saveAndRender();
widget.settings.prop2 = value2;
saveAndRender(); // Multiple renders
```

## Error Handling Standards

### Defensive Programming
Always check for required dependencies:

```javascript
// Check for required global objects
if (typeof settings === 'undefined') {
  console.error('Settings object not available');
  return;
}

// Check for required DOM elements
const requiredElement = document.getElementById('required-element');
if (!requiredElement) {
  console.error('Required DOM element not found');
  return;
}
```

### Graceful Degradation
Handle missing or invalid data gracefully:

```javascript
// Provide sensible defaults
const locale = widget.settings?.locale || navigator.language || 'en-US';
const fontSize = widget.settings?.fontSize || 100;

// Handle missing widget types
const definition = getWidgetDefinition(widget.type);
if (!definition) {
  console.warn(`Unknown widget type: ${widget.type}`);
  return createErrorWidget(widget, index);
}
```

### User-Facing Error Messages
Provide clear feedback for user-facing errors:

```javascript
function showUserError(container, message) {
  container.innerHTML = `
    <div class="widget-error">
      <div class="error-icon">⚠️</div>
      <div class="error-message">${message}</div>
    </div>
  `;
}
```

## Security Considerations

### Input Validation
Validate all user inputs before processing:

```javascript
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, ''); // Basic XSS prevention
}

function validateNumber(value, min = 0, max = 1000) {
  const num = parseFloat(value);
  if (isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
}
```

### Safe DOM Insertion
Use safe methods for dynamic content:

```javascript
// SAFE: Use textContent for user data
element.textContent = userInput;

// SAFE: Use createElement for structure
const div = document.createElement('div');
div.className = 'safe-class';

// AVOID: innerHTML with user data
element.innerHTML = userInput; // XSS risk
```

These architectural rules ensure consistent, maintainable, and reliable component development across the entire extension.