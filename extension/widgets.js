// Widget management
const widgetGrid = document.getElementById('widget-grid');
const widgetsButton = document.getElementById('widgets-button');
const widgetsPanel = document.getElementById('widgets-panel');
const closeWidgetsButton = document.getElementById('close-widgets');
const widgetList = document.getElementById('widget-list');

widgetsPanel.classList.add('hidden');

widgetsButton.addEventListener('click', () => {
  widgetsPanel.classList.remove('hidden');
  widgetsButton.classList.add('hidden');
});

closeWidgetsButton.addEventListener('click', (e) => {
  e.stopPropagation();
  widgetsPanel.classList.add('hidden');
  widgetsButton.classList.remove('hidden');
  buildWidgetList();
});

if (!settings.widgets) settings.widgets = [];

function saveAndRender() {
  saveSettings(settings);
  renderWidgets();
}

function renderWidgets() {
  widgetGrid.innerHTML = '';
  (settings.widgets || []).forEach(widget => {
    if (widget.type === 'clock') {
      renderClockWidget(widget);
    }
  });
}

function renderClockWidget(widget) {
  const container = document.createElement('div');
  container.className = 'widget clock-widget';
  const span = document.createElement('span');
  container.appendChild(span);
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

function openClockConfig() {
  widgetList.innerHTML = `
    <h3>Clock Widget</h3>
    <label><input type="checkbox" id="clock-show-seconds" checked> Show seconds</label><br>
    <label><input type="checkbox" id="clock-flashing"> Flashing separator</label><br>
    <label><input type="checkbox" id="clock-use-24h"> 24 hour time</label><br>
    <label><input type="checkbox" id="clock-daylight" checked> Use daylight savings</label><br>
    <label>Locale: <input type="text" id="clock-locale" placeholder="auto"></label><br>
    <div class="widget-config-buttons">
      <button id="clock-add">Add</button>
      <button id="clock-cancel">Cancel</button>
    </div>
  `;
  document.getElementById('clock-add').addEventListener('click', () => {
    const options = {
      showSeconds: document.getElementById('clock-show-seconds').checked,
      flashing: document.getElementById('clock-flashing').checked,
      use24h: document.getElementById('clock-use-24h').checked,
      daylightSavings: document.getElementById('clock-daylight').checked,
      locale: document.getElementById('clock-locale').value.trim() || 'auto'
    };
    addClockWidget(options);
    widgetsPanel.classList.add('hidden');
    widgetsButton.classList.remove('hidden');
    buildWidgetList();
  });
  document.getElementById('clock-cancel').addEventListener('click', buildWidgetList);
}

function buildWidgetList() {
  widgetList.innerHTML = '';
  const clockBtn = document.createElement('button');
  clockBtn.textContent = 'Clock';
  clockBtn.addEventListener('click', openClockConfig);
  widgetList.appendChild(clockBtn);
}

buildWidgetList();
renderWidgets();
