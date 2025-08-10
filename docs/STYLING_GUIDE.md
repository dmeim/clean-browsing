# Styling Guide

This document outlines the styling conventions, design system, and CSS patterns used throughout the NewTab PlusProMaxUltra extension.

## Design System

### Color Palette

#### Primary Background
```css
/* Main gradient background */
background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
```

#### Accent Colors
- **Purple Accent**: `rgba(120, 119, 198, 0.15)` - Used for glows and highlights
- **Pink Accent**: `rgba(255, 119, 198, 0.1)` - Secondary glow effects  
- **Teal Accent**: `rgba(120, 255, 198, 0.08)` - Tertiary glow effects
- **Interactive Teal**: `rgba(120, 255, 198, 0.2)` - Used for drag previews and active states

#### Text Colors
- **Primary Text**: `#ffffff` - Main text color
- **Secondary Text**: `#e8e8e8` - Body text and secondary elements

#### Widget Surface Colors
- **Base Surface**: `rgba(255, 255, 255, 0.05)` - Widget background base
- **Border**: `rgba(255, 255, 255, 0.1)` - Standard border color
- **Hover Border**: `rgba(255, 255, 255, 0.2)` - Interactive border color

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

### Font Weights
- **Ultra Light**: `font-weight: 200` - Used for clock and date widgets
- **Normal**: `font-weight: 400` - Standard text weight

### Text Effects
```css
/* Standard text shadow for widget content */
text-shadow: 
  0 2px 8px rgba(0, 0, 0, 0.8),
  0 1px 0 rgba(255, 255, 255, 0.3);
```

## Glassmorphism System

### Widget Glassmorphism
```css
/* Standard widget glass effect */
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(20px) saturate(1.2);
border: 1px solid rgba(255, 255, 255, 0.1);
```

### Button Glassmorphism
```css
/* Action button glass effect */
background: rgba(255, 255, 255, 0.08);
backdrop-filter: blur(20px) saturate(1.2);
border: 1px solid rgba(255, 255, 255, 0.15);
```

### Overlay Glassmorphism
```css
/* Widget overlay gradient */
background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%);
```

## Border Radius System

### Responsive Radius Pattern
```css
/* Widget borders - scales with container size */
border-radius: clamp(8px, 4cqw, 16px);

/* Button borders - fixed size */
border-radius: 14px;
```

### Resize Handle Borders
```css
/* Corner handle - matches widget radius */
border-radius: 0 0 clamp(8px, 4cqw, 16px) 0;
```

## Box Shadow System

### Standard Widget Shadows
```css
/* Default widget shadow */
box-shadow: 
  0 8px 32px rgba(0, 0, 0, 0.2),
  0 2px 8px rgba(0, 0, 0, 0.1),
  inset 0 1px 0 rgba(255, 255, 255, 0.1);
```

### Hover State Shadows
```css
/* Widget hover shadow */
box-shadow: 
  0 16px 48px rgba(0, 0, 0, 0.3),
  0 4px 16px rgba(0, 0, 0, 0.15),
  inset 0 1px 0 rgba(255, 255, 255, 0.15),
  0 0 0 1px rgba(120, 119, 198, 0.3);
```

### Button Shadows
```css
/* Action button shadow */
box-shadow: 
  0 4px 16px rgba(0, 0, 0, 0.15),
  inset 0 1px 0 rgba(255, 255, 255, 0.1);
```

## Animation System

### Timing Functions
```css
/* Standard easing for smooth interactions */
transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* Quick interactions */
transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* Immediate feedback */
transition: transform 0.1s;
```

### Transform Patterns
```css
/* Hover lift effect */
transform: translateY(-4px) scale(1.02);

/* Button hover effect */
transform: scale(1.05) translateY(-2px);

/* Active press effect */
transform: scale(0.95) translateY(-1px);
```

### Keyframe Animations
```css
/* Jiggle effect for edit mode */
@keyframes jiggle {
  0%, 100% { transform: rotate(-0.5deg) scale(1); }
  50% { transform: rotate(0.5deg) scale(1.01); }
}

/* Grid pulse effect */
@keyframes grid-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.8; }
}

/* Drag preview pulse */
@keyframes pulse-preview {
  0%, 100% { 
    opacity: 0.6; 
    transform: scale(0.98);
  }
  50% { 
    opacity: 0.8; 
    transform: scale(1);
  }
}
```

