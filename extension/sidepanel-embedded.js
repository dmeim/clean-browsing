// Embedded Sidepanel JavaScript
// Ported from sidepanel.js for in-tab split-view functionality

class EmbeddedSidepanel {
  constructor() {
    this.sidebarSettings = null;
    this.currentWebsiteUrl = null;
    this.currentBackgroundImage = null;
    this.urlTrackingInterval = null;
    this.lastKnownUrl = null;
    this.navigationCheckInterval = null;
    this.navigationState = {};
    this.pendingNavigationRequests = new Map();

    this.init();
  }

  init() {
    // Wait for DOM and split-view manager to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeSidepanel());
    } else {
      this.initializeSidepanel();
    }
  }

  async initializeSidepanel() {
    // Wait for split-view manager
    const waitForSplitView = () => {
      if (window.splitViewManager) {
        this.setupIntegration();
      } else {
        setTimeout(waitForSplitView, 100);
      }
    };
    waitForSplitView();

    // Load settings
    this.sidebarSettings = await this.loadSidebarSettings();

    // Render website list
    this.renderWebsiteList();

    // Set up event listeners
    this.setupEventListeners();

    // Apply behavior settings
    this.applyBehaviorSettings();

    // Load and apply appearance settings
    this.loadAppearanceSettings();
  }

  setupIntegration() {
    // Listen for split-view events
    window.addEventListener('sidepanel-opened', (e) => {
      console.log('Sidepanel opened, width:', e.detail.width);
    });

    window.addEventListener('sidepanel-closed', () => {
      console.log('Sidepanel closed');
      // Close any iframe that might be open
      this.backToList();
    });
  }

  // Load settings from main extension settings (localStorage)
  loadSidebarSettings() {
    return new Promise((resolve) => {
      try {
        const mainSettings = JSON.parse(localStorage.getItem('settings') || '{}');
        if (mainSettings.sidebarSettings && mainSettings.sidebarSettings.sidebarWebsites) {
          console.log('Loading sidepanel settings from main settings');
          resolve(mainSettings.sidebarSettings);
          return;
        }
      } catch (e) {
        console.log('Could not load from main settings:', e);
      }

      // Fallback to default settings
      console.log('Using default sidepanel settings');
      resolve(this.getDefaultSidebarSettings());
    });
  }

  // Save settings to localStorage
  saveSidebarSettings() {
    return new Promise((resolve) => {
      try {
        const mainSettings = JSON.parse(localStorage.getItem('settings') || '{}');
        mainSettings.sidebarSettings = this.sidebarSettings;
        localStorage.setItem('settings', JSON.stringify(mainSettings));
        console.log('Saved sidepanel settings to main settings');
        resolve({ success: true });
      } catch (e) {
        console.error('Failed to save sidepanel settings:', e);
        resolve({ success: false, error: e.message });
      }
    });
  }

  // Default settings
  getDefaultSidebarSettings() {
    return {
      sidebarEnabled: true,
      sidebarWebsites: [
        {
          id: 'wikipedia',
          name: 'Wikipedia',
          url: 'https://en.wikipedia.org',
          icon: '📚',
          favicon: 'https://en.wikipedia.org/favicon.ico',
          iconType: 'favicon',
          openMode: 'iframe',
          position: 0,
        },
        {
          id: 'archive',
          name: 'Internet Archive',
          url: 'https://archive.org',
          icon: '📁',
          favicon: 'https://archive.org/favicon.ico',
          iconType: 'favicon',
          openMode: 'iframe',
          position: 1,
        },
        {
          id: 'chatgpt',
          name: 'ChatGPT',
          url: 'https://chatgpt.com',
          icon: '🤖',
          favicon: 'https://chatgpt.com/favicon.ico',
          iconType: 'favicon',
          openMode: 'iframe',
          position: 2,
        },
      ],
      sidebarBehavior: {
        autoClose: false,
        showUrls: true,
        compactMode: false,
      },
      sidebarAppearance: {
        backgroundType: 'gradient',
        gradientColor1: '#667eea',
        gradientColor2: '#764ba2',
        gradientAngle: 135,
        solidColor: '#667eea',
        backgroundImage: null,
        backgroundOpacity: 100,
      },
    };
  }

  // Utility function to get favicon URL
  getFaviconUrl(websiteUrl) {
    try {
      const url = new URL(websiteUrl);
      return `${url.protocol}//${url.hostname}/favicon.ico`;
    } catch (e) {
      return null;
    }
  }

  // Utility function to get website icon
  getWebsiteIcon(website) {
    if (website.iconType === 'none') {
      return '';
    } else if (website.iconType === 'favicon' && website.favicon) {
      return `<div class="website-icon-wrapper">
                <img src="${website.favicon}" alt="" class="website-favicon" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <span class="website-icon" style="display:none">${website.icon || '🌐'}</span>
              </div>`;
    } else if (website.iconType === 'emoji' || !website.iconType) {
      return `<span class="website-icon">${website.icon || '🌐'}</span>`;
    }
    return '';
  }

  // Render the website list
  renderWebsiteList() {
    const websiteList = document.getElementById('website-list');
    if (!websiteList) return;

    websiteList.innerHTML = '';

    // Sort websites by position
    const sortedWebsites = [...this.sidebarSettings.sidebarWebsites].sort(
      (a, b) => a.position - b.position
    );

    sortedWebsites.forEach((website) => {
      const websiteItem = this.createWebsiteItem(website);
      websiteList.appendChild(websiteItem);
    });

    // Add empty state if no websites
    if (sortedWebsites.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <p>No websites added yet</p>
        <p class="hint">Click the settings icon to add websites</p>
      `;
      websiteList.appendChild(emptyState);
    }
  }

  // Create a website item element
  createWebsiteItem(website) {
    const item = document.createElement('div');
    item.className = 'website-item';
    if (this.sidebarSettings.sidebarBehavior.compactMode) {
      item.classList.add('compact');
    }

    const icon = this.getWebsiteIcon(website);
    const showUrls = this.sidebarSettings.sidebarBehavior.showUrls;

    if (showUrls) {
      item.classList.add('show-urls');
    }

    item.innerHTML = `
      ${icon}
      <div class="website-info">
        <div class="website-name">${website.name}</div>
        ${showUrls ? `<div class="website-url">${website.url}</div>` : ''}
      </div>
    `;

    item.addEventListener('click', () => this.openWebsite(website));

    return item;
  }

  // Open a website based on its mode
  openWebsite(website) {
    switch (website.openMode) {
      case 'iframe':
        this.openInIframe(website);
        break;
      case 'newtab':
        window.open(website.url, '_blank');
        if (this.sidebarSettings.sidebarBehavior.autoClose) {
          window.splitViewManager?.close();
        }
        break;
      case 'newwindow':
        window.open(website.url, '_blank', 'width=1024,height=768');
        if (this.sidebarSettings.sidebarBehavior.autoClose) {
          window.splitViewManager?.close();
        }
        break;
      case 'privatetab':
        // Can't open private tabs from content scripts, fallback to new tab
        window.open(website.url, '_blank');
        if (this.sidebarSettings.sidebarBehavior.autoClose) {
          window.splitViewManager?.close();
        }
        break;
      case 'privatewindow':
        // Can't open private windows from content scripts, fallback to new window
        window.open(website.url, '_blank', 'width=1024,height=768');
        if (this.sidebarSettings.sidebarBehavior.autoClose) {
          window.splitViewManager?.close();
        }
        break;
      default:
        // Fallback to new tab
        window.open(website.url, '_blank');
        if (this.sidebarSettings.sidebarBehavior.autoClose) {
          window.splitViewManager?.close();
        }
        break;
    }
  }

  // Open website in iframe
  async openInIframe(website) {
    const websiteList = document.getElementById('website-list');
    const iframeContainer = document.getElementById('iframe-container');
    const iframe = document.getElementById('website-iframe');
    const iframeTitle = document.getElementById('iframe-title');
    const iframeCurrentUrl = document.getElementById('iframe-current-url');

    if (!websiteList || !iframeContainer || !iframe || !iframeTitle || !iframeCurrentUrl) {
      console.error('Required iframe elements not found');
      return;
    }

    // Hide website list, show iframe
    websiteList.classList.add('hidden');
    iframeContainer.classList.remove('hidden');

    // Set title and initialize current URL
    iframeTitle.textContent = website.name;
    iframeCurrentUrl.textContent = website.url;
    iframeCurrentUrl.title = 'Click to copy: ' + website.url;
    iframeCurrentUrl.className = 'iframe-current-url';
    this.currentWebsiteUrl = website.url;

    // Set up click handler for URL copying
    this.setupUrlClickHandler(iframeCurrentUrl, website.url);

    // Clear any existing handlers
    iframe.onerror = null;
    iframe.onload = null;

    // Handle network errors
    iframe.onerror = () => {
      clearTimeout(loadTimeout);
      console.log(`Network error loading ${website.name}`);
      this.handleIframeError(website, 'network_error');
    };

    // Handle successful loads
    iframe.onload = () => {
      clearTimeout(loadTimeout);
      console.log(`Successfully loaded ${website.name} in iframe`);

      // Enable URL tracking in the iframe content script
      const enableTracking = () => {
        try {
          iframe.contentWindow.postMessage(
            {
              type: 'SIDEPANEL_ENABLE_TRACKING',
              enabled: true,
            },
            '*'
          );
        } catch (e) {
          console.log('Could not enable tracking in iframe (CORS expected)');
        }
      };

      // Send immediately and after delays to ensure content script receives it
      enableTracking();
      setTimeout(enableTracking, 500);
      setTimeout(enableTracking, 1500);
      setTimeout(enableTracking, 3000);

      // Request navigation state after iframe loads
      setTimeout(() => {
        this.requestNavigationState();
      }, 2000);
    };

    // Set a reasonable timeout for slow-loading sites
    const loadTimeout = setTimeout(() => {
      console.log(`Timeout loading ${website.name}`);
      this.handleIframeError(website, 'timeout');
    }, 10000);

    // Load the URL
    iframe.src = website.url;

    // Start URL tracking
    this.startUrlTracking(iframe, iframeCurrentUrl);
  }

  // Handle iframe loading errors
  handleIframeError(website, errorType) {
    const iframeContainer = document.getElementById('iframe-container');
    const iframe = document.getElementById('website-iframe');

    if (!iframeContainer || !iframe) return;

    const errorMessage =
      errorType === 'timeout'
        ? 'This site is taking too long to load.'
        : 'This site cannot be loaded in an iframe.';

    // Show error message with fallback options
    iframeContainer.innerHTML = `
      <div class="iframe-error">
        <div class="error-content">
          <h3>Cannot load ${website.name}</h3>
          <p>${errorMessage}</p>
          <div class="error-actions">
            <button class="primary-btn" data-action="open-in-tab" data-url="${website.url}">
              Open in New Tab
            </button>
            <button class="icon-btn" data-action="back-to-list">
              Back to List
            </button>
          </div>
        </div>
      </div>
    `;

    // Set up event listeners for error action buttons
    const errorActions = iframeContainer.querySelector('.error-actions');
    if (errorActions) {
      errorActions.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action === 'open-in-tab') {
          const url = e.target.dataset.url;
          if (url) {
            window.open(url, '_blank');
          }
        } else if (action === 'back-to-list') {
          this.backToList();
        }
      });
    }
  }

  // Start tracking URL changes in iframe
  startUrlTracking(iframe, urlElement) {
    // Clear any existing tracking
    this.stopUrlTracking();

    // Set up periodic URL checking
    this.urlTrackingInterval = setInterval(() => {
      this.updateCurrentUrl(iframe, urlElement);
    }, 2000);

    // Initial URL update
    this.updateCurrentUrl(iframe, urlElement);

    console.log('URL tracking started for iframe');
  }

  // Stop URL tracking
  stopUrlTracking() {
    if (this.urlTrackingInterval) {
      clearInterval(this.urlTrackingInterval);
      this.urlTrackingInterval = null;
    }

    if (this.navigationCheckInterval) {
      clearInterval(this.navigationCheckInterval);
      this.navigationCheckInterval = null;
    }
  }

  // Update the current URL display
  updateCurrentUrl(iframe, urlElement) {
    try {
      let displayUrl = this.currentWebsiteUrl || iframe.src;
      let urlSource = 'cached';

      // Try to get actual current URL for same-origin content
      try {
        if (
          iframe.contentWindow &&
          iframe.contentWindow.location &&
          iframe.contentWindow.location.href &&
          iframe.contentWindow.location.href !== 'about:blank'
        ) {
          displayUrl = iframe.contentWindow.location.href;
          urlSource = 'contentWindow';
        }
      } catch (e) {
        // CORS blocked - expected for most external sites
      }

      // Check iframe src
      if (iframe.src && (!displayUrl || displayUrl === 'about:blank')) {
        displayUrl = iframe.src;
        urlSource = 'iframe.src';
      }

      // Use stored URL as fallback
      if (!displayUrl || displayUrl === 'about:blank') {
        displayUrl = this.currentWebsiteUrl || this.lastKnownUrl;
        urlSource = 'fallback';
      }

      if (!displayUrl || displayUrl === 'about:blank') {
        urlElement.textContent = 'Loading...';
        urlElement.title = 'Loading website...';
        urlElement.className = 'iframe-current-url unavailable';
        this.removeUrlClickHandler(urlElement);
        return;
      }

      // Only update if URL actually changed
      if (displayUrl !== this.lastKnownUrl) {
        console.log(`URL updated (${urlSource}):`, this.lastKnownUrl, '→', displayUrl);
        this.currentWebsiteUrl = displayUrl;
        this.lastKnownUrl = displayUrl;

        // Update the display
        urlElement.textContent = displayUrl;
        urlElement.title = 'Click to copy: ' + displayUrl;
        urlElement.className = 'iframe-current-url';
        this.setupUrlClickHandler(urlElement, displayUrl);
      }
    } catch (error) {
      console.error('Error updating current URL:', error);
    }
  }

  // Set up URL click handler for copying
  setupUrlClickHandler(element, url) {
    const clickHandler = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        await navigator.clipboard.writeText(url);

        const originalText = element.textContent;
        element.textContent = 'URL Copied!';
        element.style.color = '#4CAF50';

        setTimeout(() => {
          element.textContent = originalText;
          element.style.color = '';
        }, 1500);
      } catch (err) {
        console.error('Failed to copy URL:', err);

        const originalText = element.textContent;
        element.textContent = 'Copy failed';
        element.style.color = '#f44336';

        setTimeout(() => {
          element.textContent = originalText;
          element.style.color = '';
        }, 1500);
      }
    };

    // Remove any existing click handler
    this.removeUrlClickHandler(element);

    // Add new click handler
    element.addEventListener('click', clickHandler);
    element._clickHandler = clickHandler;
  }

  // Remove URL click handler
  removeUrlClickHandler(element) {
    if (element._clickHandler) {
      element.removeEventListener('click', element._clickHandler);
      delete element._clickHandler;
    }
  }

  // Request navigation state from iframe content script
  requestNavigationState() {
    const iframe = document.getElementById('website-iframe');
    if (!iframe) return;

    try {
      iframe.contentWindow.postMessage(
        {
          type: 'SIDEPANEL_GET_NAVIGATION_STATE',
        },
        '*'
      );
    } catch (e) {
      console.log('Could not request navigation state from iframe (CORS expected)');
    }
  }

  // Back to list functionality
  backToList() {
    const websiteList = document.getElementById('website-list');
    const iframeContainer = document.getElementById('iframe-container');
    const iframe = document.getElementById('website-iframe');

    if (!websiteList || !iframeContainer || !iframe) return;

    // Stop URL tracking
    this.stopUrlTracking();

    // Clear iframe
    iframe.src = 'about:blank';
    this.currentWebsiteUrl = null;
    this.lastKnownUrl = null;

    // Show website list, hide iframe
    iframeContainer.classList.add('hidden');
    websiteList.classList.remove('hidden');

    // Re-render the original iframe container if it was replaced with error content
    if (!iframe.parentNode || iframe.parentNode.classList.contains('iframe-error')) {
      this.restoreIframeContainer();
    }
  }

  // Restore iframe container to original state
  restoreIframeContainer() {
    const iframeContainer = document.getElementById('iframe-container');
    if (!iframeContainer) return;

    iframeContainer.innerHTML = `
      <div class="iframe-header">
        <button id="back-to-list" class="icon-btn" title="Back to list">←</button>
        <div class="iframe-info">
          <span id="iframe-title" class="iframe-name"></span>
          <span id="iframe-current-url" class="iframe-current-url">Loading...</span>
        </div>
        <div class="iframe-navigation">
          <button id="nav-back" class="nav-btn" title="Back">⬅</button>
          <button id="nav-refresh" class="nav-btn" title="Refresh">↻</button>
        </div>
        <button id="open-in-tab" class="icon-btn" title="Open in new tab">↗</button>
      </div>
      <iframe id="website-iframe" class="website-iframe"></iframe>
    `;

    // Re-setup event listeners for iframe controls
    this.setupIframeEventListeners();
  }

  // Set up event listeners
  setupEventListeners() {
    // Settings button
    const settingsBtn = document.getElementById('sidepanel-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.showSettings());
    }

    // Setup iframe event listeners
    this.setupIframeEventListeners();

    // Listen for iframe messages
    this.setupMessageListeners();
  }

  // Setup iframe-specific event listeners
  setupIframeEventListeners() {
    // Back to list button
    const backBtn = document.getElementById('back-to-list');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.backToList());
    }

    // Navigation buttons
    const navBackBtn = document.getElementById('nav-back');
    const navRefreshBtn = document.getElementById('nav-refresh');
    const openInTabBtn = document.getElementById('open-in-tab');

    if (navBackBtn) {
      navBackBtn.addEventListener('click', () => this.navigateIframe('back'));
    }

    if (navRefreshBtn) {
      navRefreshBtn.addEventListener('click', () => this.navigateIframe('refresh'));
    }

    if (openInTabBtn) {
      openInTabBtn.addEventListener('click', () => {
        if (this.currentWebsiteUrl) {
          window.open(this.currentWebsiteUrl, '_blank');
        }
      });
    }
  }

  // Setup message listeners for iframe communication
  setupMessageListeners() {
    window.addEventListener('message', (event) => {
      if (!event.data) return;

      // Handle URL change messages
      if (event.data.type === 'SIDEPANEL_URL_CHANGE') {
        const newUrl = event.data.url;

        if (newUrl) {
          console.log(
            'URL change detected from content script:',
            this.currentWebsiteUrl,
            '→',
            newUrl
          );

          this.currentWebsiteUrl = newUrl;
          this.lastKnownUrl = newUrl;

          // Update the display
          const iframeCurrentUrl = document.getElementById('iframe-current-url');
          if (iframeCurrentUrl && !iframeCurrentUrl.classList.contains('hidden')) {
            iframeCurrentUrl.textContent = newUrl;
            iframeCurrentUrl.title = 'Click to copy: ' + newUrl;
            iframeCurrentUrl.className = 'iframe-current-url';
            this.setupUrlClickHandler(iframeCurrentUrl, newUrl);
          }
        }
      }
      // Handle navigation state updates
      else if (event.data.type === 'SIDEPANEL_NAVIGATION_STATE') {
        console.log('Navigation state received');
      }
      // Handle navigation results
      else if (event.data.type === 'SIDEPANEL_NAVIGATION_RESULT') {
        const requestId = event.data.requestId;
        const success = event.data.success;
        const command = event.data.command;
        const reason = event.data.reason;

        if (this.pendingNavigationRequests.has(requestId)) {
          this.pendingNavigationRequests.delete(requestId);

          if (success) {
            console.log(`Navigation ${command} succeeded`);
            setTimeout(() => this.requestNavigationState(), 200);
          } else {
            console.log(`Navigation ${command} failed:`, reason);
          }
        }
      }
    });
  }

  // Navigate iframe (back/refresh)
  navigateIframe(command) {
    const iframe = document.getElementById('website-iframe');
    if (!iframe) return;

    const requestId = Date.now() + Math.random();
    this.pendingNavigationRequests.set(requestId, command);

    try {
      iframe.contentWindow.postMessage(
        {
          type: 'SIDEPANEL_NAVIGATE',
          command: command,
          requestId: requestId,
        },
        '*'
      );
    } catch (e) {
      console.log('Could not send navigation command to iframe (CORS expected)');
      this.pendingNavigationRequests.delete(requestId);

      // Fallback navigation
      if (command === 'refresh') {
        iframe.src = iframe.src;
      }
    }
  }

  // Show settings modal
  showSettings() {
    const modal = document.getElementById('sidepanel-settings-modal');
    if (modal) {
      modal.classList.remove('hidden');
      this.setupSettingsModalListeners();
    }
  }

  // Hide settings modal
  hideSettings() {
    const modal = document.getElementById('sidepanel-settings-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  // Setup settings modal event listeners
  setupSettingsModalListeners() {
    // Close settings button
    const closeBtn = document.getElementById('close-sidepanel-settings');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideSettings());
    }

    // Tab switching
    const tabBtns = document.querySelectorAll('#sidepanel-settings-modal .tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => this.switchSettingsTab(btn.dataset.tab));
    });

    // Add website functionality
    const addWebsiteBtn = document.getElementById('add-website-btn');
    if (addWebsiteBtn) {
      addWebsiteBtn.addEventListener('click', () => this.addWebsite());
    }

    // Icon type switching
    const iconTypeRadios = document.querySelectorAll('input[name="icon-type"]');
    iconTypeRadios.forEach((radio) => {
      radio.addEventListener('change', () => this.toggleEmojiInput());
    });

    // Save settings
    const saveBtn = document.getElementById('save-sidepanel-settings');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveSettings());
    }

    // Load current settings into form
    this.loadSettingsForm();
  }

  // Switch settings tabs
  switchSettingsTab(tabName) {
    // Update tab buttons
    const tabBtns = document.querySelectorAll('#sidepanel-settings-modal .tab-btn');
    tabBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Show/hide tab content
    const tabContents = document.querySelectorAll('#sidepanel-settings-modal .tab-content');
    tabContents.forEach((content) => {
      content.classList.toggle('hidden', content.id !== `${tabName}-tab`);
    });
  }

  // Toggle emoji input visibility
  toggleEmojiInput() {
    const emojiRadio = document.querySelector('input[name="icon-type"][value="emoji"]');
    const emojiGroup = document.getElementById('emoji-input-group');

    if (emojiRadio && emojiGroup) {
      emojiGroup.style.display = emojiRadio.checked ? 'block' : 'none';
    }
  }

  // Add new website
  addWebsite() {
    const nameInput = document.getElementById('website-name');
    const urlInput = document.getElementById('website-url');
    const iconInput = document.getElementById('website-icon');
    const modeSelect = document.getElementById('website-mode');
    const iconTypeRadios = document.querySelectorAll('input[name="icon-type"]');

    if (!nameInput || !urlInput || !modeSelect) return;

    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    const mode = modeSelect.value;

    if (!name || !url) {
      alert('Please fill in both name and URL');
      return;
    }

    // Get selected icon type
    let iconType = 'favicon';
    iconTypeRadios.forEach((radio) => {
      if (radio.checked) iconType = radio.value;
    });

    const icon = iconInput ? iconInput.value.trim() || '🌐' : '🌐';

    // Create new website object
    const website = {
      id: Date.now().toString(),
      name: name,
      url: url,
      icon: icon,
      iconType: iconType,
      favicon: iconType === 'favicon' ? this.getFaviconUrl(url) : null,
      openMode: mode,
      position: this.sidebarSettings.sidebarWebsites.length,
    };

    // Add to settings
    this.sidebarSettings.sidebarWebsites.push(website);

    // Save and re-render
    this.saveSidebarSettings().then(() => {
      this.renderWebsiteList();
      this.clearAddWebsiteForm();
    });
  }

  // Clear add website form
  clearAddWebsiteForm() {
    const nameInput = document.getElementById('website-name');
    const urlInput = document.getElementById('website-url');
    const iconInput = document.getElementById('website-icon');
    const modeSelect = document.getElementById('website-mode');
    const iconTypeRadios = document.querySelectorAll('input[name="icon-type"]');

    if (nameInput) nameInput.value = '';
    if (urlInput) urlInput.value = '';
    if (iconInput) iconInput.value = '';
    if (modeSelect) modeSelect.value = 'iframe';

    iconTypeRadios.forEach((radio, index) => {
      radio.checked = index === 0; // Check first option (favicon)
    });

    this.toggleEmojiInput();
  }

  // Load current settings into form
  loadSettingsForm() {
    // Load behavior settings
    const autoCloseCheckbox = document.getElementById('auto-close');
    const showUrlsCheckbox = document.getElementById('show-urls');
    const compactModeCheckbox = document.getElementById('compact-mode');

    if (autoCloseCheckbox) {
      autoCloseCheckbox.checked = this.sidebarSettings.sidebarBehavior.autoClose || false;
    }
    if (showUrlsCheckbox) {
      showUrlsCheckbox.checked = this.sidebarSettings.sidebarBehavior.showUrls !== false;
    }
    if (compactModeCheckbox) {
      compactModeCheckbox.checked = this.sidebarSettings.sidebarBehavior.compactMode || false;
    }
  }

  // Save settings from form
  saveSettings() {
    // Save behavior settings
    const autoCloseCheckbox = document.getElementById('auto-close');
    const showUrlsCheckbox = document.getElementById('show-urls');
    const compactModeCheckbox = document.getElementById('compact-mode');

    if (autoCloseCheckbox) {
      this.sidebarSettings.sidebarBehavior.autoClose = autoCloseCheckbox.checked;
    }
    if (showUrlsCheckbox) {
      this.sidebarSettings.sidebarBehavior.showUrls = showUrlsCheckbox.checked;
    }
    if (compactModeCheckbox) {
      this.sidebarSettings.sidebarBehavior.compactMode = compactModeCheckbox.checked;
    }

    // Save and apply settings
    this.saveSidebarSettings().then(() => {
      this.applyBehaviorSettings();
      this.hideSettings();
    });
  }

  // Apply behavior settings
  applyBehaviorSettings() {
    // This would apply compact mode, show URLs, etc.
    // For now, just re-render the list to apply any changes
    this.renderWebsiteList();
  }

  // Load appearance settings
  loadAppearanceSettings() {
    // Apply any appearance customizations
    if (this.sidebarSettings.sidebarAppearance) {
      // Apply background, colors, etc.
    }
  }
}

// Initialize embedded sidepanel
let embeddedSidepanel;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    embeddedSidepanel = new EmbeddedSidepanel();
    window.embeddedSidepanel = embeddedSidepanel; // Export AFTER creation
  });
} else {
  embeddedSidepanel = new EmbeddedSidepanel();
  window.embeddedSidepanel = embeddedSidepanel; // Export AFTER creation
}
