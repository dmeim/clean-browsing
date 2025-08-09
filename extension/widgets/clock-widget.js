// Clock Widget Implementation
(function() {
  'use strict';

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
        // For edit mode, just save and stay in settings view
        // Don't change the view - keep the settings visible
      } else {
        addClockWidget(options);
        // For add mode, close the modal
        widgetsPanel.classList.add('hidden');
        widgetsButton.classList.remove('hidden');
      }
      buildWidgetList();
    });
    document.getElementById('clock-cancel').addEventListener('click', () => {
      // Both edit and add mode should close the modal completely
      widgetsPanel.classList.add('hidden');
      widgetsButton.classList.remove('hidden');
      buildWidgetList();
    });
  }

  // Register the clock widget
  registerWidget('clock', {
    name: 'Clock',
    render: renderClockWidget,
    openConfig: openClockConfig
  });

})();