// Widget management
let widgetsButton;
let widgetsPanel;
let closeWidgetsButton;
let widgetList;
let editButton;
let widgetGrid;
let jiggleMode = false;
let dragIndex = null;
let activeIntervals = [];

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

function applyWidgetAppearance(container, widget) {
  const appearance = getWidgetAppearance(widget);
  
  // Convert hex color to rgba
  const hexToRgba = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  };
  
  // Apply text styling
  const textElement = container.querySelector('span') || container.querySelector('.search-input');
  if (textElement) {
    if (textElement.classList.contains('search-input')) {
      // For search inputs, use a different font size calculation
      textElement.style.fontSize = `calc(clamp(16px, 5cqw, 20px) * ${appearance.fontSize / 100})`;
    } else {
      // For clock widgets and other text elements
      textElement.style.fontSize = `calc(clamp(2rem, 15cqw, 8rem) * ${appearance.fontSize / 100})`;
    }
    textElement.style.fontWeight = appearance.fontWeight;
    textElement.style.fontStyle = appearance.italic ? 'italic' : 'normal';
    textElement.style.textDecoration = appearance.underline ? 'underline' : 'none';
    textElement.style.color = hexToRgba(appearance.textColor, appearance.textOpacity);
    textElement.style.textAlign = appearance.textAlign;
  }
  
  // Apply container styling
  container.style.background = hexToRgba(appearance.backgroundColor, appearance.backgroundOpacity);
  container.style.backdropFilter = `blur(${appearance.blur}px)`;
  container.style.borderRadius = `${appearance.borderRadius}px`;
  container.style.opacity = appearance.opacity / 100;
  container.style.padding = `${appearance.padding}px`;
  container.style.display = 'flex';
  container.style.alignItems = appearance.verticalAlign;
  container.style.justifyContent = appearance.textAlign;
}

function renderWidgets() {
  // Clear existing intervals to prevent memory leaks
  activeIntervals.forEach(clearInterval);
  activeIntervals = [];
  
  widgetGrid.innerHTML = '';
  
  (settings.widgets || []).forEach((widget, index) => {
    if (widget.type === 'clock') {
      renderClockWidget(widget, index);
    } else if (widget.type === 'search') {
      renderSearchWidget(widget, index);
    }
  });
}


function renderClockWidget(widget, index) {
  const container = document.createElement('div');
  container.className = 'widget clock-widget';
  container.style.gridColumn = `${(widget.x || 0) + 1} / span ${widget.w || 1}`;
  container.style.gridRow = `${(widget.y || 0) + 1} / span ${widget.h || 1}`;
  container.dataset.index = index;

  const span = document.createElement('span');
  container.appendChild(span);
  
  // Apply appearance styling (includes text size and all other appearance settings)
  applyWidgetAppearance(container, widget);

  if (jiggleMode) {
    const removeBtn = document.createElement('button');
    removeBtn.className = 'widget-action widget-remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settings.widgets.splice(index, 1);
      saveAndRender();
    });
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

  widgetGrid.appendChild(container);

  function isDST(d) {
    const jan = new Date(d.getFullYear(), 0, 1);
    const jul = new Date(d.getFullYear(), 6, 1);
    const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    return d.getTimezoneOffset() < stdOffset;
  }

  function update() {
    let now = new Date();
    if (widget.settings && widget.settings.daylightSavings === false && isDST(now)) {
      now = new Date(now.getTime() - 3600000);
    }
    const locale = widget.settings && widget.settings.locale && widget.settings.locale !== 'auto'
      ? widget.settings.locale
      : navigator.language;
    const opts = { hour: 'numeric', minute: 'numeric', hour12: !widget.settings.use24h };
    if (widget.settings.showSeconds) opts.second = 'numeric';
    let timeString = now.toLocaleTimeString(locale, opts);
    if (widget.settings.flashing) {
      const sep = now.getSeconds() % 2 === 0 ? ':' : ' ';
      timeString = timeString.replace(/:/g, sep);
    }
    span.textContent = timeString;
  }

  update();
  const intervalId = setInterval(update, 1000);
  activeIntervals.push(intervalId);
}