## Container Query System

### Widget Responsive Sizing
```css
/* Enable container queries for widgets */
container-type: size;

/* Responsive padding based on widget size */
padding: clamp(0.25rem, 1.5cqw, 1.5rem);

/* Responsive resize handles */
width: clamp(12px, 5cqw, 20px);
height: clamp(12px, 5cqw, 20px);
```

## Grid System

### Main Grid Layout
```css
/* Fixed 40x24 grid system */
#widget-grid {
  display: grid;
  grid-template-columns: repeat(40, 1fr);
  grid-template-rows: repeat(24, 1fr);
  gap: 0.5rem;
}
```

### Widget Grid Positioning
```css
/* Widgets position using grid-area via JavaScript */
/* Example: grid-column: 1 / 5; grid-row: 1 / 3; */
```

### Jiggle Mode Grid Overlay
```css
/* Visual grid lines in edit mode */
background-image: 
  linear-gradient(to right, rgba(255, 255, 255, 0.6) 1px, transparent 1px),
  linear-gradient(to bottom, rgba(255, 255, 255, 0.6) 1px, transparent 1px);
background-size: 
  2.5% 4.166%,  /* 40 columns */
  2.5% 4.166%;  /* 24 rows */
```

## Z-Index Layers

### Layer Stack
```css
/* Background layer */
z-index: -1;  /* Body background gradients */

/* Base layer */
z-index: 0;   /* Grid overlay, widget overlays */

/* Content layer */
z-index: 1;   /* Widgets, widget content */

/* Interactive layer */
z-index: 10;  /* Widget resize handles */
z-index: 15;  /* Resize handle interactive areas */

/* Interface layer */
z-index: 100; /* Drag previews, action buttons, panels */
z-index: 1000; /* Modal panels and overlays */
```

## State Classes

### Widget States
- `.widget` - Base widget styling
- `.widget:hover` - Hover interaction state
- `.widget.dragging` - Active drag state
- `.widget.resizing` - Active resize state
- `.widget.drop-target` - Valid drop target

### Grid States
- `#widget-grid` - Normal grid state
- `#widget-grid.jiggle-mode` - Edit mode with visual enhancements

### Panel States
- `.hidden` - Hide panels and modals
- `.slide-in` - Panel animation state

## Widget-Specific Patterns

### Clock & Date Widgets
```css
.clock-widget, .date-widget {
  font-weight: 200;
  letter-spacing: -0.02em;
  text-align: center;
  line-height: 1.1;
  /* Font size set dynamically by JavaScript */
}
```

### Calculator Widget
```css
/* Uses calc-specific classes with color modifiers */
.calc-btn.colored { /* Dynamic color classes */ }
.round-buttons .calc-btn { border-radius: 50%; }
.rounded-buttons .calc-btn { border-radius: 8px; }
```

## Interactive Elements

### Resize Handles
- `.resize-handle` - Base resize handle styling
- `.resize-handle-se` - Southeast corner handle
- `.resize-handle-s` - South edge handle  
- `.resize-handle-e` - East edge handle

### Drag Elements
- `.drag-preview-indicator` - Visual feedback for drag operations
- Animation with pulsing effect and teal accent color

## Naming Conventions

### CSS Class Patterns
- **Widget base**: `.{widget-name}-widget` (e.g., `.clock-widget`)
- **Component parts**: `.{component}-{part}` (e.g., `.calc-display`)
- **State modifiers**: `.{state}-{type}` (e.g., `.jiggle-mode`)
- **Interactive elements**: `.{action}-{element}` (e.g., `.resize-handle`)

### CSS Custom Properties
- **Grid dimensions**: `--cols`, `--rows` (set via JavaScript)
- **Dynamic values**: Use `clamp()` and container queries instead of custom properties

## Responsive Design

### Breakpoint Strategy
- Use `clamp()` functions for fluid scaling
- Container queries for widget-internal responsiveness
- Fixed grid system with responsive widget sizing

### Mobile Considerations
- Touch-friendly resize handle sizing: `clamp(12px, 5cqw, 20px)`
- Readable text with sufficient contrast and shadows
- Hover effects that work with touch interaction patterns