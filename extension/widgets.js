// Core widget management system
let widgetsButton;
let widgetsPanel;
let closeWidgetsButton;
let widgetList;
let editButton;
let widgetGrid;
let jiggleMode = false;
let dragIndex = null;
let dragOffset = { x: 0, y: 0 };
let activeIntervals = [];

// Widget registry - stores widget type definitions
const widgetRegistry = {};

// Register a new widget type
function registerWidget(type, definition) {
  widgetRegistry[type] = definition;
}

// Get widget definition by type
function getWidgetDefinition(type) {
  return widgetRegistry[type];
}

function initWidgetsUI() {
  widgetsButton = document.getElementById('widgets-button');
  widgetsPanel = document.getElementById('widgets-panel');
  closeWidgetsButton = document.getElementById('close-widgets');
  widgetList = document.getElementById('widget-list');
  editButton = document.getElementById('edit-button');
  widgetGrid = document.getElementById('widget-grid');
  
  // Initialize widget panel tabs
  const widgetTabs = document.getElementById('widget-tabs');
  const widgetTabButtons = widgetTabs.querySelectorAll('button');
  const widgetTabContents = widgetsPanel.querySelectorAll('.tab-content');
  
  widgetTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      widgetTabButtons.forEach(b => b.classList.remove('active'));
      widgetTabContents.forEach(c => c.classList.add('hidden'));
      btn.classList.add('active');
      const targetTab = btn.dataset.tab;
      if (targetTab === 'widget-settings') {
        document.getElementById('widget-settings-tab').classList.remove('hidden');
      } else if (targetTab === 'widget-appearance') {
        document.getElementById('widget-appearance-tab-content').classList.remove('hidden');
      }
    });
  });

  // Ensure panels start hidden
  widgetsPanel.classList.add('hidden');

  widgetsButton.addEventListener('click', () => {
    widgetsPanel.classList.remove('hidden');
    widgetsButton.classList.add('hidden');
    // Reset to widget list view (not settings)
    document.getElementById('widget-tabs').classList.add('hidden');
    document.getElementById('widget-list').classList.remove('hidden');
    // Clear any previous widget settings content
    document.getElementById('widget-settings-tab').innerHTML = '';
    document.getElementById('widget-appearance-tab-content').innerHTML = '';
    buildWidgetList();
  });

  editButton.addEventListener('click', () => {
    jiggleMode = !jiggleMode;
    editButton.innerHTML = jiggleMode ? '&#10003;' : '&#9998;';
    widgetGrid.classList.toggle('jiggle-mode', jiggleMode);
    renderWidgets();
  });

  closeWidgetsButton.addEventListener('click', (e) => {
    e.stopPropagation();
    widgetsPanel.classList.add('hidden');
    widgetsButton.classList.remove('hidden');
    buildWidgetList();
  });

  initializeWidgets();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidgetsUI);
} else {
  initWidgetsUI();
}

function initializeWidgets() {
  // Ensure settings is available
  if (typeof settings === 'undefined') {
    console.error('Settings not available during widget initialization');
    return;
  }
  
  if (!settings.widgets) settings.widgets = [];
  
  widgetGrid.addEventListener('dragover', handleDragOver);
  widgetGrid.addEventListener('drop', handleGridDrop);
  
  buildWidgetList();
  renderWidgets();
}

function saveAndRender() {
  saveSettings(settings);
  renderWidgets();
}

function getWidgetAppearance(widget) {
  // Merge global appearance with widget-specific overrides
  const global = settings.globalWidgetAppearance || {};
  const individual = widget.appearance || {};
  
  return {
    fontSize: individual.fontSize !== undefined ? individual.fontSize : global.fontSize,
    fontWeight: individual.fontWeight !== undefined ? individual.fontWeight : global.fontWeight,
    italic: individual.italic !== undefined ? individual.italic : global.italic,
    underline: individual.underline !== undefined ? individual.underline : global.underline,
    textColor: individual.textColor !== undefined ? individual.textColor : global.textColor,
    textOpacity: individual.textOpacity !== undefined ? individual.textOpacity : global.textOpacity,
    backgroundColor: individual.backgroundColor !== undefined ? individual.backgroundColor : global.backgroundColor,
    backgroundOpacity: individual.backgroundOpacity !== undefined ? individual.backgroundOpacity : global.backgroundOpacity,
    blur: individual.blur !== undefined ? individual.blur : global.blur,
    borderRadius: individual.borderRadius !== undefined ? individual.borderRadius : global.borderRadius,
    opacity: individual.opacity !== undefined ? individual.opacity : global.opacity,
    textAlign: individual.textAlign !== undefined ? individual.textAlign : global.textAlign,
    verticalAlign: individual.verticalAlign !== undefined ? individual.verticalAlign : global.verticalAlign,
    padding: individual.padding !== undefined ? individual.padding : global.padding
  };
}