function renderSearchWidget(widget, index) {
  const container = document.createElement('div');
  container.className = 'widget search-widget';
  container.style.gridColumn = `${(widget.x || 0) + 1} / span ${widget.w || 6}`;
  container.style.gridRow = `${(widget.y || 0) + 1} / span ${widget.h || 2}`;
  container.dataset.index = index;

  // Search engine logo
  const logo = document.createElement('img');
  logo.className = 'search-logo';
  logo.src = getSearchEngineLogo(widget);
  logo.alt = widget.settings?.engine || 'Google';
  
  // Combined input/button container
  const searchContainer = document.createElement('div');
  searchContainer.className = 'search-input-container';
  
  // Search input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'search-input';
  
  // Capitalize search engine name for placeholder
  const getCapitalizedEngineName = (engine) => {
    const names = {
      'google': 'Google',
      'bing': 'Bing',
      'duckduckgo': 'DuckDuckGo',
      'yahoo': 'Yahoo',
      'custom': 'Custom'
    };
    return names[engine] || 'Google';
  };
  
  input.placeholder = `Search ${getCapitalizedEngineName(widget.settings?.engine || 'google')}`;
  
  // Search button
  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'search-button';
  button.innerHTML = '&#128269;'; // Magnifying glass
  
  searchContainer.appendChild(input);
  searchContainer.appendChild(button);
  
  container.appendChild(logo);
  container.appendChild(searchContainer);
  
  // Focus the input when interacting with the search widget
  // Using pointerdown ensures the input is focused even on the first click
  // when the browser's address bar still has focus
  container.addEventListener('pointerdown', (e) => {
    // Don't interfere if interacting directly with the input or button
    if (e.target === input || e.target === button) return;

    // Focus the input so typing can begin immediately
    input.focus();
    e.preventDefault();
    e.stopPropagation();
  });
  
  // Apply appearance styling
  applyWidgetAppearance(container, widget);
  
  // Handle search submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (query) {
      performSearch(query, widget.settings);
      if (widget.settings?.clearAfterSearch) {
        input.value = '';
      }
    }
  };
  
  // Add submit handler to button and enter key on input
  button.addEventListener('click', handleSubmit);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  });
  

  if (jiggleMode) {
    const removeBtn = document.createElement('button');
    removeBtn.className = 'widget-action widget-remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settings.widgets.splice(index, 1);
      saveAndRender();
    });
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

  widgetGrid.appendChild(container);
  
  // Return the input element for global keyboard handling
  return input;
}

function getSearchEngineLogo(widget) {
  // If custom image URL is provided, use it
  if (widget.settings?.customImageUrl) {
    return widget.settings.customImageUrl;
  }
  
  const engine = widget.settings?.engine || 'google';
  const logos = {
    'google': 'resources/google.png',
    'bing': 'resources/bing.png',
    'duckduckgo': 'resources/ddg.png',
    'yahoo': 'resources/yahoo-search.png',
    'custom': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDJWMjJMNyAyMkw3IDJIMTBaTTE3IDJWMjJMMTQgMjJMMTQgMkgxN1oiIGZpbGw9IiM2NjY2NjYiLz4KPC9zdmc+Cg=='
  };
  return logos[engine] || logos['custom'];
}

function performSearch(query, settings) {
  // Always use the customUrl if available, otherwise fall back to Google
  let searchUrl = settings?.customUrl || 'https://www.google.com/search?q=%s';
  
  // Replace %s or %q with the encoded query
  const encodedQuery = encodeURIComponent(query);
  searchUrl = searchUrl.replace(/%[sq]/g, encodedQuery);
  
  const target = settings?.target || 'newTab';
  
  switch (target) {
    case 'currentTab':
      window.location.href = searchUrl;
      break;
    case 'newTab':
      window.open(searchUrl, '_blank');
      break;
    case 'newWindow':
      // Use Chrome extension API to create a proper new window
      if (chrome && chrome.windows) {
        chrome.windows.create({
          url: searchUrl,
          width: 1024,
          height: 768
        });
      } else {
        // Fallback for when chrome.windows is not available
        window.open(searchUrl, '_blank');
      }
      break;
    case 'incognito':
      // Use Chrome extension API to create a new incognito window
      if (chrome && chrome.windows) {
        chrome.windows.create({
          url: searchUrl,
          incognito: true,
          width: 1024,
          height: 768
        });
      } else {
        // Fallback for when chrome.windows is not available
        window.open(searchUrl, '_blank');
      }
      break;
  }
}

