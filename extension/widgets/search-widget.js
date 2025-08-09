// Search Widget Implementation
(function() {
  'use strict';

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
    input.id = `search-input-${index}`; // Add unique ID for direct selection
    
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

  // Register the search widget
  registerWidget('search', {
    name: 'Search',
    render: renderSearchWidget,
    openConfig: openSearchConfig
  });

})();