function calculateOptimalFontSize(textElement, container, appearance) {
  // Get container dimensions accounting for padding
  const containerRect = container.getBoundingClientRect();
  const padding = appearance.padding || 0;
  const availableWidth = containerRect.width - (padding * 2);
  const availableHeight = containerRect.height - (padding * 2);
  
  // If container hasn't been laid out yet, return a default size
  if (availableWidth <= 0 || availableHeight <= 0) {
    return 16;
  }
  
  // Simple, reliable formula: take a percentage of the smaller dimension
  // This ensures text always fits within bounds while scaling with container size
  const smallerDimension = Math.min(availableWidth, availableHeight);
  const largerDimension = Math.max(availableWidth, availableHeight);
  
  // Base font size as percentage of smaller dimension
  let fontSize = smallerDimension * 0.35;
  
  // For very wide containers, allow some additional scaling based on width
  const aspectRatio = availableWidth / availableHeight;
  if (aspectRatio > 2) {
    // Wide widget: add some width-based scaling but cap it to prevent overflow
    const widthBonus = Math.min(availableWidth * 0.05, smallerDimension * 0.2);
    fontSize += widthBonus;
  }
  
  // Apply user's font size preference
  fontSize *= (appearance.fontSize / 100);
  
  // Clamp to reasonable bounds
  fontSize = Math.max(12, Math.min(fontSize, 150));
  
  return fontSize;
}

function applyOptimalFontSize(textElement, container, appearance) {
  const optimalSize = calculateOptimalFontSize(textElement, container, appearance);
  textElement.style.setProperty('font-size', `${optimalSize}px`, 'important');
}

function setupDynamicTextSizing(textElement, container, widget) {
  // Set up ResizeObserver to recalculate font size when widget is resized
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
      const appearance = getWidgetAppearance(widget);
      applyOptimalFontSize(textElement, container, appearance);
    });
    resizeObserver.observe(container);
    
    // Store observer reference to clean up later if needed
    container._resizeObserver = resizeObserver;
  }
}

function applyWidgetAppearance(container, widget) {
  const appearance = getWidgetAppearance(widget);
  
  // Convert hex color to rgba
  const hexToRgba = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  };
  
  // Apply container styling first
  container.style.background = hexToRgba(appearance.backgroundColor, appearance.backgroundOpacity);
  container.style.backdropFilter = `blur(${appearance.blur}px)`;
  container.style.borderRadius = `${appearance.borderRadius}px`;
  container.style.opacity = appearance.opacity / 100;
  container.style.padding = `${appearance.padding}px`;
  container.style.display = 'flex';
  container.style.alignItems = appearance.verticalAlign;
  container.style.justifyContent = appearance.textAlign;
  
  // Apply text styling
  const textElement = container.querySelector('span') || container.querySelector('.search-input');
  if (textElement) {
    if (textElement.classList.contains('search-input')) {
      // For search inputs, use a different font size calculation
      textElement.style.fontSize = `calc(clamp(16px, 5cqw, 20px) * ${appearance.fontSize / 100})`;
    } else {
      // For clock widgets and other text elements, calculate optimal size after layout
      // Use requestAnimationFrame to ensure container is properly laid out
      requestAnimationFrame(() => {
        applyOptimalFontSize(textElement, container, appearance);
        setupDynamicTextSizing(textElement, container, widget);
      });
    }
    textElement.style.fontWeight = appearance.fontWeight;
    textElement.style.fontStyle = appearance.italic ? 'italic' : 'normal';
    textElement.style.textDecoration = appearance.underline ? 'underline' : 'none';
    textElement.style.color = hexToRgba(appearance.textColor, appearance.textOpacity);
    textElement.style.textAlign = appearance.textAlign;
  }
}

function renderWidgets() {
  // Clear existing intervals to prevent memory leaks
  activeIntervals.forEach(clearInterval);
  activeIntervals = [];
  
  // Clean up existing ResizeObserver instances
  const existingWidgets = widgetGrid.querySelectorAll('.widget');
  existingWidgets.forEach(widget => {
    if (widget._resizeObserver) {
      widget._resizeObserver.disconnect();
      widget._resizeObserver = null;
    }
  });
  
  widgetGrid.innerHTML = '';
  
  (settings.widgets || []).forEach((widget, index) => {
    const widgetDef = getWidgetDefinition(widget.type);
    if (widgetDef && widgetDef.render) {
      widgetDef.render(widget, index);
    }
  });
}

