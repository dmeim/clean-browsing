// Clock Widget Implementation
(function () {
  'use strict';

  function renderClockWidget(widget, index) {
    const container = createWidgetContainer(widget, index, 'clock-widget');

    const span = document.createElement('span');
    container.appendChild(span);

    // Apply appearance styling (includes text size and all other appearance settings)
    applyWidgetAppearance(container, widget);

    // Set up jiggle mode controls
    setupJiggleModeControls(container, widget, index);

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
      const locale =
        widget.settings && widget.settings.locale && widget.settings.locale !== 'auto'
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
        daylightSavings: options.daylightSavings,
      },
    };
    settings.widgets.push(widget);
    saveAndRender();
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
    // Use helper function for save/cancel logic
    setupWidgetConfigButtons(isEdit, 'clock', index, addClockWidget, () => ({
      showSeconds: document.getElementById('clock-show-seconds').checked,
      flashing: document.getElementById('clock-flashing').checked,
      use24h: document.getElementById('clock-use-24h').checked,
      daylightSavings: document.getElementById('clock-daylight').checked,
      locale: document.getElementById('clock-locale').value.trim() || 'auto',
    }));
  }

  // Register the clock widget
  registerWidget('clock', {
    name: 'Clock',
    render: renderClockWidget,
    openConfig: openClockConfig,
  });
})();
