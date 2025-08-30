// Self-contained content script to inject embedded sidepanel on any webpage
// This creates an overlay sidepanel that works exactly like the new tab version
// NO external script dependencies - everything is bundled here

(function() {
  'use strict';
  
  console.log('🚀 Clean-Browsing: Sidepanel injector loading...');
  
  // Only inject on main pages, not iframes
  if (window.top !== window.self) {
    console.log('🔄 Clean-Browsing: Skipping iframe injection');
    return;
  }
  
  // Don't inject on the new tab page (already has embedded sidepanel)
  if (window.location.href.includes('chrome-extension://') && window.location.href.includes('newtab.html')) {
    console.log('🔄 Clean-Browsing: Skipping new tab page');
    return;
  }
  
  let isInjected = false;
  let sidepanelContainer = null;
  let sidepanelManager = null;
  let sidebarSettings = null;
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Clean-Browsing: Message received:', request);
    
    if (request.action === 'toggleSidepanel') {
      try {
        toggleSidepanel();
        sendResponse({ success: true, injected: isInjected });
      } catch (error) {
        console.error('❌ Clean-Browsing: Toggle failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    }
    return true;
  });
  
  function toggleSidepanel() {
    console.log('🔄 Clean-Browsing: Toggle sidepanel, isInjected:', isInjected);
    
    if (!isInjected) {
      injectSidepanel();
    } else {
      if (sidepanelManager) {
        sidepanelManager.toggle();
      }
    }
  }
  
  async function injectSidepanel() {
    if (isInjected) {
      console.log('⚠️ Clean-Browsing: Already injected, skipping');
      return;
    }
    
    console.log('🚀 Clean-Browsing: Starting injection...');
    
    try {
      // Load settings first
      await loadSidebarSettings();
      
      // Create container
      createSidepanelContainer();
      
      // Initialize functionality
      initializeSidepanelManager();
      
      // Render website list
      renderWebsiteList();
      
      // Open the panel
      setTimeout(() => {
        if (sidepanelManager) {
          sidepanelManager.open();
          console.log('✅ Clean-Browsing: Sidepanel opened');
        }
      }, 100);
      
      isInjected = true;
      console.log('✅ Clean-Browsing: Injection completed successfully');
      
    } catch (error) {
      console.error('❌ Clean-Browsing: Injection failed:', error);
      showErrorMessage('Failed to initialize sidepanel: ' + error.message);
    }
  }
  
  async function loadSidebarSettings() {
    console.log('📚 Clean-Browsing: Loading settings...');
    
    try {
      const result = await chrome.storage.local.get(['sidebarSettings']);
      sidebarSettings = result.sidebarSettings || getDefaultSidebarSettings();
      console.log('✅ Clean-Browsing: Settings loaded:', sidebarSettings);
    } catch (error) {
      console.error('❌ Clean-Browsing: Settings load failed:', error);
      sidebarSettings = getDefaultSidebarSettings();
    }
  }
  
  function getDefaultSidebarSettings() {
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
          position: 0
        },
        {
          id: 'archive',
          name: 'Internet Archive',
          url: 'https://archive.org',
          icon: '📁',
          favicon: 'https://archive.org/favicon.ico',
          iconType: 'favicon',
          openMode: 'iframe',
          position: 1
        },
        {
          id: 'chatgpt',
          name: 'ChatGPT',
          url: 'https://chatgpt.com',
          icon: '🤖',
          favicon: 'https://chatgpt.com/favicon.ico',
          iconType: 'favicon',
          openMode: 'iframe',
          position: 2
        }
      ],
      sidebarBehavior: {
        autoClose: false,
        showUrls: true,
        compactMode: false
      }
    };
  }
  
  function createSidepanelContainer() {
    console.log('🏗️ Clean-Browsing: Creating container...');
    
    // Create container that won't affect page layout
    const container = document.createElement('div');
    container.id = 'clean-browsing-sidepanel-overlay';
    container.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      width: 0 !important;
      height: 100vh !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif !important;
      transition: width 0.3s ease !important;
      overflow: hidden !important;
    `;
    
    // Create the sidepanel structure
    container.innerHTML = `
      <div class="sidepanel-container" style="
        display: flex !important;
        flex-direction: row !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.2) !important;
        backdrop-filter: blur(10px) !important;
        border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
        opacity: 0 !important;
        transition: opacity 0.3s ease !important;
        pointer-events: auto !important;
      ">
        <div class="sidepanel-resize-handle" style="
          width: 6px !important;
          background: rgba(255, 255, 255, 0.1) !important;
          cursor: ew-resize !important;
          border-right: 1px solid rgba(255, 255, 255, 0.2) !important;
          transition: background-color 0.2s ease !important;
          flex-shrink: 0 !important;
          position: relative !important;
          z-index: 100 !important;
        " title="Drag to resize">
          <div style="
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 3px !important;
            height: 30px !important;
            background: rgba(255, 255, 255, 0.3) !important;
            border-radius: 2px !important;
          "></div>
        </div>
        
        <div class="sidepanel-content" style="
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          height: 100vh !important;
          min-width: 280px !important;
          color: #ffffff !important;
        ">
          <!-- Header -->
          <div class="sidepanel-header" style="
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 12px 16px !important;
            background: rgba(0, 0, 0, 0.4) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            flex-shrink: 0 !important;
            gap: 8px !important;
          ">
            <div class="header-title" style="
              display: flex !important;
              align-items: center !important;
              gap: 8px !important;
              font-size: 14px !important;
              font-weight: 600 !important;
              min-width: 0 !important;
              flex: 1 !important;
            ">
              <span style="white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important;">Quick Access</span>
            </div>
            <button id="sidepanel-settings-btn" class="icon-btn" title="Settings" style="
              background: rgba(255, 255, 255, 0.1) !important;
              border: 1px solid rgba(255, 255, 255, 0.2) !important;
              color: #ffffff !important;
              padding: 4px 8px !important;
              border-radius: 6px !important;
              cursor: pointer !important;
              font-size: 14px !important;
              transition: all 0.2s ease !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              min-width: 24px !important;
              height: 24px !important;
              flex-shrink: 0 !important;
            ">⚙️</button>
            <button id="sidepanel-close-btn" class="icon-btn" title="Close Panel" style="
              background: rgba(255, 255, 255, 0.1) !important;
              border: 1px solid rgba(255, 255, 255, 0.2) !important;
              color: #ffffff !important;
              padding: 4px 8px !important;
              border-radius: 6px !important;
              cursor: pointer !important;
              font-size: 14px !important;
              transition: all 0.2s ease !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              min-width: 24px !important;
              height: 24px !important;
              flex-shrink: 0 !important;
            ">✕</button>
          </div>

          <!-- Website List -->
          <div id="website-list" class="website-list" style="
            flex: 1 !important;
            overflow-y: auto !important;
            padding: 8px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 6px !important;
          ">
            <!-- Websites will be dynamically added here -->
          </div>

          <!-- Iframe Container -->
          <div id="iframe-container" class="iframe-container" style="
            flex: 1 !important;
            display: none !important;
            flex-direction: column !important;
            background: rgba(0, 0, 0, 0.1) !important;
          ">
            <div class="iframe-header" style="
              display: flex !important;
              align-items: center !important;
              gap: 8px !important;
              padding: 8px 12px !important;
              background: rgba(0, 0, 0, 0.4) !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
              min-height: 40px !important;
            ">
              <button id="back-to-list" class="icon-btn" title="Back to list" style="
                background: rgba(255, 255, 255, 0.1) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                color: #ffffff !important;
                padding: 2px 6px !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-size: 12px !important;
                min-width: 20px !important;
                height: 20px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
              ">←</button>
              <div class="iframe-info" style="
                flex: 1 !important;
                min-width: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 1px !important;
              ">
                <span id="iframe-title" style="
                  font-weight: 500 !important;
                  font-size: 12px !important;
                  white-space: nowrap !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                "></span>
                <span id="iframe-current-url" style="
                  font-size: 10px !important;
                  color: rgba(255, 255, 255, 0.7) !important;
                  white-space: nowrap !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                  cursor: pointer !important;
                  transition: color 0.2s ease !important;
                ">Loading...</span>
              </div>
              <button id="open-in-tab" class="icon-btn" title="Open in new tab" style="
                background: rgba(255, 255, 255, 0.1) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                color: #ffffff !important;
                padding: 4px 8px !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-size: 14px !important;
                min-width: 24px !important;
                height: 24px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
              ">↗</button>
            </div>
            <iframe id="website-iframe" style="
              flex: 1 !important;
              width: 100% !important;
              border: none !important;
              background: #ffffff !important;
            "></iframe>
          </div>
        </div>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(container);
    sidepanelContainer = container;
    
    // Add hover effects
    const style = document.createElement('style');
    style.textContent = `
      #clean-browsing-sidepanel-overlay .icon-btn:hover {
        background: rgba(255, 255, 255, 0.2) !important;
        transform: translateY(-1px) !important;
      }
      #clean-browsing-sidepanel-overlay .sidepanel-resize-handle:hover {
        background: rgba(255, 255, 255, 0.2) !important;
      }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Clean-Browsing: Container created');
  }
  
  function initializeSidepanelManager() {
    console.log('⚙️ Clean-Browsing: Initializing manager...');
    
    // Simple split view manager
    sidepanelManager = {
      isOpen: false,
      sidepanelWidth: 400,
      minSidepanelWidth: 300,
      maxSidepanelWidth: 800,
      
      open() {
        console.log('📂 Clean-Browsing: Opening sidepanel');
        this.isOpen = true;
        this.updateLayout();
      },
      
      close() {
        console.log('📁 Clean-Browsing: Closing sidepanel');
        this.isOpen = false;
        this.updateLayout();
      },
      
      toggle() {
        if (this.isOpen) {
          this.close();
        } else {
          this.open();
        }
      },
      
      updateLayout() {
        const container = sidepanelContainer;
        const sidepanelDiv = container.querySelector('.sidepanel-container');
        
        if (this.isOpen) {
          container.style.width = this.sidepanelWidth + 'px';
          sidepanelDiv.style.opacity = '1';
        } else {
          container.style.width = '0';
          sidepanelDiv.style.opacity = '0';
        }
      }
    };
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('✅ Clean-Browsing: Manager initialized');
  }
  
  function setupEventListeners() {
    const closeBtn = sidepanelContainer.querySelector('#sidepanel-close-btn');
    const settingsBtn = sidepanelContainer.querySelector('#sidepanel-settings-btn');
    const backBtn = sidepanelContainer.querySelector('#back-to-list');
    const openInTabBtn = sidepanelContainer.querySelector('#open-in-tab');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        console.log('🔄 Clean-Browsing: Close button clicked');
        sidepanelManager.close();
      });
    }
    
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        console.log('⚙️ Clean-Browsing: Settings button clicked');
        showMessage('Settings functionality coming soon!');
      });
    }
    
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        console.log('⬅️ Clean-Browsing: Back button clicked');
        backToList();
      });
    }
    
    if (openInTabBtn) {
      openInTabBtn.addEventListener('click', () => {
        console.log('↗️ Clean-Browsing: Open in tab clicked');
        const iframe = sidepanelContainer.querySelector('#website-iframe');
        if (iframe && iframe.src) {
          window.open(iframe.src, '_blank');
        }
      });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        console.log('⌨️ Clean-Browsing: Alt+S pressed');
        sidepanelManager.toggle();
      }
      if (e.key === 'Escape' && sidepanelManager.isOpen) {
        console.log('⌨️ Clean-Browsing: Escape pressed');
        sidepanelManager.close();
      }
    });
  }
  
  function renderWebsiteList() {
    console.log('📝 Clean-Browsing: Rendering website list...');
    
    const websiteList = sidepanelContainer.querySelector('#website-list');
    if (!websiteList) {
      console.error('❌ Clean-Browsing: Website list container not found');
      return;
    }
    
    websiteList.innerHTML = '';
    
    if (!sidebarSettings.sidebarWebsites.length) {
      websiteList.innerHTML = `
        <div style="
          text-align: center !important;
          padding: 20px !important;
          color: rgba(255, 255, 255, 0.7) !important;
          font-size: 14px !important;
        ">
          <p>No websites added yet</p>
          <p style="font-size: 12px !important; margin-top: 10px !important;">Click the settings icon to add websites</p>
        </div>
      `;
      return;
    }
    
    // Sort websites by position
    const sortedWebsites = [...sidebarSettings.sidebarWebsites].sort((a, b) => a.position - b.position);
    
    sortedWebsites.forEach(website => {
      const websiteItem = createWebsiteItem(website);
      websiteList.appendChild(websiteItem);
    });
    
    console.log('✅ Clean-Browsing: Website list rendered');
  }
  
  function createWebsiteItem(website) {
    const item = document.createElement('div');
    item.className = 'website-item';
    item.style.cssText = `
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      padding: 10px 12px !important;
      background: rgba(255, 255, 255, 0.1) !important;
      backdrop-filter: blur(10px) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      border-radius: 8px !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
      min-height: 44px !important;
      margin-bottom: 6px !important;
    `;
    
    const icon = getWebsiteIcon(website);
    const showUrls = sidebarSettings.sidebarBehavior.showUrls;
    
    item.innerHTML = `
      ${icon}
      <div style="
        flex: 1 !important;
        min-width: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 2px !important;
      ">
        <div style="
          font-weight: 500 !important;
          font-size: 13px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        ">${website.name}</div>
        ${showUrls ? `<div style="
          font-size: 11px !important;
          color: rgba(255, 255, 255, 0.7) !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        ">${website.url}</div>` : ''}
      </div>
    `;
    
    item.addEventListener('click', () => openWebsite(website));
    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(255, 255, 255, 0.2)';
      item.style.transform = 'translateX(2px)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = 'rgba(255, 255, 255, 0.1)';
      item.style.transform = 'translateX(0)';
    });
    
    return item;
  }
  
  function getWebsiteIcon(website) {
    if (website.iconType === 'none') {
      return '';
    } else if (website.iconType === 'favicon' && website.favicon) {
      return `<div style="
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 20px !important;
        height: 20px !important;
        flex-shrink: 0 !important;
      ">
        <img src="${website.favicon}" alt="" style="
          width: 16px !important;
          height: 16px !important;
          object-fit: contain !important;
        " onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <span style="
          font-size: 16px !important;
          display: none !important;
          align-items: center !important;
          justify-content: center !important;
          width: 20px !important;
          height: 20px !important;
        ">${website.icon || '🌐'}</span>
      </div>`;
    } else if (website.iconType === 'emoji' || !website.iconType) {
      return `<span style="
        font-size: 16px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 20px !important;
        height: 20px !important;
      ">${website.icon || '🌐'}</span>`;
    }
    return '';
  }
  
  function openWebsite(website) {
    console.log('🌐 Clean-Browsing: Opening website:', website.name);
    
    if (website.openMode === 'iframe') {
      openInIframe(website);
    } else {
      // Open in new tab/window
      window.open(website.url, '_blank');
      if (sidebarSettings.sidebarBehavior.autoClose) {
        sidepanelManager.close();
      }
    }
  }
  
  function openInIframe(website) {
    const websiteList = sidepanelContainer.querySelector('#website-list');
    const iframeContainer = sidepanelContainer.querySelector('#iframe-container');
    const iframe = sidepanelContainer.querySelector('#website-iframe');
    const iframeTitle = sidepanelContainer.querySelector('#iframe-title');
    const iframeUrl = sidepanelContainer.querySelector('#iframe-current-url');
    
    // Hide website list, show iframe
    websiteList.style.display = 'none';
    iframeContainer.style.display = 'flex';
    
    // Set title and URL
    iframeTitle.textContent = website.name;
    iframeUrl.textContent = website.url;
    
    // Handle iframe errors
    iframe.onerror = () => {
      console.log('❌ Clean-Browsing: Iframe error for:', website.name);
      showIframeError(website);
    };
    
    iframe.onload = () => {
      console.log('✅ Clean-Browsing: Iframe loaded:', website.name);
    };
    
    // Set a timeout for slow sites
    setTimeout(() => {
      if (iframe.src === website.url) {
        console.log('⏰ Clean-Browsing: Iframe timeout for:', website.name);
        showIframeError(website);
      }
    }, 10000);
    
    // Load the URL
    iframe.src = website.url;
  }
  
  function backToList() {
    const websiteList = sidepanelContainer.querySelector('#website-list');
    const iframeContainer = sidepanelContainer.querySelector('#iframe-container');
    const iframe = sidepanelContainer.querySelector('#website-iframe');
    
    // Clear iframe
    iframe.src = 'about:blank';
    
    // Show website list, hide iframe
    iframeContainer.style.display = 'none';
    websiteList.style.display = 'flex';
  }
  
  function showIframeError(website) {
    const iframeContainer = sidepanelContainer.querySelector('#iframe-container');
    
    iframeContainer.innerHTML = `
      <div style="
        flex: 1 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 20px !important;
        background: rgba(0, 0, 0, 0.1) !important;
      ">
        <div style="
          text-align: center !important;
          max-width: 300px !important;
          padding: 20px !important;
          background: rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          backdrop-filter: blur(10px) !important;
        ">
          <h3 style="
            color: #ffffff !important;
            margin: 0 0 10px 0 !important;
            font-size: 16px !important;
            font-weight: 600 !important;
          ">Cannot load ${website.name}</h3>
          <p style="
            color: rgba(255, 255, 255, 0.7) !important;
            margin: 0 0 20px 0 !important;
            font-size: 14px !important;
            line-height: 1.4 !important;
          ">This site cannot be loaded in an iframe.</p>
          <div style="
            display: flex !important;
            gap: 10px !important;
            justify-content: center !important;
            flex-wrap: wrap !important;
          ">
            <button onclick="window.open('${website.url}', '_blank')" style="
              background: #6c63ff !important;
              color: #ffffff !important;
              border: none !important;
              padding: 10px 16px !important;
              border-radius: 6px !important;
              font-weight: 500 !important;
              cursor: pointer !important;
              transition: all 0.2s ease !important;
              font-size: 14px !important;
            ">Open in New Tab</button>
            <button onclick="window.embeddedSidepanel?.backToList()" style="
              background: rgba(255, 255, 255, 0.1) !important;
              border: 1px solid rgba(255, 255, 255, 0.2) !important;
              color: #ffffff !important;
              padding: 4px 8px !important;
              border-radius: 6px !important;
              cursor: pointer !important;
              font-size: 14px !important;
              min-width: 24px !important;
              height: 24px !important;
            ">Back to List</button>
          </div>
        </div>
      </div>
    `;
  }
  
  function showMessage(message) {
    console.log('💬 Clean-Browsing:', message);
    
    // Simple toast message
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      background: rgba(0, 0, 0, 0.8) !important;
      color: white !important;
      padding: 10px 20px !important;
      border-radius: 6px !important;
      z-index: 2147483648 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      opacity: 0 !important;
      transition: opacity 0.3s ease !important;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Fade in
    setTimeout(() => toast.style.opacity = '1', 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }
  
  function showErrorMessage(message) {
    console.error('❌ Clean-Browsing:', message);
    showMessage('Error: ' + message);
  }
  
  // Expose backToList for error handlers
  window.embeddedSidepanel = { backToList };
  
  console.log('✅ Clean-Browsing: Sidepanel injector ready');
  
})();