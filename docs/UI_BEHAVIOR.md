# UI Behavior Standards

This document defines the interaction patterns, user experience standards, and behavioral rules for the NewTab PlusProMaxUltra extension interface.

## Core UI Principles

### Design Philosophy
- **Glassmorphism Aesthetic**: Translucent elements with backdrop blur effects
- **Smooth Interactions**: Fluid animations with consistent easing curves
- **Contextual Feedback**: Visual responses that guide user understanding
- **Non-Destructive Editing**: Safe exploration with clear save/cancel patterns
- **Progressive Disclosure**: Advanced features revealed contextually

### Interaction States
All interactive elements follow a consistent state system:

1. **Default**: Base appearance with subtle visual cues
2. **Hover**: Enhanced visibility and gentle animation
3. **Active/Focus**: Clear indication of current interaction
4. **Disabled**: Reduced opacity with no interaction capability
5. **Loading**: Animation or indicator during async operations

## Grid System Behavior

### Default Mode (Navigation)
- **Grid Structure**: Fixed 40×24 invisible grid system
- **Widget Interactions**: Widgets respond to hover with gentle lift effect
- **Background**: Solid gradient background with subtle animated overlays
- **Scrolling**: Page is fixed height - no vertical scrolling

```css
/* Default widget hover behavior */
.widget:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.2);
}
```

### Jiggle Mode (Edit Mode)
Activated by clicking the edit button (pencil icon → checkmark when active).

#### Visual Changes
- **Grid Overlay**: Semi-transparent grid lines appear showing 40×24 layout
- **Grid Animation**: Subtle pulsing effect on the entire grid
- **Widget Animation**: All widgets jiggle with gentle rotation and scale
- **Background Enhancement**: Additional animated gradient overlays

```css
/* Grid visualization in jiggle mode */
#widget-grid.jiggle-mode::before {
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.6) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.6) 1px, transparent 1px);
}

/* Widget jiggle animation */
.jiggle-mode .widget {
  animation: jiggle 0.5s ease-in-out infinite alternate;
}
```

#### Interactive Features
1. **Drag and Drop**: Click and drag widgets to reposition
2. **Resize Handles**: Three resize handles appear on each widget
3. **Widget Actions**: Remove and settings buttons appear
4. **Drop Previews**: Visual feedback shows valid drop positions

### Edit Mode Interactions

#### Drag and Drop Behavior
- **Drag Initiation**: Mouse down on widget (not on buttons/controls)
- **Drag Preview**: Teal dashed outline shows target position
- **Drop Validation**: Preview only appears for valid grid positions
- **Smooth Transition**: Widget animates to final position on drop
- **Grid Snapping**: Widgets automatically align to grid boundaries

```javascript
// Drag preview styling
.drag-preview-indicator {
  background: rgba(120, 255, 198, 0.2);
  border: 2px dashed rgba(120, 255, 198, 0.6);
  animation: pulse-preview 1s ease-in-out infinite;
}
```

#### Resize Handle System
Three resize handles provide different resize capabilities:

1. **Southeast Handle** (bottom-right corner):
   - Resizes both width and height proportionally
   - Cursor: `se-resize`
   - Visual: Diagonal line pattern

2. **South Handle** (bottom edge):
   - Resizes height only
   - Cursor: `s-resize`
   - Visual: Horizontal resize indicator

3. **East Handle** (right edge):
   - Resizes width only
   - Cursor: `e-resize`
   - Visual: Vertical resize indicator

```css
/* Resize handle styling */
.jiggle-mode .widget .resize-handle {
  background-color: rgba(120, 119, 198, 0.1);
  border: 1px solid rgba(120, 119, 198, 0.2);
  transition: background-color 0.2s ease;
}

.jiggle-mode .widget .resize-handle:hover {
  background-color: rgba(120, 119, 198, 0.4);
  border-color: rgba(120, 119, 198, 0.6);
}
```

#### Widget Action Buttons
Two action buttons appear in jiggle mode:

1. **Remove Button** (×):
   - Position: Top-left corner
   - Color: Red accent on hover
   - Behavior: Instant removal (no confirmation)
   - Keyboard: Delete key when widget focused

