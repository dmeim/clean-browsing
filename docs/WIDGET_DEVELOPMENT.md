# Widget Development Guide

This guide covers the complete workflow for creating new widgets in the NewTab PlusProMaxUltra extension.

## Widget Architecture Overview

All widgets follow a modular architecture where each widget type has its own dedicated JavaScript file in the `widgets/` directory. Widgets are registered with a central registry system and follow standardized patterns for rendering, configuration, and lifecycle management.

### Core Principles

1. **Separation of Concerns**: Each widget type has its own file
2. **Registry Pattern**: Widgets register themselves with the global registry
3. **Configuration-Driven**: All widget behavior controlled by settings objects
4. **Event-Driven**: Widgets respond to user interactions and system events
5. **Responsive Design**: Widgets adapt to different sizes using container queries

## File Structure Requirements

### Widget File Naming
- **Location**: `extension/widgets/{widget-name}-widget.js`
- **Naming Convention**: Always use kebab-case with `-widget.js` suffix
- **Examples**:
  - `extension/widgets/clock-widget.js`
  - `extension/widgets/calculator-widget.js`
  - `extension/widgets/search-widget.js`

### HTML Integration
Every widget file MUST be loaded in `newtab.html` after `widgets.js`:

```html
<!-- Core widget system -->
<script src="widgets.js"></script>

<!-- Individual widget implementations -->
<script src="widgets/clock-widget.js"></script>
<script src="widgets/calculator-widget.js"></script>
<script src="widgets/your-new-widget.js"></script>
```

## Widget Structure Template

### Basic Widget Template
```javascript
// {WidgetName} Widget Implementation
(function() {
  'use strict';

  function render{WidgetName}Widget(widget, index) {
    // Create widget container with proper classes
    const container = createWidgetContainer(widget, index, '{widget-name}-widget');
    
    // Build widget content
    container.innerHTML = `
      <!-- Widget HTML structure -->
    `;
    
    // Apply appearance styling
    applyWidgetAppearance(container, widget);
    
    // Set up jiggle mode controls
    setupJiggleModeControls(container, widget, index);
    
    // Add to grid
    widgetGrid.appendChild(container);
    
    // Set up widget-specific logic
    setup{WidgetName}Logic(container, widget, index);
  }

  function setup{WidgetName}Logic(container, widget, index) {
    // Widget-specific event handlers and functionality
    // Intervals should be tracked in activeIntervals array
  }

  function add{WidgetName}Widget(options) {
    const widget = {
      type: '{widget-name}',
      x: 0,
      y: 0,
      w: 4, // Default width in grid units
      h: 3, // Default height in grid units
      settings: {
        // Default settings based on options
      }
    };
    settings.widgets.push(widget);
    saveAndRender();
  }

  function open{WidgetName}Config(existing, index) {
    const isEdit = !!existing;
    const targetContainer = isEdit ? document.getElementById('widget-settings-tab') : widgetList;
    
    targetContainer.innerHTML = `
      <h3>${isEdit ? 'Edit {WidgetName} Widget' : '{WidgetName} Widget'}</h3>
      <!-- Configuration form -->
      <div class="widget-config-buttons">
        <button id="{widget-name}-save">${isEdit ? 'Save' : 'Add'}</button>
        <button id="{widget-name}-cancel">${isEdit ? 'Exit' : 'Cancel'}</button>
      </div>
    `;
    
    // Set up save/cancel button handlers
    setupWidgetConfigButtons(isEdit, '{widget-name}', index, add{WidgetName}Widget, () => ({
      // Return configuration object from form
    }));
  }

  // Register the widget with the system
  registerWidget('{widget-name}', {
    name: '{Widget Display Name}',
    render: render{WidgetName}Widget,
    openConfig: open{WidgetName}Config
  });

})();
```

## Required Functions

### 1. `render{WidgetName}Widget(widget, index)`
**Purpose**: Creates and renders the widget's DOM structure.

**Parameters**:
- `widget` - Widget configuration object with position, size, and settings
- `index` - Widget's index in the settings.widgets array

**Requirements**:
- Create container using `createWidgetContainer()`
- Build widget's HTML content
- Apply appearance with `applyWidgetAppearance()`
- Set up jiggle mode with `setupJiggleModeControls()`
- Add container to `widgetGrid`
- Call widget-specific setup function

### 2. `setup{WidgetName}Logic(container, widget, index)`
**Purpose**: Implements widget-specific functionality and event handling.

**Parameters**:
- `container` - DOM element of the widget container
- `widget` - Widget configuration object
- `index` - Widget's index in settings array

