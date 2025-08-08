// Widget management
const widgetsButton = document.getElementById('widgets-button');
const widgetsPanel = document.getElementById('widgets-panel');
const closeWidgetsButton = document.getElementById('close-widgets');
const widgetList = document.getElementById('widget-list');
const editButton = document.getElementById('edit-button');
let jiggleMode = false;
let dragIndex = null;

widgetsPanel.classList.add('hidden');

widgetsButton.addEventListener('click', () => {
  widgetsPanel.classList.remove('hidden');
  widgetsButton.classList.add('hidden');
});

editButton.addEventListener('click', () => {
  jiggleMode = !jiggleMode;
  editButton.textContent = jiggleMode ? 'Done' : 'Edit';
  widgetGrid.classList.toggle('jiggle-mode', jiggleMode);
  renderWidgets();
});

closeWidgetsButton.addEventListener('click', (e) => {
  e.stopPropagation();
  widgetsPanel.classList.add('hidden');
  widgetsButton.classList.remove('hidden');
  buildWidgetList();
});

if (!settings.widgets) settings.widgets = [];

widgetGrid.addEventListener('dragover', handleDragOver);
widgetGrid.addEventListener('drop', handleGridDrop);

function saveAndRender() {
  saveSettings(settings);
  renderWidgets();
}

function renderWidgets() {
  widgetGrid.innerHTML = '';
  (settings.widgets || []).forEach((widget, index) => {
    if (widget.type === 'clock') {
      renderClockWidget(widget, index);
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
    container.draggable = true;
    container.addEventListener('dragstart', handleDragStart);
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    container.addEventListener('mouseup', handleResizeEnd);
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
  setInterval(update, 1000);
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
      daylightSavings: options.daylightSavings
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

function handleResizeEnd(e) {
  if (!jiggleMode) return;
  const el = e.currentTarget;
  if (e.target !== el) return;
  const index = +el.dataset.index;
  const colSize = widgetGrid.clientWidth / settings.grid.columns;
  const rowSize = widgetGrid.clientHeight / settings.grid.rows;
  const newW = Math.max(1, Math.min(settings.grid.columns - settings.widgets[index].x, Math.round(el.offsetWidth / colSize)));
  const newH = Math.max(1, Math.min(settings.grid.rows - settings.widgets[index].y, Math.round(el.offsetHeight / rowSize)));
  settings.widgets[index].w = newW;
  settings.widgets[index].h = newH;
  el.style.width = '';
  el.style.height = '';
  saveSettings(settings);
  renderWidgets();
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

function buildWidgetList() {
  widgetList.innerHTML = '';
  const clockBtn = document.createElement('button');
  clockBtn.textContent = 'Clock';
  clockBtn.addEventListener('click', () => openClockConfig());
  widgetList.appendChild(clockBtn);
}

function openWidgetSettings(widget, index) {
  widgetsPanel.classList.remove('hidden');
  widgetsButton.classList.add('hidden');
  if (widget.type === 'clock') {
    openClockConfig(widget, index);
  }
}

buildWidgetList();
renderWidgets();