// Helper function to create basic widget container
function createWidgetContainer(widget, index, className) {
  const container = document.createElement('div');
  container.className = `widget ${className}`;
  container.style.gridColumn = `${(widget.x || 0) + 1} / span ${widget.w || 4}`;
  container.style.gridRow = `${(widget.y || 0) + 1} / span ${widget.h || 3}`;
  container.dataset.index = index;
  return container;
}

// Helper function to set up jiggle mode controls
function setupJiggleModeControls(container, widget, index) {
  if (!jiggleMode) return;
  
  // Remove button
  const removeBtn = document.createElement('button');
  removeBtn.className = 'widget-action widget-remove';
  removeBtn.innerHTML = '&times;';
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settings.widgets.splice(index, 1);
    saveAndRender();
  });
  
  // Settings button
  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'widget-action widget-settings';
  settingsBtn.innerHTML = '&#9881;';
  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openWidgetSettings(widget, index);
  });
  
  container.appendChild(removeBtn);
  container.appendChild(settingsBtn);
  
  // Create resize handles
  const resizeHandleSE = document.createElement('div');
  resizeHandleSE.className = 'resize-handle resize-handle-se';
  const resizeHandleS = document.createElement('div');
  resizeHandleS.className = 'resize-handle resize-handle-s';
  const resizeHandleE = document.createElement('div');
  resizeHandleE.className = 'resize-handle resize-handle-e';
  
  container.appendChild(resizeHandleSE);
  container.appendChild(resizeHandleS);
  container.appendChild(resizeHandleE);
  
  // Set up drag and drop
  container.draggable = true;
  container.addEventListener('dragstart', handleDragStart);
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('drop', handleDrop);
  
  // Add resize event listeners
  addResizeListeners(container, index, resizeHandleSE, resizeHandleS, resizeHandleE);
  
  // Prevent dragging when interacting with resize handles
  [resizeHandleSE, resizeHandleS, resizeHandleE].forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      container.draggable = false;
    });
    handle.addEventListener('mouseup', () => {
      container.draggable = true;
    });
  });
}

// Helper function for common widget config save/cancel logic
function setupWidgetConfigButtons(isEdit, widgetType, index, addWidgetFunction, getOptionsFunction) {
  document.getElementById(`${widgetType}-save`).addEventListener('click', () => {
    const options = getOptionsFunction();
    // Allow validation functions to return null to prevent saving
    if (options === null) return;
    
    if (isEdit) {
      settings.widgets[index].settings = options;
      saveAndRender();
    } else {
      addWidgetFunction(options);
      widgetsPanel.classList.add('hidden');
      widgetsButton.classList.remove('hidden');
    }
    buildWidgetList();
  });
  
  document.getElementById(`${widgetType}-cancel`).addEventListener('click', () => {
    widgetsPanel.classList.add('hidden');
    widgetsButton.classList.remove('hidden');
    buildWidgetList();
  });
}

function handleDragStart(e) {
  dragIndex = +e.currentTarget.dataset.index;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', '');
  
  // Calculate the offset from the mouse to the widget's center
  const widgetRect = e.currentTarget.getBoundingClientRect();
  const gridRect = widgetGrid.getBoundingClientRect();
  
  // Calculate widget center relative to grid
  const widgetCenterX = widgetRect.left + widgetRect.width / 2 - gridRect.left;
  const widgetCenterY = widgetRect.top + widgetRect.height / 2 - gridRect.top;
  
  // Calculate mouse position relative to grid
  const mouseX = e.clientX - gridRect.left;
  const mouseY = e.clientY - gridRect.top;
  
  // Store offset from mouse to widget center
  dragOffset.x = widgetCenterX - mouseX;
  dragOffset.y = widgetCenterY - mouseY;
  
  // Add dragend listener to clean up if drag is cancelled
  const draggedElement = e.currentTarget;
  const cleanup = () => {
    const previewElement = document.getElementById('drag-preview-indicator');
    if (previewElement) {
      previewElement.remove();
    }
    dragIndex = null;
    dragOffset = { x: 0, y: 0 };
    if (draggedElement) {
      draggedElement.removeEventListener('dragend', cleanup);
    }
  };
  draggedElement.addEventListener('dragend', cleanup);
}