**Guidelines**:
- Add event listeners for widget interactions
- Set up timers/intervals (track in `activeIntervals` array)
- Handle widget state updates
- Implement any real-time functionality

### 3. `add{WidgetName}Widget(options)`
**Purpose**: Creates a new widget instance with given configuration.

**Parameters**:
- `options` - Configuration object from the configuration form

**Requirements**:
- Create widget object with proper structure
- Set default position and size
- Apply user options to settings
- Add to `settings.widgets` array
- Call `saveAndRender()`

### 4. `open{WidgetName}Config(existing, index)`
**Purpose**: Opens the configuration interface for the widget.

**Parameters**:
- `existing` - Existing widget object (null for new widgets)
- `index` - Widget index (null for new widgets)

**Requirements**:
- Determine if editing existing widget or creating new one
- Target correct container (settings tab for edit, widget list for new)
- Build configuration form HTML
- Use `setupWidgetConfigButtons()` helper for save/cancel logic

### 5. `registerWidget()` Call
**Purpose**: Registers the widget with the global widget system.

**Required Structure**:
```javascript
registerWidget('{widget-name}', {
  name: '{Display Name}',
  render: render{WidgetName}Widget,
  openConfig: open{WidgetName}Config
});
```

## Widget Object Structure

### Core Widget Properties
```javascript
const widget = {
  type: 'widget-name',     // Widget type identifier
  x: 0,                    // Grid X position (0-39)
  y: 0,                    // Grid Y position (0-23)
  w: 4,                    // Width in grid units
  h: 3,                    // Height in grid units
  settings: {              // Widget-specific configuration
    // Custom settings for this widget type
  }
};
```

### Widget Settings Patterns
```javascript
settings: {
  // Boolean settings
  showSeconds: true,
  enabled: false,
  
  // String settings
  locale: 'auto',
  title: 'My Widget',
  
  // Number settings
  refreshInterval: 60,
  maxItems: 10,
  
  // Color settings (optional, appearance system handles most styling)
  textColor: '#ffffff',
  backgroundColor: 'rgba(255, 255, 255, 0.1)'
}
```

## Configuration Form Patterns

### Form Input Types
```html
<!-- Checkbox inputs -->
<div class="input-group checkbox-group">
  <label><input type="checkbox" id="widget-setting" checked> Setting Label</label>
</div>

<!-- Text inputs -->
<div class="input-group">
  <label for="widget-text">Text Setting</label>
  <input type="text" id="widget-text" placeholder="Placeholder" value="">
</div>

<!-- Number inputs -->
<div class="input-group">
  <label for="widget-number">Number Setting</label>
  <input type="number" id="widget-number" min="1" max="100" value="50">
</div>

<!-- Select dropdowns -->
<div class="input-group">
  <label for="widget-select">Options</label>
  <select id="widget-select">
    <option value="option1">Option 1</option>
    <option value="option2">Option 2</option>
  </select>
</div>
```

### Configuration Buttons
Always use the helper function for consistent behavior:
```javascript
setupWidgetConfigButtons(isEdit, 'widget-name', index, addWidgetFunction, () => ({
  // Return object with form values
  setting1: document.getElementById('widget-setting1').checked,
  setting2: document.getElementById('widget-setting2').value,
  setting3: parseInt(document.getElementById('widget-setting3').value)
}));
```

## Widget Lifecycle Management

### Rendering Lifecycle
1. **Registration**: Widget type registered with `registerWidget()`
2. **Creation**: New widget added via configuration interface
3. **Rendering**: `render{WidgetName}Widget()` called to create DOM
4. **Setup**: Widget-specific logic initialized
5. **Updates**: Widget responds to setting changes
6. **Cleanup**: Intervals cleared when widget removed/refreshed

### Interval Management
All widgets that use timers must track them for proper cleanup:
```javascript
function setup{WidgetName}Logic(container, widget, index) {
  function updateWidget() {
    // Update widget content
  }
  
  // Track interval for cleanup
  const intervalId = setInterval(updateWidget, 1000);
  activeIntervals.push(intervalId);
}
```

### Event Handling Patterns
```javascript
function setup{WidgetName}Logic(container, widget, index) {
  // Button clicks within the widget
  const button = container.querySelector('.widget-button');
  button.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent grid interactions
    // Handle button click
  });
  
  // Form submissions
  const form = container.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Handle form submission
  });
  
  // Keyboard interactions
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      // Handle enter key
    }
  });
}
```

## Container and Styling

### Widget Container Creation
Always use the helper function:
```javascript
const container = createWidgetContainer(widget, index, 'widget-specific-class');
```