2. **Settings Button** (⚙️):
   - Position: Top-right corner  
   - Color: Blue accent on hover
   - Behavior: Opens widget configuration panel
   - Keyboard: Enter key when widget focused

## Panel and Modal System

### Panel Types and Behavior

#### Settings Panel (Right Slide-in)
- **Trigger**: Settings button (gear icon)
- **Animation**: Slides in from the right edge
- **Backdrop**: Semi-transparent overlay
- **Tabs**: Horizontal tab system with smooth transitions
- **Close**: Close button or clicking outside panel area

```css
/* Settings panel slide animation */
.settings-modal {
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.settings-modal:not(.hidden) {
  transform: translateX(0);
}
```

#### Widgets Panel (Center Modal)
- **Trigger**: Widgets button (plus icon)
- **Animation**: Fade in with gentle scale effect
- **Position**: Centered with backdrop blur
- **Modes**: Widget list view → Configuration view
- **Close**: Close button, escape key, or clicking backdrop

#### Tab System Behavior
Both panels use consistent tab switching:

1. **Active Indicator**: Highlighted tab button with accent color
2. **Content Switching**: Smooth fade between tab contents
3. **State Preservation**: Tab contents remain in DOM (hidden/shown)
4. **Keyboard Navigation**: Arrow keys move between tabs

### Button Behavior Standards

#### Action Buttons (Bottom-right)
Floating action buttons follow consistent interaction patterns:

```css
/* Standard action button hover effect */
.action-button:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

/* Shine effect on hover */
.action-button:hover::before {
  left: 100%; /* Slide shine effect across button */
}
```

#### Primary Actions
- **Color**: Enhanced glassmorphism with accent glow
- **Animation**: Lift and scale on hover
- **Feedback**: Shine effect sweeps across surface
- **States**: Clear hover, active, and disabled appearances

#### Secondary Actions  
- **Color**: Subtle glassmorphism without accent
- **Animation**: Gentle lift on hover
- **Feedback**: Increased opacity and border brightness
- **Usage**: Cancel, close, and supporting actions

### Form Input Behavior

#### Input Field Standards
All form inputs follow consistent styling and behavior:

```css
/* Standard input styling */
input, select, textarea {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  padding: 0.5rem 0.75rem;
}

/* Focus state */
input:focus, select:focus, textarea:focus {
  border-color: rgba(120, 119, 198, 0.5);
  box-shadow: 0 0 0 2px rgba(120, 119, 198, 0.2);
  outline: none;
}
```

#### Checkbox and Radio Patterns
Custom-styled form controls maintain consistent appearance:

- **Visual Style**: Rounded corners with glassmorphism background
- **Check Animation**: Smooth transition when toggled
- **Label Interaction**: Full label area clickable
- **Keyboard Support**: Standard spacebar and arrow key navigation

#### Input Validation Feedback
- **Success**: Subtle green accent border
- **Error**: Gentle red accent border with shake animation
- **Warning**: Yellow accent border
- **Info**: Blue accent border for informational states

## Animation System

### Timing and Easing
Consistent animation curves create unified experience:

```css
/* Standard transitions */
transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* Quick feedback */
transition: transform 0.1s ease;

/* Long operations */  
transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Animation Categories

#### Micro-interactions
- **Duration**: 100-200ms
- **Purpose**: Immediate feedback (button press, hover)
- **Easing**: Ease or ease-out for snappy response

#### UI Transitions  
- **Duration**: 300ms
- **Purpose**: Panel transitions, tab switching
- **Easing**: Custom cubic-bezier for smooth movement

#### Widget Animations
- **Duration**: 400-500ms  
- **Purpose**: Widget position changes, size adjustments
- **Easing**: Bounce curve for playful effect

#### Ambient Animations
- **Duration**: 1-3 seconds
- **Purpose**: Background gradients, jiggle effects
- **Easing**: Ease-in-out for gentle rhythm

## Responsive Behavior

### Container Query System
Widgets use container queries for internal responsive behavior:

```css
.widget {
  container-type: size;
}