function handleDragOver(e) {
  e.preventDefault();
  
  // Provide visual feedback during drag
  if (dragIndex !== null && e.currentTarget === widgetGrid) {
    const rect = widgetGrid.getBoundingClientRect();
    const colSize = rect.width / 40;
    const rowSize = rect.height / 24;
    const widget = settings.widgets[dragIndex];
    
    // Calculate where widget center would be (mouse + offset)
    const relativeX = e.clientX - rect.left + dragOffset.x;
    const relativeY = e.clientY - rect.top + dragOffset.y;
    
    // Convert to grid coordinates - center the widget on the calculated position
    let col = Math.round(relativeX / colSize - (widget.w || 4) / 2);
    let row = Math.round(relativeY / rowSize - (widget.h || 3) / 2);
    
    // Ensure within bounds
    col = Math.max(0, Math.min(40 - (widget.w || 4), col));
    row = Math.max(0, Math.min(24 - (widget.h || 3), row));
    
    // Create or update preview indicator
    let previewElement = document.getElementById('drag-preview-indicator');
    if (!previewElement) {
      previewElement = document.createElement('div');
      previewElement.id = 'drag-preview-indicator';
      previewElement.className = 'drag-preview-indicator';
      widgetGrid.appendChild(previewElement);
    }
    
    // Position the preview element
    previewElement.style.gridColumn = `${col + 1} / span ${widget.w || 4}`;
    previewElement.style.gridRow = `${row + 1} / span ${widget.h || 3}`;
  }
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  
  // Clean up drag preview
  const previewElement = document.getElementById('drag-preview-indicator');
  if (previewElement) {
    previewElement.remove();
  }
  
  const targetIndex = +e.currentTarget.dataset.index;
  if (dragIndex === null || dragIndex === targetIndex) {
    dragIndex = null;
    dragOffset = { x: 0, y: 0 };
    return;
  }
  const tempX = settings.widgets[targetIndex].x;
  const tempY = settings.widgets[targetIndex].y;
  settings.widgets[targetIndex].x = settings.widgets[dragIndex].x;
  settings.widgets[targetIndex].y = settings.widgets[dragIndex].y;
  settings.widgets[dragIndex].x = tempX;
  settings.widgets[dragIndex].y = tempY;
  dragIndex = null;
  dragOffset = { x: 0, y: 0 };
  saveAndRender();
}

function handleGridDrop(e) {
  e.preventDefault();
  
  // Clean up drag preview
  const previewElement = document.getElementById('drag-preview-indicator');
  if (previewElement) {
    previewElement.remove();
  }
  
  if (dragIndex === null) return;
  const rect = widgetGrid.getBoundingClientRect();
  const colSize = rect.width / 40; // Fixed 40 columns
  const rowSize = rect.height / 24; // Fixed 24 rows
  const widget = settings.widgets[dragIndex];
  
  // Calculate where widget center would be (mouse + offset)
  const relativeX = e.clientX - rect.left + dragOffset.x;
  const relativeY = e.clientY - rect.top + dragOffset.y;
  
  // Convert to grid coordinates - center the widget on the calculated position
  let col = Math.round(relativeX / colSize - (widget.w || 4) / 2);
  let row = Math.round(relativeY / rowSize - (widget.h || 3) / 2);
  
  // Ensure widget stays within grid bounds
  col = Math.max(0, Math.min(40 - (widget.w || 4), col));
  row = Math.max(0, Math.min(24 - (widget.h || 3), row));
  
  // Only update position if it actually changed
  if (widget.x !== col || widget.y !== row) {
    widget.x = col;
    widget.y = row;
    saveAndRender();
  }
  
  dragIndex = null;
  dragOffset = { x: 0, y: 0 };
}

