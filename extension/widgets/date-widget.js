// Date Widget Implementation
(function() {
  'use strict';

  function renderDateWidget(widget, index) {
    const container = createWidgetContainer(widget, index, 'date-widget');

    const span = document.createElement('span');
    container.appendChild(span);
    
    // Apply appearance styling
    applyWidgetAppearance(container, widget);

    // Set up jiggle mode controls
    setupJiggleModeControls(container, widget, index);

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
        <label for="date-format">Date Format <a href="https://datetimecalculator.net/date-formatter" target="_blank" style="font-size: 0.8em; color: #7877c6; text-decoration: none; margin-left: 8px;">Format Options</a></label>
        <select id="date-format">
          <option value="MM/DD/YYYY" ${currentFormat === 'MM/DD/YYYY' ? 'selected' : ''}>12/25/2024 (US)</option>
          <option value="DD/MM/YYYY" ${currentFormat === 'DD/MM/YYYY' ? 'selected' : ''}>25/12/2024 (EU)</option>
          <option value="YYYY-MM-DD" ${currentFormat === 'YYYY-MM-DD' ? 'selected' : ''}>2024-12-25 (ISO)</option>
          <option value="Month D, YYYY" ${currentFormat === 'Month D, YYYY' ? 'selected' : ''}>December 25, 2024</option>
          <option value="MMM D, YYYY" ${currentFormat === 'MMM D, YYYY' ? 'selected' : ''}>Dec 25, 2024</option>
          <option value="locale-default" ${currentFormat === 'locale-default' ? 'selected' : ''}>Locale Default</option>
          <option value="custom" ${!['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'Month D, YYYY', 'MMM D, YYYY', 'locale-default'].includes(currentFormat) ? 'selected' : ''}>Custom Format</option>
        </select>
      </div>
      <div class="input-group" id="custom-format-group" style="display: ${!['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'Month D, YYYY', 'MMM D, YYYY', 'locale-default'].includes(currentFormat) ? 'block' : 'none'}">
        <label for="custom-date-format">Custom Format</label>
        <input type="text" id="custom-date-format" placeholder="Enter custom format" value="${!['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'Month D, YYYY', 'MMM D, YYYY', 'locale-default'].includes(currentFormat) ? currentFormat : ''}">
        <small>Use format codes like YYYY, MM, DD, Month, MMM, etc.</small>
      </div>
      <div class="input-group" id="separator-group" style="display: ${['MM/DD/YYYY', 'DD/MM/YYYY'].includes(currentFormat) ? 'block' : 'none'}">
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
      const customFormatGroup = document.getElementById('custom-format-group');
      
      // Show/hide separator and custom format groups
      if (['MM/DD/YYYY', 'DD/MM/YYYY'].includes(format)) {
        separatorGroup.style.display = 'block';
      } else {
        separatorGroup.style.display = 'none';
      }
      
      if (format === 'custom') {
        customFormatGroup.style.display = 'block';
      } else {
        customFormatGroup.style.display = 'none';
      }
      
      // Generate preview
      const now = new Date();
      const previewLocale = locale === 'auto' ? navigator.language : locale;
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      let monthNames, monthNamesShort;
      
      try {
        monthNames = now.toLocaleDateString(previewLocale, { month: 'long' });
        monthNamesShort = now.toLocaleDateString(previewLocale, { month: 'short' });
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
        case 'YYYY-MM-DD':
          preview = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          break;
        case 'Month D, YYYY':
          preview = `${monthNames} ${day}, ${year}`;
          break;
        case 'MMM D, YYYY':
          preview = `${monthNamesShort} ${day}, ${year}`;
          break;
        case 'locale-default':
          try {
            preview = now.toLocaleDateString(previewLocale);
          } catch (e) {
            preview = now.toLocaleDateString();
          }
          break;
        case 'custom':
          const customFormat = document.getElementById('custom-date-format').value;
          if (customFormat) {
            preview = `Custom: ${customFormat} (example output will vary)`;
          } else {
            preview = 'Enter custom format above';
          }
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
    document.getElementById('custom-date-format').addEventListener('input', updatePreview);
    
    // Initial preview
    updatePreview();

    // Use helper function for save/cancel logic
    setupWidgetConfigButtons(isEdit, 'date', index, addDateWidget, () => {
      const formatValue = document.getElementById('date-format').value;
      const customFormat = document.getElementById('custom-date-format').value;
      
      return {
        format: formatValue === 'custom' ? customFormat : formatValue,
        separator: document.getElementById('date-separator').value,
        locale: document.getElementById('date-locale').value.trim() || 'auto'
      };
    });
  }

  // Register the date widget
  registerWidget('date', {
    name: 'Date',
    render: renderDateWidget,
    openConfig: openDateConfig
  });

})();