function addClockWidget(options) {
  const widget = {
    type: 'clock',
    x: 0,
    y: 0,
    w: 4,
    h: 3,
    settings: {
      showSeconds: options.showSeconds,
      flashing: options.flashing,
      locale: options.locale,
      use24h: options.use24h,
      daylightSavings: options.daylightSavings
    }
  };
  settings.widgets.push(widget);
  saveAndRender();
}

function addSearchWidget(options) {
  const widget = {
    type: 'search',
    x: 0,
    y: 0,
    w: 6,
    h: 2,
    settings: {
      engine: options.engine,
      customUrl: options.customUrl,
      customImageUrl: options.customImageUrl,
      target: options.target,
      clearAfterSearch: options.clearAfterSearch
    }
  };
  settings.widgets.push(widget);
  saveAndRender();
}

function handleDragStart(e) {
  dragIndex = +e.currentTarget.dataset.index;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', '');
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  const targetIndex = +e.currentTarget.dataset.index;
  if (dragIndex === null || dragIndex === targetIndex) {
    dragIndex = null;
    return;
  }
  const tempX = settings.widgets[targetIndex].x;
  const tempY = settings.widgets[targetIndex].y;
  settings.widgets[targetIndex].x = settings.widgets[dragIndex].x;
  settings.widgets[targetIndex].y = settings.widgets[dragIndex].y;
  settings.widgets[dragIndex].x = tempX;
  settings.widgets[dragIndex].y = tempY;
  dragIndex = null;
  saveAndRender();
}