function addResizeListeners(container, index, resizeHandleSE, resizeHandleS, resizeHandleE) {
  let isResizing = false;
  let resizeType = '';
  let startX, startY, startWidth, startHeight, startGridX, startGridY;
  
  function startResize(e, type) {
    isResizing = true;
    resizeType = type;
    
    e.preventDefault();
    e.stopPropagation();
    
    startX = e.clientX;
    startY = e.clientY;
    startWidth = container.offsetWidth;
    startHeight = container.offsetHeight;
    
    const widget = settings.widgets[index];
    startGridX = widget.x;
    startGridY = widget.y;
    
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
    document.addEventListener('dragstart', preventDrag);
    
    container.classList.add('resizing');
    container.draggable = false;
  }
  
  function preventDrag(e) {
    e.preventDefault();
    return false;
  }
  
  function doResize(e) {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    const gridRect = widgetGrid.getBoundingClientRect();
    const colSize = gridRect.width / 40; // Fixed 40 columns
    const rowSize = gridRect.height / 24; // Fixed 24 rows
    
    let newWidth = startWidth;
    let newHeight = startHeight;
    
    if (resizeType.includes('e')) {
      newWidth = Math.max(colSize, startWidth + deltaX);
    }
    if (resizeType.includes('s')) {
      newHeight = Math.max(rowSize, startHeight + deltaY);
    }
    
    // Calculate new grid dimensions
    const newGridW = Math.max(1, Math.round(newWidth / colSize));
    const newGridH = Math.max(1, Math.round(newHeight / rowSize));
    
    // Ensure widget doesn't exceed grid bounds
    const maxW = 40 - startGridX; // Fixed 40 columns
    const maxH = 24 - startGridY; // Fixed 24 rows
    const clampedW = Math.min(newGridW, maxW);
    const clampedH = Math.min(newGridH, maxH);
    
    // Update grid positioning to anchor from top-left (only expand right/down)
    container.style.gridColumn = `${startGridX + 1} / span ${clampedW}`;
    container.style.gridRow = `${startGridY + 1} / span ${clampedH}`;
  }
  
  function stopResize() {
    if (!isResizing) return;
    
    isResizing = false;
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
    document.removeEventListener('dragstart', preventDrag);
    
    // Get the final grid dimensions from the current grid positioning
    const gridColumnStyle = container.style.gridColumn;
    const gridRowStyle = container.style.gridRow;
    
    // Parse "X / span Y" format to extract span value
    const colSpanMatch = gridColumnStyle.match(/span (\d+)/);
    const rowSpanMatch = gridRowStyle.match(/span (\d+)/);
    
    const finalW = colSpanMatch ? parseInt(colSpanMatch[1]) : settings.widgets[index].w;
    const finalH = rowSpanMatch ? parseInt(rowSpanMatch[1]) : settings.widgets[index].h;
    
    settings.widgets[index].w = finalW;
    settings.widgets[index].h = finalH;
    
    container.classList.remove('resizing');
    container.draggable = true;
    
    saveSettings(settings);
    renderWidgets();
  }
  
  resizeHandleSE.addEventListener('mousedown', (e) => startResize(e, 'se'));
  resizeHandleS.addEventListener('mousedown', (e) => startResize(e, 's'));
  resizeHandleE.addEventListener('mousedown', (e) => startResize(e, 'e'));
}

function buildWidgetList() {
  widgetList.innerHTML = '';
  
  // Build widget list from registered widget types
  Object.keys(widgetRegistry).forEach(type => {
    const widgetDef = widgetRegistry[type];
    if (widgetDef.name && widgetDef.openConfig) {
      const btn = document.createElement('button');
      btn.textContent = widgetDef.name;
      btn.addEventListener('click', () => widgetDef.openConfig());
      widgetList.appendChild(btn);
    }
  });
}

function openWidgetSettings(widget, index) {
  widgetsPanel.classList.remove('hidden');
  widgetsButton.classList.add('hidden');
  
  // Show tabs and set to settings tab by default
  document.getElementById('widget-tabs').classList.remove('hidden');
  document.getElementById('widget-list').classList.add('hidden');
  
  // Reset tab state
  const tabButtons = document.querySelectorAll('#widget-tabs button');
  const tabContents = document.querySelectorAll('#widgets-panel .tab-content');
  tabButtons.forEach(b => b.classList.remove('active'));
  tabContents.forEach(c => c.classList.add('hidden'));
  
  // Activate settings tab
  document.querySelector('#widget-tabs button[data-tab="widget-settings"]').classList.add('active');
  document.getElementById('widget-settings-tab').classList.remove('hidden');
  
  // Load the appropriate widget settings
  const widgetDef = getWidgetDefinition(widget.type);
  if (widgetDef && widgetDef.openConfig) {
    widgetDef.openConfig(widget, index);
  }
  
  // Set up appearance tab
  setupWidgetAppearanceTab(widget, index);
}