/* Widget content adapts to container size */
.clock-widget {
  font-size: clamp(0.8rem, 4cqw, 3rem);
}

.calc-buttons {
  gap: clamp(0.25rem, 1cqw, 0.5rem);
}
```

### Fixed Grid System
- **Grid Dimensions**: Always 40×24 regardless of screen size
- **Cell Scaling**: Grid cells scale proportionally with viewport
- **Content Adaptation**: Widget content uses container queries
- **Minimum Sizes**: Enforce minimum widget dimensions for usability

### Touch and Mobile Considerations
- **Touch Targets**: Minimum 44px touch area for interactive elements
- **Drag Sensitivity**: Appropriate drag threshold for touch devices
- **Hover Alternatives**: Touch interactions provide equivalent feedback
- **Resize Handles**: Larger touch-friendly resize handles

## Keyboard Navigation

### Focus Management
- **Tab Order**: Logical tab sequence through interface
- **Focus Indicators**: Clear visual indication of focused elements
- **Skip Links**: Hidden shortcuts for accessibility
- **Focus Trapping**: Modal dialogs trap focus within their boundaries

### Keyboard Shortcuts
- **Escape**: Close current modal or panel
- **Enter**: Activate focused button or widget settings
- **Space**: Toggle checkboxes and buttons
- **Arrow Keys**: Navigate between tabs
- **Delete**: Remove focused widget (in jiggle mode)

### Widget-Specific Keys
Each widget type can define custom keyboard behavior:
- **Calculator**: Numeric keys map to calculator buttons
- **Clock**: No specific keyboard interactions
- **Search**: Enter key submits search query

## Error and Loading States

### Error Display Patterns
Consistent error presentation across all components:

```html
<!-- Standard error widget display -->
<div class="widget-error">
  <div class="error-icon">⚠️</div>
  <div class="error-message">Unable to load data</div>
</div>
```

### Loading State Behavior
- **Skeleton Loading**: Placeholder content during async operations
- **Progressive Loading**: Show available content, load additional parts
- **Timeout Handling**: Graceful degradation after reasonable timeouts
- **Retry Mechanisms**: Clear options for user to retry failed operations

### Feedback Patterns
- **Success**: Subtle green accent or checkmark animation
- **Warning**: Yellow accent with informational message
- **Error**: Red accent with clear explanation and next steps
- **Info**: Blue accent for neutral informational messages

## Accessibility Standards

### ARIA Support
- **Roles**: Appropriate ARIA roles for custom components
- **Labels**: Descriptive labels for all interactive elements
- **Live Regions**: Announce dynamic content changes
- **States**: ARIA states reflect current UI state

### Color and Contrast
- **Contrast Ratios**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Color Independence**: Information not conveyed by color alone
- **High Contrast**: Respect system high contrast preferences
- **Focus Indicators**: Visible focus rings for keyboard navigation

### Screen Reader Support
- **Content Structure**: Semantic HTML structure
- **Alternative Text**: Descriptive alt text for icons and images
- **Skip Navigation**: Skip links for efficiency
- **Content Updates**: Announce important changes to users

## Performance Considerations

### Animation Performance
- **Hardware Acceleration**: Use `transform` and `opacity` for smooth animations
- **Reduce Repaints**: Minimize layout-triggering property changes
- **Frame Rate**: Target 60fps for all animations
- **Performance Budgets**: Limit concurrent animations

### Interaction Response Time
- **Immediate Feedback**: Visual response within 100ms
- **User Control**: Ability to cancel long operations
- **Progressive Enhancement**: Core functionality works without animations
- **Graceful Degradation**: Reduce motion for users who prefer it

### Memory and Resource Management
- **Event Cleanup**: Remove event listeners when components unmount
- **Animation Cleanup**: Cancel animations when elements are removed
- **Efficient Selectors**: Use efficient DOM queries and caching
- **Lazy Loading**: Load resources only when needed

This comprehensive UI behavior guide ensures consistent, accessible, and delightful user interactions throughout the extension interface.