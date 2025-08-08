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

  // Ensure panels start hidden
  widgetsPanel.classList.add('hidden');

  widgetsButton.addEventListener('click', () => {
    widgetsPanel.classList.remove('hidden');
    widgetsButton.classList.add('hidden');
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

  // Apply custom text size
  const textSize = (widget.settings && widget.settings.textSize !== undefined) ? widget.settings.textSize : 100;
  container.style.fontSize = `calc(min(8cqw, 8cqh, 4rem) * ${textSize / 100})`;

  const span = document.createElement('span');
  container.appendChild(span);

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
  container.style.gridColumn = `${(widget.x || 0) + 1} / span ${widget.w || 2}`;
  container.style.gridRow = `${(widget.y || 0) + 1} / span ${widget.h || 1}`;
  container.dataset.index = index;

  const searchForm = document.createElement('form');
  searchForm.className = 'search-form';
  
  // Search engine logo
  const logo = document.createElement('img');
  logo.className = 'search-logo';
  logo.src = getSearchEngineLogo(widget.settings?.engine || 'google');
  logo.alt = widget.settings?.engine || 'Google';
  
  // Search input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'search-input';
  input.placeholder = `Search ${widget.settings?.engine || 'Google'}...`;
  
  // Search button
  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'search-button';
  button.innerHTML = '&#128269;'; // Magnifying glass
  
  searchForm.appendChild(logo);
  searchForm.appendChild(input);
  searchForm.appendChild(button);
  container.appendChild(searchForm);
  
  // Handle search submission
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (query) {
      performSearch(query, widget.settings);
      if (widget.settings?.clearAfterSearch) {
        input.value = '';
      }
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
}

function getSearchEngineLogo(engine) {
  const logos = {
    'google': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIyLjU2IDEyLjI1QzIyLjU2IDExLjQ3IDIyLjQ5IDEwLjcyIDIyLjM2IDEwSDEyVjE0LjI2SDE3Ljk5QzE3LjY5IDE1Ljg5IDE2LjgyIDE3LjI5IDE1LjU4IDE4LjI0VjIwLjc3SDIwLjA0QzIxLjI2IDE5LjcyIDIyLjU2IDE2LjEzIDIyLjU2IDEyLjI1WiIgZmlsbD0iIzQyODVGNCIvPgo8cGF0aCBkPSJNMTIgMjMuNUM4LjE1IDIzLjUgNC44MyAyMS4xOCAzLjQyIDE3LjgyTDUuOTkgMTUuNzFDNy4yNSAxOC4yMyA5LjM4IDIwLjA4IDEyIDIwLjA4QzEzLjUyIDIwLjA4IDE0LjkgMTkuNTkgMTYgMTguNjVMMTguOTEgMjAuOUMxNi44OCAyMi42NyAxNC40NyAyMy41IDEyIDIzLjVaIiBmaWxsPSIjMzRBODUzIi8+CjxwYXRoIGQ9Ik01Ljk5IDE1LjcxTDMuNDIgMTcuODJDMi4xIDEzLjk5IDIuNDIgOS43MSA0LjE5IDcuMzJMNi45NiA5LjY2QzYuMTcgMTEuOTkgNi43MiAxNC42NCA1Ljk5IDE1LjcxWiIgZmlsbD0iI0ZCQkMwNSIvPgo8cGF0aCBkPSJNMTIgNC43NUMxMy4wNyA0Ljc1IDEzLjk5IDUuMTMgMTQuNzEgNS44NUwxNy4wNCAzLjUyQzE1LjUzIDIuMTcgMTMuNzYgMS4yNSAxMiAxLjI1QzguMTUgMS4yNSA0LjgzIDMuNTcgMy40MiA2LjkzTDYuOTYgOS42NkM3LjM1IDcuNDYgOS42MSA0Ljc1IDEyIDQuNzVaIiBmaWxsPSIjRUE0MzM1Ii8+Cjwvc3ZnPgo=',
    'bing': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMkw0IDNWMTcuNUwxMSAyMkwxOS41IDE4VjhMMTYgNkw4IDJaIiBmaWxsPSIjMDA3OEQ0Ii8+CjxwYXRoIGQ9Ik04IDJWMTEuNUwxMS41IDE0TDE5LjUgMTFWOEwxNiA2TDggMloiIGZpbGw9IiMwMDY2Q0MiLz4KPHA+CjwvcGF0aD4KPC9zdmc+Cg==',
    'duckduckgo': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNERTU4MzMiLz4KPHBhdGggZD0iTTEyIDJDNi40NzcgMiAyIDYuNDc3IDIgMTJTNi40NzcgMjIgMTIgMjIgMjIgMTcuNTIzIDIyIDEyUzE3LjUyMyAyIDEyIDJaTTEyIDIwQzcuNTgyIDIwIDQgMTYuNDE4IDQgMTJTNy41ODIgNCA0IDEyUzE2LjQxOCAyMCAxMiAyMFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
    'yahoo': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40NzcgMiAyIDYuNDc3IDIgMTJTNi40NzcgMjIgMTIgMjIgMjIgMTcuNTIzIDIyIDEyUzE3LjUyMyAyIDEyIDJaTTEyIDIwQzcuNTgyIDIwIDQgMTYuNDE4IDQgMTJTNy41ODIgNCA0IDEyUzE2LjQxOCAyMCAxMiAyMFoiIGZpbGw9IiM3MTAwRkYiLz4KPC9zdmc+Cg==',
    'custom': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDJWMjJMNyAyMkw3IDJIMTBaTTE3IDJWMjJMMTQgMjJMMTQgMkgxN1oiIGZpbGw9IiM2NjY2NjYiLz4KPC9zdmc+Cg=='
  };
  return logos[engine] || logos['custom'];
}

function performSearch(query, settings) {
  const searchEngines = {
    'google': 'https://www.google.com/search?q=%s',
    'bing': 'https://www.bing.com/search?q=%s',
    'duckduckgo': 'https://duckduckgo.com/?q=%s',
    'yahoo': 'https://search.yahoo.com/search?p=%s',
    'custom': settings?.customUrl || 'https://www.google.com/search?q=%s'
  };
  
  const engine = settings?.engine || 'google';
  let searchUrl = searchEngines[engine];
  
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
      window.open(searchUrl, '_blank', 'width=1024,height=768');
      break;
    case 'incognito':
      // Chrome doesn't allow extensions to directly open incognito windows
      // We'll open a new tab and let the user know
      window.open(searchUrl, '_blank');
      break;
  }
}

function addClockWidget(options) {
  const widget = {
    type: 'clock',
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    settings: {
      showSeconds: options.showSeconds,
      flashing: options.flashing,
      locale: options.locale,
      use24h: options.use24h,
      daylightSavings: options.daylightSavings,
      textSize: options.textSize
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
    w: 2,
    h: 1,
    settings: {
      engine: options.engine,
      customUrl: options.customUrl,
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
  const colSize = rect.width / settings.grid.columns;
  const rowSize = rect.height / settings.grid.rows;
  const widget = settings.widgets[dragIndex];
  let col = Math.floor((e.clientX - rect.left) / colSize);
  let row = Math.floor((e.clientY - rect.top) / rowSize);
  col = Math.max(0, Math.min(settings.grid.columns - (widget.w || 1), col));
  row = Math.max(0, Math.min(settings.grid.rows - (widget.h || 1), row));
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
    const colSize = gridRect.width / settings.grid.columns;
    const rowSize = gridRect.height / settings.grid.rows;
    
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
    const maxW = settings.grid.columns - startGridX;
    const maxH = settings.grid.rows - startGridY;
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
  widgetList.innerHTML = `
    <h3>${isEdit ? 'Edit Clock Widget' : 'Clock Widget'}</h3>
    <label><input type="checkbox" id="clock-show-seconds" ${!existing || existing.settings.showSeconds ? 'checked' : ''}> Show seconds</label><br>
    <label><input type="checkbox" id="clock-flashing" ${existing && existing.settings.flashing ? 'checked' : ''}> Flashing separator</label><br>
    <label><input type="checkbox" id="clock-use-24h" ${existing && existing.settings.use24h ? 'checked' : ''}> 24 hour time</label><br>
    <label><input type="checkbox" id="clock-daylight" ${!existing || existing.settings.daylightSavings ? 'checked' : ''}> Use daylight savings</label><br>
    <label>Locale: <input type="text" id="clock-locale" placeholder="auto" value="${existing ? (existing.settings.locale === 'auto' ? '' : existing.settings.locale) : ''}"></label><br>
    <label>Text Size (%): <input type="number" id="clock-text-size" min="50" max="200" step="10" value="${existing && existing.settings.textSize !== undefined ? existing.settings.textSize : 100}"></label><br>
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
      locale: document.getElementById('clock-locale').value.trim() || 'auto',
      textSize: parseInt(document.getElementById('clock-text-size').value) || 100
    };
    if (isEdit) {
      settings.widgets[index].settings = options;
      saveAndRender();
    } else {
      addClockWidget(options);
    }
    widgetsPanel.classList.add('hidden');
    widgetsButton.classList.remove('hidden');
    buildWidgetList();
  });
  document.getElementById('clock-cancel').addEventListener('click', () => {
    widgetsPanel.classList.add('hidden');
    widgetsButton.classList.remove('hidden');
    buildWidgetList();
  });
}

function openSearchConfig(existing, index) {
  const isEdit = !!existing;
  widgetList.innerHTML = `
    <h3>${isEdit ? 'Edit Search Widget' : 'Search Widget'}</h3>
    <label>Search Engine:
      <select id="search-engine">
        <option value="google" ${!existing || existing.settings.engine === 'google' ? 'selected' : ''}>Google</option>
        <option value="bing" ${existing && existing.settings.engine === 'bing' ? 'selected' : ''}>Bing</option>
        <option value="duckduckgo" ${existing && existing.settings.engine === 'duckduckgo' ? 'selected' : ''}>DuckDuckGo</option>
        <option value="yahoo" ${existing && existing.settings.engine === 'yahoo' ? 'selected' : ''}>Yahoo</option>
        <option value="custom" ${existing && existing.settings.engine === 'custom' ? 'selected' : ''}>Custom</option>
      </select>
    </label><br>
    <label id="custom-url-label" ${!existing || existing.settings.engine !== 'custom' ? 'style="display: none;"' : ''}>Custom URL (use %s or %q for query):
      <input type="text" id="search-custom-url" placeholder="https://example.com/search?q=%s" value="${existing && existing.settings.customUrl ? existing.settings.customUrl : ''}">
    </label><br>
    <label>Open search in:
      <select id="search-target">
        <option value="newTab" ${!existing || existing.settings.target === 'newTab' ? 'selected' : ''}>New Tab</option>
        <option value="currentTab" ${existing && existing.settings.target === 'currentTab' ? 'selected' : ''}>Current Tab</option>
        <option value="newWindow" ${existing && existing.settings.target === 'newWindow' ? 'selected' : ''}>New Window</option>
        <option value="incognito" ${existing && existing.settings.target === 'incognito' ? 'selected' : ''}>New Tab (Incognito intent)</option>
      </select>
    </label><br>
    <label><input type="checkbox" id="search-clear" ${existing && existing.settings.clearAfterSearch ? 'checked' : ''}> Clear input after search</label><br>
    <div class="widget-config-buttons">
      <button id="search-save">${isEdit ? 'Save' : 'Add'}</button>
      <button id="search-cancel">${isEdit ? 'Exit' : 'Cancel'}</button>
    </div>
  `;
  
  // Handle engine selection change
  document.getElementById('search-engine').addEventListener('change', (e) => {
    const customLabel = document.getElementById('custom-url-label');
    if (e.target.value === 'custom') {
      customLabel.style.display = 'block';
    } else {
      customLabel.style.display = 'none';
    }
  });
  
  document.getElementById('search-save').addEventListener('click', () => {
    const options = {
      engine: document.getElementById('search-engine').value,
      customUrl: document.getElementById('search-custom-url').value.trim(),
      target: document.getElementById('search-target').value,
      clearAfterSearch: document.getElementById('search-clear').checked
    };
    
    if (options.engine === 'custom' && !options.customUrl) {
      alert('Please enter a custom URL for the search engine');
      return;
    }
    
    if (isEdit) {
      settings.widgets[index].settings = options;
      saveAndRender();
    } else {
      addSearchWidget(options);
    }
    widgetsPanel.classList.add('hidden');
    widgetsButton.classList.remove('hidden');
    buildWidgetList();
  });
  
  document.getElementById('search-cancel').addEventListener('click', () => {
    widgetsPanel.classList.add('hidden');
    widgetsButton.classList.remove('hidden');
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
  if (widget.type === 'clock') {
    openClockConfig(widget, index);
  } else if (widget.type === 'search') {
    openSearchConfig(widget, index);
  }
}