function setupWidgetAppearanceTab(widget, index) {
  const appearanceTab = document.getElementById('widget-appearance-tab-content');
  const appearance = widget.appearance || {};
  const global = settings.globalWidgetAppearance || {};
  
  appearanceTab.innerHTML = `
    <div class="settings-section">
      <h3 class="section-title">Widget Text Styling</h3>
      <div class="settings-group">
        <div class="input-group">
          <label for="widget-font-size">Font Size (%) <span class="inheritance-indicator">${appearance.fontSize !== undefined ? 'Custom' : 'Using Global'}</span></label>
          <input type="range" id="widget-font-size" min="50" max="200" step="10" value="${appearance.fontSize !== undefined ? appearance.fontSize : global.fontSize}">
          <span id="widget-font-size-value">${appearance.fontSize !== undefined ? appearance.fontSize : global.fontSize}%</span>
          <button class="reset-to-global" data-property="fontSize" ${appearance.fontSize === undefined ? 'disabled' : ''}>Use Global</button>
        </div>
        <div class="input-group">
          <label for="widget-font-weight">Font Weight <span class="inheritance-indicator">${appearance.fontWeight !== undefined ? 'Custom' : 'Using Global'}</span></label>
          <select id="widget-font-weight">
            <option value="300" ${(appearance.fontWeight || global.fontWeight) == 300 ? 'selected' : ''}>Light</option>
            <option value="400" ${(appearance.fontWeight || global.fontWeight) == 400 ? 'selected' : ''}>Normal</option>
            <option value="500" ${(appearance.fontWeight || global.fontWeight) == 500 ? 'selected' : ''}>Medium</option>
            <option value="700" ${(appearance.fontWeight || global.fontWeight) == 700 ? 'selected' : ''}>Bold</option>
            <option value="900" ${(appearance.fontWeight || global.fontWeight) == 900 ? 'selected' : ''}>Extra Bold</option>
          </select>
          <button class="reset-to-global" data-property="fontWeight" ${appearance.fontWeight === undefined ? 'disabled' : ''}>Use Global</button>
        </div>
        <div class="input-group checkbox-group">
          <label><input type="checkbox" id="widget-italic" ${(appearance.italic !== undefined ? appearance.italic : global.italic) ? 'checked' : ''}> Italic <span class="inheritance-indicator">${appearance.italic !== undefined ? 'Custom' : 'Using Global'}</span></label>
          <button class="reset-to-global" data-property="italic" ${appearance.italic === undefined ? 'disabled' : ''}>Use Global</button>
        </div>
        <div class="input-group checkbox-group">
          <label><input type="checkbox" id="widget-underline" ${(appearance.underline !== undefined ? appearance.underline : global.underline) ? 'checked' : ''}> Underline <span class="inheritance-indicator">${appearance.underline !== undefined ? 'Custom' : 'Using Global'}</span></label>
          <button class="reset-to-global" data-property="underline" ${appearance.underline === undefined ? 'disabled' : ''}>Use Global</button>
        </div>
        <div class="input-group">
          <label for="widget-text-color">Text Color <span class="inheritance-indicator">${appearance.textColor !== undefined ? 'Custom' : 'Using Global'}</span></label>
          <input type="color" id="widget-text-color" value="${appearance.textColor || global.textColor}">
          <button class="reset-to-global" data-property="textColor" ${appearance.textColor === undefined ? 'disabled' : ''}>Use Global</button>
        </div>
        <div class="input-group">
          <label for="widget-text-opacity">Text Opacity (%) <span class="inheritance-indicator">${appearance.textOpacity !== undefined ? 'Custom' : 'Using Global'}</span></label>
          <input type="range" id="widget-text-opacity" min="10" max="100" step="5" value="${appearance.textOpacity !== undefined ? appearance.textOpacity : global.textOpacity}">
          <span id="widget-text-opacity-value">${appearance.textOpacity !== undefined ? appearance.textOpacity : global.textOpacity}%</span>
          <button class="reset-to-global" data-property="textOpacity" ${appearance.textOpacity === undefined ? 'disabled' : ''}>Use Global</button>
        </div>
      </div>
    </div>
    <div class="settings-section">
      <h3 class="section-title">Widget Background & Effects</h3>
      <div class="settings-group">
        <div class="input-group">
          <label for="widget-bg-color">Background Color <span class="inheritance-indicator">${appearance.backgroundColor !== undefined ? 'Custom' : 'Using Global'}</span></label>
          <input type="color" id="widget-bg-color" value="${appearance.backgroundColor || global.backgroundColor}">
          <button class="reset-to-global" data-property="backgroundColor" ${appearance.backgroundColor === undefined ? 'disabled' : ''}>Use Global</button>
        </div>
        <div class="input-group">
          <label for="widget-bg-opacity">Background Opacity (%) <span class="inheritance-indicator">${appearance.backgroundOpacity !== undefined ? 'Custom' : 'Using Global'}</span></label>
          <input type="range" id="widget-bg-opacity" min="0" max="100" step="5" value="${appearance.backgroundOpacity !== undefined ? appearance.backgroundOpacity : global.backgroundOpacity}">
          <span id="widget-bg-opacity-value">${appearance.backgroundOpacity !== undefined ? appearance.backgroundOpacity : global.backgroundOpacity}%</span>
          <button class="reset-to-global" data-property="backgroundOpacity" ${appearance.backgroundOpacity === undefined ? 'disabled' : ''}>Use Global</button>
        </div>
        <div class="input-group">
          <label for="widget-blur">Background Blur (px) <span class="inheritance-indicator">${appearance.blur !== undefined ? 'Custom' : 'Using Global'}</span></label>
          <input type="range" id="widget-blur" min="0" max="20" step="1" value="${appearance.blur !== undefined ? appearance.blur : global.blur}">
          <span id="widget-blur-value">${appearance.blur !== undefined ? appearance.blur : global.blur}px</span>
          <button class="reset-to-global" data-property="blur" ${appearance.blur === undefined ? 'disabled' : ''}>Use Global</button>
        </div>
        <div class="input-group">
          <label for="widget-border-radius">Border Radius (px) <span class="inheritance-indicator">${appearance.borderRadius !== undefined ? 'Custom' : 'Using Global'}</span></label>
          <input type="range" id="widget-border-radius" min="0" max="30" step="1" value="${appearance.borderRadius !== undefined ? appearance.borderRadius : global.borderRadius}">
          <span id="widget-border-radius-value">${appearance.borderRadius !== undefined ? appearance.borderRadius : global.borderRadius}px</span>
          <button class="reset-to-global" data-property="borderRadius" ${appearance.borderRadius === undefined ? 'disabled' : ''}>Use Global</button>
        </div>
        <div class="input-group">
          <label for="widget-opacity">Widget Opacity (%) <span class="inheritance-indicator">${appearance.opacity !== undefined ? 'Custom' : 'Using Global'}</span></label>
          <input type="range" id="widget-opacity" min="10" max="100" step="5" value="${appearance.opacity !== undefined ? appearance.opacity : global.opacity}">
          <span id="widget-opacity-value">${appearance.opacity !== undefined ? appearance.opacity : global.opacity}%</span>
          <button class="reset-to-global" data-property="opacity" ${appearance.opacity === undefined ? 'disabled' : ''}>Use Global</button>
        </div>
      </div>
    </div>
    <div class="settings-section">
      <h3 class="section-title">Widget Layout</h3>
      <div class="settings-group">
        <div class="input-group">
          <label for="widget-text-align">Text Alignment <span class="inheritance-indicator">${appearance.textAlign !== undefined ? 'Custom' : 'Using Global'}</span></label>
          <select id="widget-text-align">
            <option value="left" ${(appearance.textAlign || global.textAlign) === 'left' ? 'selected' : ''}>Left</option>
            <option value="center" ${(appearance.textAlign || global.textAlign) === 'center' ? 'selected' : ''}>Center</option>
            <option value="right" ${(appearance.textAlign || global.textAlign) === 'right' ? 'selected' : ''}>Right</option>
            <option value="justify" ${(appearance.textAlign || global.textAlign) === 'justify' ? 'selected' : ''}>Justify</option>
          </select>
          <button class="reset-to-global" data-property="textAlign" ${appearance.textAlign === undefined ? 'disabled' : ''}>Use Global</button>
        </div>
        <div class="input-group">
          <label for="widget-vertical-align">Vertical Alignment <span class="inheritance-indicator">${appearance.verticalAlign !== undefined ? 'Custom' : 'Using Global'}</span></label>
          <select id="widget-vertical-align">
            <option value="flex-start" ${(appearance.verticalAlign || global.verticalAlign) === 'flex-start' ? 'selected' : ''}>Top</option>
            <option value="center" ${(appearance.verticalAlign || global.verticalAlign) === 'center' ? 'selected' : ''}>Center</option>
            <option value="flex-end" ${(appearance.verticalAlign || global.verticalAlign) === 'flex-end' ? 'selected' : ''}>Bottom</option>
          </select>
          <button class="reset-to-global" data-property="verticalAlign" ${appearance.verticalAlign === undefined ? 'disabled' : ''}>Use Global</button>
        </div>
        <div class="input-group">
          <label for="widget-padding">Padding (px) <span class="inheritance-indicator">${appearance.padding !== undefined ? 'Custom' : 'Using Global'}</span></label>
          <input type="range" id="widget-padding" min="0" max="40" step="2" value="${appearance.padding !== undefined ? appearance.padding : global.padding}">
          <span id="widget-padding-value">${appearance.padding !== undefined ? appearance.padding : global.padding}px</span>
          <button class="reset-to-global" data-property="padding" ${appearance.padding === undefined ? 'disabled' : ''}>Use Global</button>
        </div>
      </div>
    </div>
    <div class="settings-section">
      <h3 class="section-title">Actions</h3>
      <div class="settings-group">
        <button id="reset-widget-appearance" class="secondary-button">Reset All to Global</button>
      </div>
    </div>
  `;
  
  // Set up event listeners for appearance controls
  setupWidgetAppearanceControls(widget, index);
}

