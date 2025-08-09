// Date Widget Implementation
(function() {
  'use strict';

  function renderDateWidget(widget, index) {
    const container = document.createElement('div');
    container.className = 'widget date-widget';
    container.style.gridColumn = `${(widget.x || 0) + 1} / span ${widget.w || 1}`;
    container.style.gridRow = `${(widget.y || 0) + 1} / span ${widget.h || 1}`;
    container.dataset.index = index;

    const span = document.createElement('span');
    container.appendChild(span);
    
    // Apply appearance styling
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

    function formatDate(date, format, locale, customSeparator) {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const monthNames = date.toLocaleDateString(locale, { month: 'long' }).split(' ')[0];
      const monthNamesShort = date.toLocaleDateString(locale, { month: 'short' }).split(' ')[0];
      
      const sep = customSeparator || '/';
      
      switch (format) {
        case 'MM/DD/YYYY':
          return `${month.toString().padStart(2, '0')}${sep}${day.toString().padStart(2, '0')}${sep}${year}`;
        case 'DD/MM/YYYY':
          return `${day.toString().padStart(2, '0')}${sep}${month.toString().padStart(2, '0')}${sep}${year}`;
        case 'YYYY/MM/DD':
          return `${year}${sep}${month.toString().padStart(2, '0')}${sep}${day.toString().padStart(2, '0')}`;
        case 'MM/DD/YY':
          return `${month.toString().padStart(2, '0')}${sep}${day.toString().padStart(2, '0')}${sep}${year.toString().slice(-2)}`;
        case 'DD/MM/YY':
          return `${day.toString().padStart(2, '0')}${sep}${month.toString().padStart(2, '0')}${sep}${year.toString().slice(-2)}`;
        case 'Month D, YYYY':
          return `${monthNames} ${day}, ${year}`;
        case 'D Month YYYY':
          return `${day} ${monthNames} ${year}`;
        case 'MMM D, YYYY':
          return `${monthNamesShort} ${day}, ${year}`;
        case 'D MMM YYYY':
          return `${day} ${monthNamesShort} ${year}`;
        case 'Month D':
          return `${monthNames} ${day}`;
        case 'D Month':
          return `${day} ${monthNames}`;
        case 'locale-default':
          return date.toLocaleDateString(locale);
        case 'locale-full':
          return date.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        case 'locale-short':
          return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
        case 'weekday-date':
          return date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
        case 'iso':
          return date.toISOString().split('T')[0];
        default:
          return date.toLocaleDateString(locale);
      }
    }

    function update() {
      const now = new Date();
      const locale = widget.settings && widget.settings.locale && widget.settings.locale !== 'auto'
        ? widget.settings.locale
        : navigator.language;
      const format = widget.settings && widget.settings.format || 'MM/DD/YYYY';
      const separator = widget.settings && widget.settings.separator || '/';
      
      const dateString = formatDate(now, format, locale, separator);
      span.textContent = dateString;
    }

    update();
    // Update every minute (dates don't change as frequently as seconds)
    const intervalId = setInterval(update, 60000);
    activeIntervals.push(intervalId);
  }

  function addDateWidget(options) {
    const widget = {
      type: 'date',
      x: 0,
      y: 0,
      w: 4,
      h: 2,
      settings: {
        format: options.format,
        separator: options.separator,
        locale: options.locale
      }
    };
    settings.widgets.push(widget);
    saveAndRender();
  }

  function openDateConfig(existing, index) {
    const isEdit = !!existing;
    const targetContainer = isEdit ? document.getElementById('widget-settings-tab') : widgetList;
    const currentFormat = existing?.settings?.format || 'MM/DD/YYYY';
    const currentSeparator = existing?.settings?.separator || '/';
    const currentLocale = existing?.settings?.locale || 'auto';
    
    targetContainer.innerHTML = `
      <h3>${isEdit ? 'Edit Date Widget' : 'Date Widget'}</h3>
      <div class="input-group">
        <label for="date-format">Date Format</label>
        <select id="date-format">
          <option value="MM/DD/YYYY" ${currentFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY (12/25/2024)</option>
          <option value="DD/MM/YYYY" ${currentFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY (25/12/2024)</option>
          <option value="YYYY/MM/DD" ${currentFormat === 'YYYY/MM/DD' ? 'selected' : ''}>YYYY/MM/DD (2024/12/25)</option>
          <option value="MM/DD/YY" ${currentFormat === 'MM/DD/YY' ? 'selected' : ''}>MM/DD/YY (12/25/24)</option>
          <option value="DD/MM/YY" ${currentFormat === 'DD/MM/YY' ? 'selected' : ''}>DD/MM/YY (25/12/24)</option>
          <option value="Month D, YYYY" ${currentFormat === 'Month D, YYYY' ? 'selected' : ''}>Month D, YYYY (December 25, 2024)</option>
          <option value="D Month YYYY" ${currentFormat === 'D Month YYYY' ? 'selected' : ''}>D Month YYYY (25 December 2024)</option>
          <option value="MMM D, YYYY" ${currentFormat === 'MMM D, YYYY' ? 'selected' : ''}>MMM D, YYYY (Dec 25, 2024)</option>
          <option value="D MMM YYYY" ${currentFormat === 'D MMM YYYY' ? 'selected' : ''}>D MMM YYYY (25 Dec 2024)</option>
          <option value="Month D" ${currentFormat === 'Month D' ? 'selected' : ''}>Month D (December 25)</option>
          <option value="D Month" ${currentFormat === 'D Month' ? 'selected' : ''}>D Month (25 December)</option>
          <option value="weekday-date" ${currentFormat === 'weekday-date' ? 'selected' : ''}>Weekday Date (Wed Dec 25)</option>
          <option value="locale-default" ${currentFormat === 'locale-default' ? 'selected' : ''}>Locale Default</option>
          <option value="locale-full" ${currentFormat === 'locale-full' ? 'selected' : ''}>Locale Full (Wednesday, December 25, 2024)</option>
          <option value="locale-short" ${currentFormat === 'locale-short' ? 'selected' : ''}>Locale Short</option>
          <option value="iso" ${currentFormat === 'iso' ? 'selected' : ''}>ISO Format (2024-12-25)</option>
        </select>
      </div>
      <div class="input-group" id="separator-group" style="display: ${['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD', 'MM/DD/YY', 'DD/MM/YY'].includes(currentFormat) ? 'block' : 'none'}">
        <label for="date-separator">Separator</label>
        <select id="date-separator">
          <option value="/" ${currentSeparator === '/' ? 'selected' : ''}>/</option>
          <option value="-" ${currentSeparator === '-' ? 'selected' : ''}>-</option>
          <option value="." ${currentSeparator === '.' ? 'selected' : ''}>.</option>
          <option value=" " ${currentSeparator === ' ' ? 'selected' : ''}>(space)</option>
        </select>
      </div>
      <div class="input-group">
        <label for="date-locale">Locale</label>
        <input type="text" id="date-locale" placeholder="auto" value="${currentLocale === 'auto' ? '' : currentLocale}">
        <small>Leave blank for auto-detection. Examples: en-US, en-GB, de-DE, fr-FR, ja-JP</small>
      </div>
      <div class="input-group">
        <label>Preview</label>
        <div id="date-preview" style="font-weight: bold; color: #00ff88; margin-top: 5px;"></div>
      </div>
      <div class="widget-config-buttons">
        <button id="date-save">${isEdit ? 'Save' : 'Add'}</button>
        <button id="date-cancel">${isEdit ? 'Exit' : 'Cancel'}</button>
      </div>
    `;

    // Preview functionality
    function updatePreview() {
      const format = document.getElementById('date-format').value;
      const separator = document.getElementById('date-separator').value;
      const locale = document.getElementById('date-locale').value.trim() || 'auto';
      const separatorGroup = document.getElementById('separator-group');
      
      // Show/hide separator selection based on format
      if (['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD', 'MM/DD/YY', 'DD/MM/YY'].includes(format)) {
        separatorGroup.style.display = 'block';
      } else {
        separatorGroup.style.display = 'none';
      }
      
      // Generate preview
      const now = new Date();
      const previewLocale = locale === 'auto' ? navigator.language : locale;
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      let monthNames, monthNamesShort;
      
      try {
        monthNames = now.toLocaleDateString(previewLocale, { month: 'long' }).split(' ')[0];
        monthNamesShort = now.toLocaleDateString(previewLocale, { month: 'short' }).split(' ')[0];
      } catch (e) {
        monthNames = now.toLocaleDateString('en-US', { month: 'long' });
        monthNamesShort = now.toLocaleDateString('en-US', { month: 'short' });
      }
      
      let preview = '';
      const sep = separator || '/';
      
      switch (format) {
        case 'MM/DD/YYYY':
          preview = `${month.toString().padStart(2, '0')}${sep}${day.toString().padStart(2, '0')}${sep}${year}`;
          break;
        case 'DD/MM/YYYY':
          preview = `${day.toString().padStart(2, '0')}${sep}${month.toString().padStart(2, '0')}${sep}${year}`;
          break;
        case 'YYYY/MM/DD':
          preview = `${year}${sep}${month.toString().padStart(2, '0')}${sep}${day.toString().padStart(2, '0')}`;
          break;
        case 'MM/DD/YY':
          preview = `${month.toString().padStart(2, '0')}${sep}${day.toString().padStart(2, '0')}${sep}${year.toString().slice(-2)}`;
          break;
        case 'DD/MM/YY':
          preview = `${day.toString().padStart(2, '0')}${sep}${month.toString().padStart(2, '0')}${sep}${year.toString().slice(-2)}`;
          break;
        case 'Month D, YYYY':
          preview = `${monthNames} ${day}, ${year}`;
          break;
        case 'D Month YYYY':
          preview = `${day} ${monthNames} ${year}`;
          break;
        case 'MMM D, YYYY':
          preview = `${monthNamesShort} ${day}, ${year}`;
          break;
        case 'D MMM YYYY':
          preview = `${day} ${monthNamesShort} ${year}`;
          break;
        case 'Month D':
          preview = `${monthNames} ${day}`;
          break;
        case 'D Month':
          preview = `${day} ${monthNames}`;
          break;
        case 'locale-default':
          try {
            preview = now.toLocaleDateString(previewLocale);
          } catch (e) {
            preview = now.toLocaleDateString();
          }
          break;
        case 'locale-full':
          try {
            preview = now.toLocaleDateString(previewLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          } catch (e) {
            preview = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          }
          break;
        case 'locale-short':
          try {
            preview = now.toLocaleDateString(previewLocale, { year: 'numeric', month: 'short', day: 'numeric' });
          } catch (e) {
            preview = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
          }
          break;
        case 'weekday-date':
          try {
            preview = now.toLocaleDateString(previewLocale, { weekday: 'short', month: 'short', day: 'numeric' });
          } catch (e) {
            preview = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          }
          break;
        case 'iso':
          preview = now.toISOString().split('T')[0];
          break;
        default:
          try {
            preview = now.toLocaleDateString(previewLocale);
          } catch (e) {
            preview = now.toLocaleDateString();
          }
      }
      
      document.getElementById('date-preview').textContent = preview;
    }

    // Set up event listeners for preview updates
    document.getElementById('date-format').addEventListener('change', updatePreview);
    document.getElementById('date-separator').addEventListener('change', updatePreview);
    document.getElementById('date-locale').addEventListener('input', updatePreview);
    
    // Initial preview
    updatePreview();

    document.getElementById('date-save').addEventListener('click', () => {
      const options = {
        format: document.getElementById('date-format').value,
        separator: document.getElementById('date-separator').value,
        locale: document.getElementById('date-locale').value.trim() || 'auto'
      };
      if (isEdit) {
        settings.widgets[index].settings = options;
        saveAndRender();
      } else {
        addDateWidget(options);
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
    document.getElementById('date-cancel').addEventListener('click', () => {
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

  // Register the date widget
  registerWidget('date', {
    name: 'Date',
    render: renderDateWidget,
    openConfig: openDateConfig
  });

})();