function handleGridDrop(e) {
  e.preventDefault();
  if (dragIndex === null) return;
  const rect = widgetGrid.getBoundingClientRect();
  const colSize = rect.width / 20; // Fixed 20 columns
  const rowSize = rect.height / 12; // Fixed 12 rows
  const widget = settings.widgets[dragIndex];
  let col = Math.floor((e.clientX - rect.left) / colSize);
  let row = Math.floor((e.clientY - rect.top) / rowSize);
  col = Math.max(0, Math.min(20 - (widget.w || 4), col));
  row = Math.max(0, Math.min(12 - (widget.h || 3), row));
  widget.x = col;
  widget.y = row;
  dragIndex = null;
  saveAndRender();
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
    const colSize = gridRect.width / 20; // Fixed 20 columns
    const rowSize = gridRect.height / 12; // Fixed 12 rows
    
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
    const maxW = 20 - startGridX; // Fixed 20 columns
    const maxH = 12 - startGridY; // Fixed 12 rows
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

function openClockConfig(existing, index) {
  const isEdit = !!existing;
  const targetContainer = isEdit ? document.getElementById('widget-settings-tab') : widgetList;
  targetContainer.innerHTML = `
    <h3>${isEdit ? 'Edit Clock Widget' : 'Clock Widget'}</h3>
    <div class="input-group checkbox-group">
      <label><input type="checkbox" id="clock-show-seconds" ${!existing || existing.settings.showSeconds ? 'checked' : ''}> Show seconds</label>
    </div>
    <div class="input-group checkbox-group">
      <label><input type="checkbox" id="clock-flashing" ${existing && existing.settings.flashing ? 'checked' : ''}> Flashing separator</label>
    </div>
    <div class="input-group checkbox-group">
      <label><input type="checkbox" id="clock-use-24h" ${existing && existing.settings.use24h ? 'checked' : ''}> 24 hour time</label>
    </div>
    <div class="input-group checkbox-group">
      <label><input type="checkbox" id="clock-daylight" ${!existing || existing.settings.daylightSavings ? 'checked' : ''}> Use daylight savings</label>
    </div>
    <div class="input-group">
      <label for="clock-locale">Locale</label>
      <input type="text" id="clock-locale" placeholder="auto" value="${existing ? (existing.settings.locale === 'auto' ? '' : existing.settings.locale) : ''}">
    </div>
    <div class="widget-config-buttons">
      <button id="clock-save">${isEdit ? 'Save' : 'Add'}</button>
      <button id="clock-cancel">${isEdit ? 'Exit' : 'Cancel'}</button>
    </div>
  `;
  document.getElementById('clock-save').addEventListener('click', () => {
    const options = {
      showSeconds: document.getElementById('clock-show-seconds').checked,
      flashing: document.getElementById('clock-flashing').checked,
      use24h: document.getElementById('clock-use-24h').checked,
      daylightSavings: document.getElementById('clock-daylight').checked,
      locale: document.getElementById('clock-locale').value.trim() || 'auto'
    };
    if (isEdit) {
      settings.widgets[index].settings = options;
      saveAndRender();
    } else {
      addClockWidget(options);
    }
    if (isEdit) {
      widgetsPanel.classList.add('hidden');
      widgetsButton.classList.remove('hidden');
      document.getElementById('widget-tabs').classList.add('hidden');
      document.getElementById('widget-list').classList.remove('hidden');
    } else {
      widgetsPanel.classList.add('hidden');
      widgetsButton.classList.remove('hidden');
    }
    buildWidgetList();
  });
  document.getElementById('clock-cancel').addEventListener('click', () => {
    if (isEdit) {
      widgetsPanel.classList.add('hidden');
      widgetsButton.classList.remove('hidden');
      document.getElementById('widget-tabs').classList.add('hidden');
      document.getElementById('widget-list').classList.remove('hidden');
    } else {
      widgetsPanel.classList.add('hidden');
      widgetsButton.classList.remove('hidden');
    }
    buildWidgetList();
  });
}

function openSearchConfig(existing, index) {
  const isEdit = !!existing;
  const targetContainer = isEdit ? document.getElementById('widget-settings-tab') : widgetList;
  
  // Get the current URL based on engine or custom URL
  const getEngineUrl = (engine) => {
    const searchEngines = {
      'google': 'https://www.google.com/search?q=%s',
      'bing': 'https://www.bing.com/search?q=%s',
      'duckduckgo': 'https://duckduckgo.com/?q=%s',
      'yahoo': 'https://search.yahoo.com/search?p=%s'
    };
    return searchEngines[engine] || '';
  };
  
  const currentEngine = existing?.settings.engine || 'google';
  const currentUrl = existing?.settings.customUrl || getEngineUrl(currentEngine);
  
  targetContainer.innerHTML = `
    <h3>${isEdit ? 'Edit Search Widget' : 'Search Widget'}</h3>
    <div class="input-group">
      <label for="search-engine">Search Engine</label>
      <select id="search-engine">
        <option value="google" ${currentEngine === 'google' ? 'selected' : ''}>Google</option>
        <option value="bing" ${currentEngine === 'bing' ? 'selected' : ''}>Bing</option>
        <option value="duckduckgo" ${currentEngine === 'duckduckgo' ? 'selected' : ''}>DuckDuckGo</option>
        <option value="yahoo" ${currentEngine === 'yahoo' ? 'selected' : ''}>Yahoo</option>
        <option value="custom" ${currentEngine === 'custom' ? 'selected' : ''}>Custom</option>
      </select>
    </div>
    <div class="input-group" id="url-label">
      <label for="search-custom-url">Search URL (use %s or %q for query)</label>
      <input type="text" id="search-custom-url" placeholder="https://example.com/search?q=%s" value="${currentUrl}">
    </div>
    <div class="input-group" id="image-url-group" style="display: ${currentEngine === 'custom' ? 'block' : 'none'}">
      <label for="search-image-url">Custom Image URL (optional)</label>
      <input type="text" id="search-image-url" placeholder="https://example.com/logo.png" value="${existing?.settings.customImageUrl || ''}">
    </div>
    <div class="input-group">
      <label for="search-target">Open search in</label>
      <select id="search-target">
        <option value="newTab" ${!existing || existing.settings.target === 'newTab' ? 'selected' : ''}>New Tab</option>
        <option value="currentTab" ${existing && existing.settings.target === 'currentTab' ? 'selected' : ''}>Current Tab</option>
        <option value="newWindow" ${existing && existing.settings.target === 'newWindow' ? 'selected' : ''}>New Window</option>
        <option value="incognito" ${existing && existing.settings.target === 'incognito' ? 'selected' : ''}>New Incognito Window</option>
      </select>
    </div>
    <div class="input-group checkbox-group">
      <label><input type="checkbox" id="search-clear" ${existing && existing.settings.clearAfterSearch ? 'checked' : ''}> Clear input after search</label>
    </div>
    <div class="widget-config-buttons">
      <button id="search-save">${isEdit ? 'Save' : 'Add'}</button>
      <button id="search-cancel">${isEdit ? 'Exit' : 'Cancel'}</button>
    </div>
  `;
  
  // Handle engine selection change
  document.getElementById('search-engine').addEventListener('change', (e) => {
    const urlInput = document.getElementById('search-custom-url');
    const imageUrlGroup = document.getElementById('image-url-group');
    const selectedEngine = e.target.value;
    
    if (selectedEngine !== 'custom') {
      // Auto-populate with predefined engine URL
      urlInput.value = getEngineUrl(selectedEngine);
      // Hide custom image URL field for predefined engines
      imageUrlGroup.style.display = 'none';
    } else {
      // For custom, clear the field if it contains a predefined URL
      const predefinedUrls = [
        'https://www.google.com/search?q=%s',
        'https://www.bing.com/search?q=%s', 
        'https://duckduckgo.com/?q=%s',
        'https://search.yahoo.com/search?p=%s'
      ];
      if (predefinedUrls.includes(urlInput.value)) {
        urlInput.value = '';
      }
      urlInput.focus();
      // Show custom image URL field for custom engines
      imageUrlGroup.style.display = 'block';
    }
  });
  
  document.getElementById('search-save').addEventListener('click', () => {
    const options = {
      engine: document.getElementById('search-engine').value,
      customUrl: document.getElementById('search-custom-url').value.trim(),
      customImageUrl: document.getElementById('search-image-url').value.trim(),
      target: document.getElementById('search-target').value,
      clearAfterSearch: document.getElementById('search-clear').checked
    };
    
    if (!options.customUrl) {
      alert('Please enter a search URL');
      return;
    }
    
    if (isEdit) {
      settings.widgets[index].settings = options;
      saveAndRender();
    } else {
      addSearchWidget(options);
    }
    if (isEdit) {
      widgetsPanel.classList.add('hidden');
      widgetsButton.classList.remove('hidden');
      document.getElementById('widget-tabs').classList.add('hidden');
      document.getElementById('widget-list').classList.remove('hidden');
    } else {
      widgetsPanel.classList.add('hidden');
      widgetsButton.classList.remove('hidden');
    }
    buildWidgetList();
  });
  
  document.getElementById('search-cancel').addEventListener('click', () => {
    if (isEdit) {
      widgetsPanel.classList.add('hidden');
      widgetsButton.classList.remove('hidden');
      document.getElementById('widget-tabs').classList.add('hidden');
      document.getElementById('widget-list').classList.remove('hidden');
    } else {
      widgetsPanel.classList.add('hidden');
      widgetsButton.classList.remove('hidden');
    }
    buildWidgetList();
  });
}

function buildWidgetList() {
  widgetList.innerHTML = '';
  const clockBtn = document.createElement('button');
  clockBtn.textContent = 'Clock';
  clockBtn.addEventListener('click', () => openClockConfig());
  widgetList.appendChild(clockBtn);
  
  const searchBtn = document.createElement('button');
  searchBtn.textContent = 'Search';
  searchBtn.addEventListener('click', () => openSearchConfig());
  widgetList.appendChild(searchBtn);
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
  if (widget.type === 'clock') {
    openClockConfig(widget, index);
  } else if (widget.type === 'search') {
    openSearchConfig(widget, index);
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