function setupWidgetAppearanceControls(widget, index) {
  if (!widget.appearance) widget.appearance = {};
  
  // Helper function to update appearance property
  const updateAppearance = (property, value) => {
    widget.appearance[property] = value;
    settings.widgets[index] = widget;
    saveAndRender();
    setupWidgetAppearanceTab(widget, index); // Refresh the tab to update indicators
  };
  
  // Helper function to remove appearance property (use global)
  const useGlobal = (property) => {
    delete widget.appearance[property];
    settings.widgets[index] = widget;
    saveAndRender();
    setupWidgetAppearanceTab(widget, index); // Refresh the tab to update indicators
  };
  
  // Font size
  const fontSizeSlider = document.getElementById('widget-font-size');
  const fontSizeValue = document.getElementById('widget-font-size-value');
  fontSizeSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    fontSizeValue.textContent = value + '%';
    updateAppearance('fontSize', value);
  });
  
  // Font weight
  document.getElementById('widget-font-weight').addEventListener('change', (e) => {
    updateAppearance('fontWeight', parseInt(e.target.value));
  });
  
  // Italic
  document.getElementById('widget-italic').addEventListener('change', (e) => {
    updateAppearance('italic', e.target.checked);
  });
  
  // Underline
  document.getElementById('widget-underline').addEventListener('change', (e) => {
    updateAppearance('underline', e.target.checked);
  });
  
  // Text color
  document.getElementById('widget-text-color').addEventListener('input', (e) => {
    updateAppearance('textColor', e.target.value);
  });
  
  // Text opacity
  const textOpacitySlider = document.getElementById('widget-text-opacity');
  const textOpacityValue = document.getElementById('widget-text-opacity-value');
  textOpacitySlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    textOpacityValue.textContent = value + '%';
    updateAppearance('textOpacity', value);
  });
  
  // Background color
  document.getElementById('widget-bg-color').addEventListener('input', (e) => {
    updateAppearance('backgroundColor', e.target.value);
  });
  
  // Background opacity
  const bgOpacitySlider = document.getElementById('widget-bg-opacity');
  const bgOpacityValue = document.getElementById('widget-bg-opacity-value');
  bgOpacitySlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    bgOpacityValue.textContent = value + '%';
    updateAppearance('backgroundOpacity', value);
  });
  
  // Blur
  const blurSlider = document.getElementById('widget-blur');
  const blurValue = document.getElementById('widget-blur-value');
  blurSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    blurValue.textContent = value + 'px';
    updateAppearance('blur', value);
  });
  
  // Border radius
  const borderRadiusSlider = document.getElementById('widget-border-radius');
  const borderRadiusValue = document.getElementById('widget-border-radius-value');
  borderRadiusSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    borderRadiusValue.textContent = value + 'px';
    updateAppearance('borderRadius', value);
  });
  
  // Widget opacity
  const opacitySlider = document.getElementById('widget-opacity');
  const opacityValue = document.getElementById('widget-opacity-value');
  opacitySlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    opacityValue.textContent = value + '%';
    updateAppearance('opacity', value);
  });
  
  // Text alignment
  document.getElementById('widget-text-align').addEventListener('change', (e) => {
    updateAppearance('textAlign', e.target.value);
  });
  
  // Vertical alignment
  document.getElementById('widget-vertical-align').addEventListener('change', (e) => {
    updateAppearance('verticalAlign', e.target.value);
  });
  
  // Padding
  const paddingSlider = document.getElementById('widget-padding');
  const paddingValue = document.getElementById('widget-padding-value');
  paddingSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    paddingValue.textContent = value + 'px';
    updateAppearance('padding', value);
  });
  
  // Reset to global buttons
  document.querySelectorAll('.reset-to-global').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const property = e.target.dataset.property;
      useGlobal(property);
    });
  });
  
  // Reset all to global button
  document.getElementById('reset-widget-appearance').addEventListener('click', () => {
    widget.appearance = {};
    settings.widgets[index] = widget;
    saveAndRender();
    setupWidgetAppearanceTab(widget, index);
  });
}