This creates a container with:
- Proper grid positioning
- Base widget styling
- Data attributes for interactions
- Responsive container queries enabled

### Widget-Specific Styling
Add widget-specific styles to `styles.css`:
```css
.my-widget {
  /* Widget-specific styles */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.my-widget .widget-title {
  font-size: clamp(0.8rem, 2cqw, 1.2rem);
  margin-bottom: clamp(0.25rem, 1cqw, 0.5rem);
}

.my-widget .widget-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Responsive Sizing
Use container queries for responsive behavior:
```css
.my-widget {
  container-type: size; /* Already set by createWidgetContainer */
}

.my-widget .large-text {
  font-size: clamp(1rem, 4cqw, 3rem);
}

.my-widget .small-text {
  font-size: clamp(0.75rem, 2cqw, 1rem);
}
```

## Integration with Core Systems

### Appearance System
All widgets should support the appearance system:
```javascript
// In render function
applyWidgetAppearance(container, widget);
```

This applies user-configured text size, colors, and other appearance settings.

### Jiggle Mode Integration
Enable edit mode interactions:
```javascript
// In render function
setupJiggleModeControls(container, widget, index);
```

This adds resize handles, drag functionality, and edit controls when jiggle mode is active.

### Settings Integration
Widget settings are automatically saved and loaded:
```javascript
// Settings are automatically persisted when widgets are modified
// Access widget settings via: widget.settings.settingName

// To trigger a re-render after settings change:
saveAndRender();
```

## Advanced Widget Features

### State Management
For widgets with complex state:
```javascript
let widgetStates = {}; // Global state tracking

function setup{WidgetName}Logic(container, widget, index) {
  // Initialize widget state
  widgetStates[index] = {
    isActive: false,
    data: [],
    lastUpdate: null
  };
  
  // Clean up state when widget is removed
  container.addEventListener('widgetRemoved', () => {
    delete widgetStates[index];
  });
}
```

### External API Integration
For widgets that fetch external data:
```javascript
function setup{WidgetName}Logic(container, widget, index) {
  async function fetchData() {
    try {
      const response = await fetch('https://api.example.com/data');
      const data = await response.json();
      updateWidgetContent(container, data);
    } catch (error) {
      console.error('Widget data fetch failed:', error);
      showErrorState(container);
    }
  }
  
  // Initial fetch
  fetchData();
  
  // Periodic updates
  const intervalId = setInterval(fetchData, widget.settings.refreshInterval * 1000);
  activeIntervals.push(intervalId);
}
```

### Error Handling
Implement graceful error handling:
```javascript
function showErrorState(container) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'widget-error';
  errorDiv.textContent = 'Unable to load data';
  container.innerHTML = '';
  container.appendChild(errorDiv);
}

function showLoadingState(container) {
  container.innerHTML = '<div class="widget-loading">Loading...</div>';
}
```

## Testing Widget Implementation

### Manual Testing Checklist
- [ ] Widget appears in widget list
- [ ] Configuration interface opens correctly
- [ ] Widget renders with default settings
- [ ] Widget responds to setting changes
- [ ] Widget works in jiggle mode (drag, resize, edit)
- [ ] Widget cleans up properly when removed
- [ ] Widget persists settings across page reloads
- [ ] Widget appears correctly in different sizes
- [ ] Widget handles errors gracefully

### Common Issues and Solutions

**Widget doesn't appear in list**:
- Check if widget file is loaded in `newtab.html`
- Verify `registerWidget()` call syntax
- Check browser console for JavaScript errors

**Configuration doesn't save**:
- Ensure `setupWidgetConfigButtons()` is called correctly
- Verify form element IDs match those referenced in options function
- Check that `saveAndRender()` is called

**Widget doesn't render**:
- Verify `createWidgetContainer()` is used correctly
- Check that container is added to `widgetGrid`
- Ensure widget object structure is correct

**Styling issues**:
- Add widget-specific CSS classes
- Use container queries for responsive sizing
- Follow established styling patterns from other widgets

## Best Practices

1. **Use IIFE**: Wrap widget code in immediately invoked function expression
2. **Strict Mode**: Always use `'use strict';`
3. **Error Handling**: Implement graceful fallbacks for failures
4. **Performance**: Clean up intervals and event listeners
5. **Accessibility**: Include appropriate ARIA labels and keyboard navigation
6. **Responsive Design**: Use container queries for adaptive layouts
7. **Consistent Naming**: Follow established naming conventions
8. **Documentation**: Comment complex logic and widget-specific behaviors

This guide provides the foundation for creating robust, well-integrated widgets that follow the established patterns and maintain consistency with the overall system architecture.