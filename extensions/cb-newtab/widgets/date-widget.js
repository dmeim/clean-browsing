// Date Widget - Simplified Implementation
(function() {
  'use strict';

  function renderDateWidget(widget, index) {
    const container = createWidgetContainer(widget, index, 'date-widget');
    const dateDisplay = document.createElement('span');
    container.appendChild(dateDisplay);
    
    // Apply appearance styling
    applyWidgetAppearance(container, widget);

    // Set up jiggle mode controls
    setupJiggleModeControls(container, widget, index);

    widgetGrid.appendChild(container);

    // Simple update function - just format and display
    function updateDate() {
      const format = widget.settings?.format || 'YYYY-MM-DD';
      
      // Simply format the current date with Day.js
      if (typeof dayjs !== 'undefined') {
        dateDisplay.textContent = dayjs().format(format);
      } else {
        dateDisplay.textContent = 'Day.js not loaded';
      }
    }

    // Initial update
    updateDate();
    
    // Update every minute
    const intervalId = setInterval(updateDate, 60000);
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
        format: options.format || 'YYYY-MM-DD'
      }
    };
    settings.widgets.push(widget);
    saveAndRender();
  }

  function openDateConfig(existing, index) {
    const isEdit = !!existing;
    const targetContainer = isEdit ? document.getElementById('widget-settings-tab') : widgetList;
    const currentFormat = existing?.settings?.format || 'YYYY-MM-DD';
    
    // Generate examples dynamically ONLY if Day.js is loaded
    let examplesHTML = '';
    if (typeof dayjs !== 'undefined') {
      examplesHTML = `
        <div style="margin-top: 10px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px;">
          <small style="color: #aaa; display: block; line-height: 1.6;">
            <strong style="color: #00ff88;">Quick Examples:</strong><br>
            <code style="color: #fff;">YYYY-MM-DD</code> → ${dayjs().format('YYYY-MM-DD')}<br>
            <code style="color: #fff;">MM/DD/YYYY</code> → ${dayjs().format('MM/DD/YYYY')}<br>
            <code style="color: #fff;">DD/MM/YYYY</code> → ${dayjs().format('DD/MM/YYYY')}<br>
            <code style="color: #fff;">MMMM D, YYYY</code> → ${dayjs().format('MMMM D, YYYY')}<br>
            <code style="color: #fff;">ddd, MMM Do</code> → ${dayjs().format('ddd, MMM Do')}<br>
            <code style="color: #fff;">h:mm A • MMM D</code> → ${dayjs().format('h:mm A • MMM D')}<br>
            <code style="color: #fff;">[Today is] dddd</code> → ${dayjs().format('[Today is] dddd')}
          </small>
        </div>
      `;
    } else {
      examplesHTML = `
        <div style="margin-top: 10px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px;">
          <small style="color: #aaa; display: block; line-height: 1.6;">
            <strong style="color: #00ff88;">Common Format Examples:</strong><br>
            <code style="color: #fff;">YYYY-MM-DD</code> → ISO date format<br>
            <code style="color: #fff;">MM/DD/YYYY</code> → US date format<br>
            <code style="color: #fff;">DD/MM/YYYY</code> → EU date format<br>
            <code style="color: #fff;">MMMM D, YYYY</code> → Full month name<br>
            <code style="color: #fff;">ddd, MMM Do</code> → Short weekday and ordinal<br>
            <code style="color: #fff;">h:mm A • MMM D</code> → Time and date<br>
            <code style="color: #fff;">[Today is] dddd</code> → With literal text
          </small>
        </div>
      `;
    }
    
    targetContainer.innerHTML = `
      <h3>${isEdit ? 'Edit Date Widget' : 'Date Widget'}</h3>
      
      <div class="input-group">
        <label for="date-format">
          Format 
          <a href="https://day.js.org/docs/en/display/format" target="_blank" 
             style="font-size: 0.8em; color: #7877c6; text-decoration: none; margin-left: 8px;">
            📖 Format Guide
          </a>
        </label>
        <input type="text" id="date-format" 
               placeholder="Enter Day.js format string" 
               value="${currentFormat}"
               style="font-family: monospace; font-size: 14px;">
        ${examplesHTML}
      </div>
      
      <div class="input-group">
        <label>Live Preview</label>
        <div id="date-preview" style="padding: 15px; background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.3); border-radius: 6px; font-weight: bold; color: #00ff88; margin-top: 8px; font-size: 1.3em; text-align: center; min-height: 30px;"></div>
      </div>
      
      <div class="input-group" style="margin-top: 15px;">
        <div style="padding: 10px; background: rgba(120,119,198,0.1); border-radius: 6px;">
          <small style="color: #aaa; line-height: 1.5;">
            <strong style="color: #7877c6;">Common Tokens:</strong><br>
            <code>YYYY</code> = Year (2025) &nbsp;
            <code>MM</code> = Month (01-12) &nbsp;
            <code>DD</code> = Day (01-31)<br>
            <code>MMMM</code> = Full month (January) &nbsp;
            <code>MMM</code> = Short month (Jan)<br>
            <code>dddd</code> = Full weekday (Monday) &nbsp;
            <code>ddd</code> = Short weekday (Mon)<br>
            <code>HH</code> = 24-hour (00-23) &nbsp;
            <code>h</code> = 12-hour (1-12) &nbsp;
            <code>mm</code> = Minutes &nbsp;
            <code>A</code> = AM/PM<br>
            <code>Do</code> = Day with ordinal (1st, 2nd) &nbsp;
            <code>[text]</code> = Literal text
          </small>
        </div>
      </div>
      
      <div class="widget-config-buttons">
        <button id="date-save">${isEdit ? 'Save' : 'Add'}</button>
        <button id="date-cancel">${isEdit ? 'Exit' : 'Cancel'}</button>
      </div>
    `;

    // Live preview functionality - simplified
    function updatePreview() {
      const format = document.getElementById('date-format').value.trim();
      const previewDiv = document.getElementById('date-preview');
      
      if (!format) {
        previewDiv.textContent = 'Enter a format above to see preview';
        previewDiv.style.color = '#666';
        return;
      }
      
      // Simply format with Day.js and display
      if (typeof dayjs !== 'undefined') {
        try {
          previewDiv.textContent = dayjs().format(format);
          previewDiv.style.color = '#00ff88';
        } catch (error) {
          previewDiv.textContent = 'Invalid format';
          previewDiv.style.color = '#ff6b6b';
        }
      } else {
        previewDiv.textContent = 'Day.js not loaded';
        previewDiv.style.color = '#ff6b6b';
      }
    }

    // Set up event listener
    const formatInput = document.getElementById('date-format');
    formatInput.addEventListener('input', updatePreview);
    
    // Focus on format input
    setTimeout(() => formatInput.focus(), 100);
    
    // Initial preview
    updatePreview();

    // Save/cancel handlers
    setupWidgetConfigButtons(isEdit, 'date', index, addDateWidget, () => {
      const format = document.getElementById('date-format').value.trim();
      
      if (!format) {
        alert('Please enter a format string');
        return null;
      }
      
      return {
        format: format
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