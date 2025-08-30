// Robust sidepanel injector with Shadow DOM and viewport wrapper system
// Uses advanced CSS isolation and unified resize mechanism across all websites
// NO external script dependencies - everything is bundled here

(function() {
  'use strict';
  
  console.log('🚀 Clean-Browsing: Advanced sidepanel injector loading...');
  
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
  let viewportWrapper = null;
  let shadowRoot = null;
  let sidepanelContainer = null;
  let sidepanelManager = null;
  let sidebarSettings = null;
  let originalViewportMeta = null;
  
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
      
      // Create viewport wrapper for smooth content shifting
      createViewportWrapper();
      
      let shadowHost;
      try {
        // Try Shadow DOM approach first
        shadowHost = createShadowDOMSidepanel();
        console.log('✅ Clean-Browsing: Using Shadow DOM approach');
      } catch (shadowError) {
        console.warn('⚠️ Clean-Browsing: Shadow DOM failed, falling back to simple overlay:', shadowError);
        shadowHost = createFallbackSidepanel();
      }
      
      // Initialize functionality
      initializeSidepanelManager();
      
      // Initialize manager with shadow host
      if (shadowHost && sidepanelManager) {
        sidepanelManager.init(shadowHost);
      }
      
      // Render website list
      try {
        renderWebsiteList();
      } catch (renderError) {
        console.error('❌ Clean-Browsing: Website list rendering failed:', renderError);
        showErrorMessage('Website list rendering failed');
      }
      
      // Open the panel with delay and error handling
      setTimeout(() => {
        try {
          if (sidepanelManager) {
            sidepanelManager.open();
            console.log('✅ Clean-Browsing: Sidepanel opened');
          }
        } catch (openError) {
          console.error('❌ Clean-Browsing: Failed to open sidepanel:', openError);
          showErrorMessage('Failed to open sidepanel');
        }
      }, 100);
      
      isInjected = true;
      console.log('✅ Clean-Browsing: Injection completed successfully');
      
    } catch (error) {
      console.error('❌ Clean-Browsing: Critical injection failure:', error);
      
      // Attempt cleanup on failure
      try {
        cleanupSidepanel();
      } catch (cleanupError) {
        console.error('❌ Clean-Browsing: Cleanup also failed:', cleanupError);
      }
      
      showErrorMessage('Failed to initialize sidepanel: ' + error.message);
      isInjected = false;
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
  
  function createViewportWrapper() {
    console.log('📦 Clean-Browsing: Creating viewport wrapper system...');
    
    try {
      // Avoid creating multiple wrappers
      if (document.getElementById('clean-browsing-viewport-wrapper')) {
        console.log('⚠️ Clean-Browsing: Viewport wrapper already exists');
        viewportWrapper = document.getElementById('clean-browsing-viewport-wrapper');
        return;
      }
      
      // Store original viewport meta for restoration
      const existingViewport = document.querySelector('meta[name="viewport"]');
      if (existingViewport) {
        originalViewportMeta = existingViewport.cloneNode(true);
      }
      
      // Create viewport wrapper that will contain the entire page
      viewportWrapper = document.createElement('div');
      viewportWrapper.id = 'clean-browsing-viewport-wrapper';
      viewportWrapper.style.cssText = `
        position: relative !important;
        width: 100vw !important;
        min-height: 100vh !important;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        transform: translateX(0) !important;
        overflow: hidden !important;
        z-index: 0 !important;
      `;
      
      // Gracefully move body children into the wrapper
      const bodyChildren = Array.from(document.body.children);
      bodyChildren.forEach(child => {
        try {
          if (child.id !== 'clean-browsing-viewport-wrapper' && 
              !child.id.startsWith('clean-browsing-')) {
            viewportWrapper.appendChild(child);
          }
        } catch (error) {
          console.warn('⚠️ Clean-Browsing: Could not move child element:', child, error);
        }
      });
      
      // Add wrapper to body
      document.body.appendChild(viewportWrapper);
      
      // Style the body for proper containment with fallbacks
      const bodyStyles = `
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        position: relative !important;
      `;
      
      // Try to apply styles safely
      try {
        document.body.style.cssText += bodyStyles;
      } catch (error) {
        console.warn('⚠️ Clean-Browsing: Could not apply body styles directly, trying individual properties');
        document.body.style.setProperty('margin', '0', 'important');
        document.body.style.setProperty('padding', '0', 'important');
        document.body.style.setProperty('overflow', 'hidden', 'important');
        document.body.style.setProperty('position', 'relative', 'important');
      }
      
      console.log('✅ Clean-Browsing: Viewport wrapper created');
      
    } catch (error) {
      console.error('❌ Clean-Browsing: Failed to create viewport wrapper:', error);
      throw new Error('Viewport wrapper creation failed: ' + error.message);
    }
  }
  
  function removeViewportWrapper() {
    console.log('🔄 Clean-Browsing: Removing viewport wrapper...');
    
    if (viewportWrapper) {
      // Move children back to body
      const wrapperChildren = Array.from(viewportWrapper.children);
      wrapperChildren.forEach(child => {
        document.body.appendChild(child);
      });
      
      // Remove wrapper
      viewportWrapper.remove();
      viewportWrapper = null;
      
      // Restore original body styles
      document.body.style.cssText = '';
      
      // Restore original viewport meta
      if (originalViewportMeta) {
        const currentViewport = document.querySelector('meta[name="viewport"]');
        if (currentViewport) {
          currentViewport.replaceWith(originalViewportMeta.cloneNode(true));
        }
      }
    }
  }
  
  function createShadowDOMSidepanel() {
    console.log('🏗️ Clean-Browsing: Creating Shadow DOM sidepanel...');
    
    try {
      // Check for existing shadow host
      const existing = document.getElementById('clean-browsing-shadow-host');
      if (existing) {
        console.log('⚠️ Clean-Browsing: Shadow host already exists, reusing');
        return existing;
      }
      
      // Create host element for Shadow DOM
      const shadowHost = document.createElement('div');
      shadowHost.id = 'clean-browsing-shadow-host';
      
      // Apply styles with error handling
      try {
        shadowHost.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          right: 0 !important;
          width: 400px !important;
          height: 100vh !important;
          z-index: 2147483647 !important;
          pointer-events: auto !important;
          transform: translateX(100%) !important;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          overflow: hidden !important;
        `;
      } catch (styleError) {
        console.warn('⚠️ Clean-Browsing: CSS application failed, trying individual properties');
        shadowHost.style.setProperty('position', 'fixed', 'important');
        shadowHost.style.setProperty('top', '0', 'important');
        shadowHost.style.setProperty('right', '0', 'important');
        shadowHost.style.setProperty('width', '400px', 'important');
        shadowHost.style.setProperty('height', '100vh', 'important');
        shadowHost.style.setProperty('z-index', '2147483647', 'important');
        shadowHost.style.setProperty('transform', 'translateX(100%)', 'important');
      }
      
      // Create Shadow DOM for complete style isolation
      try {
        shadowRoot = shadowHost.attachShadow({ mode: 'closed' });
      } catch (shadowError) {
        console.error('❌ Clean-Browsing: Shadow DOM not supported:', shadowError);
        throw new Error('Shadow DOM creation failed - browser may not support Shadow DOM');
      }
      
      // Inject complete CSS reset and sidepanel styles into Shadow DOM
      try {
        const shadowStyles = document.createElement('style');
        shadowStyles.textContent = getShadowDOMStyles();
        shadowRoot.appendChild(shadowStyles);
      } catch (stylesError) {
        console.error('❌ Clean-Browsing: Failed to inject Shadow DOM styles:', stylesError);
        throw new Error('Shadow DOM styles injection failed');
      }
      
      // Create the sidepanel structure inside Shadow DOM
      try {
        sidepanelContainer = document.createElement('div');
        sidepanelContainer.className = 'sidepanel-container';
        sidepanelContainer.innerHTML = getSidepanelHTML();
        
        shadowRoot.appendChild(sidepanelContainer);
      } catch (htmlError) {
        console.error('❌ Clean-Browsing: Failed to create sidepanel HTML structure:', htmlError);
        throw new Error('Sidepanel HTML structure creation failed');
      }
      
      // Add to document body
      try {
        document.body.appendChild(shadowHost);
      } catch (appendError) {
        console.error('❌ Clean-Browsing: Failed to append shadow host to body:', appendError);
        throw new Error('Shadow host append failed');
      }
      
      console.log('✅ Clean-Browsing: Shadow DOM sidepanel created');
      return shadowHost;
      
    } catch (error) {
      console.error('❌ Clean-Browsing: Shadow DOM sidepanel creation failed:', error);
      throw new Error('Shadow DOM sidepanel creation failed: ' + error.message);
    }
  }
    
  function getShadowDOMStyles() {
    return `
      /* CSS Reset for Shadow DOM */
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      /* Sidepanel Container */
      .sidepanel-container {
        display: flex;
        flex-direction: row;
        height: 100vh;
        width: 100%;
        background: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        color: #ffffff;
      }
      
      /* Resize Handle */
      .sidepanel-resize-handle {
        width: 6px;
        background: rgba(255, 255, 255, 0.1);
        cursor: ew-resize;
        border-right: 1px solid rgba(255, 255, 255, 0.2);
        transition: background-color 0.2s ease;
        flex-shrink: 0;
        position: relative;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .sidepanel-resize-handle:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .resize-indicator {
        width: 3px;
        height: 30px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
      }
      
      /* Sidepanel Content */
      .sidepanel-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100vh;
        min-width: 280px;
      }
      
      /* Header */
      .sidepanel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.4);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
        gap: 8px;
      }
      
      .header-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        min-width: 0;
        flex: 1;
      }
      
      .header-title span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      /* Buttons */
      .icon-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #ffffff;
        padding: 4px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
        flex-shrink: 0;
      }
      
      .icon-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }
      
      /* Website List */
      .website-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .website-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        min-height: 44px;
        margin-bottom: 6px;
      }
      
      .website-item:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateX(2px);
      }
      
      /* Iframe Container */
      .iframe-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: rgba(0, 0, 0, 0.1);
      }
      
      .iframe-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.4);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        min-height: 40px;
      }
      
      .iframe-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      
      #iframe-title {
        font-weight: 500;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      #iframe-current-url {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.7);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
        transition: color 0.2s ease;
      }
      
      #iframe-current-url:hover {
        color: rgba(255, 255, 255, 0.9);
      }
      
      #website-iframe {
        flex: 1;
        width: 100%;
        border: none;
        background: #ffffff;
      }
      
      /* Settings Modal */
      .sidepanel-settings-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
      }
      
      .modal-content {
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        width: 90vw;
        max-width: 500px;
        max-height: 80vh;
        overflow: hidden;
        color: #ffffff;
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .modal-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .settings-tabs {
        display: flex;
        background: rgba(0, 0, 0, 0.3);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .tab-btn {
        flex: 1;
        padding: 12px 16px;
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        font-size: 14px;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
      }
      
      .tab-btn.active {
        color: #ffffff;
        border-bottom: 2px solid #6c63ff;
      }
      
      .tab-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }
      
      .modal-body {
        padding: 20px;
        max-height: 400px;
        overflow-y: auto;
      }
      
      .tab-content {
        display: block;
      }
      
      .form-group {
        margin-bottom: 16px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
      }
      
      input[type="text"], input[type="url"] {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        font-size: 14px;
        box-sizing: border-box;
      }
      
      input[type="text"]:focus, input[type="url"]:focus {
        border-color: #6c63ff;
        outline: none;
        box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.2);
      }
      
      .primary-btn {
        background: #6c63ff;
        color: #ffffff;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        font-size: 14px;
        width: 100%;
        transition: all 0.2s ease;
      }
      
      .primary-btn:hover {
        background: #5a52d5;
        transform: translateY(-1px);
      }
      
      /* Utility classes */
      .hidden {
        display: none !important;
      }
      
      /* Scrollbar */
      .website-list::-webkit-scrollbar {
        width: 6px;
      }
      
      .website-list::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
      }
      
      .website-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
      }
      
      .website-list::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
      }
    `;
  }
  
  function getSidepanelHTML() {
    return `
      <div class="sidepanel-resize-handle" title="Drag to resize">
        <div class="resize-indicator"></div>
      </div>
      
      <div class="sidepanel-content">
        <!-- Header -->
        <div class="sidepanel-header">
          <div class="header-title">
            <span>Quick Access</span>
          </div>
          <button id="sidepanel-settings-btn" class="icon-btn" title="Settings">⚙️</button>
          <button id="sidepanel-close-btn" class="icon-btn" title="Close Panel">✕</button>
        </div>

        <!-- Website List -->
        <div id="website-list" class="website-list">
          <!-- Websites will be dynamically added here -->
        </div>

        <!-- Iframe Container -->
        <div id="iframe-container" class="iframe-container hidden">
          <div class="iframe-header">
            <button id="back-to-list" class="icon-btn" title="Back to list">←</button>
            <div class="iframe-info">
              <span id="iframe-title"></span>
              <span id="iframe-current-url">Loading...</span>
            </div>
            <button id="open-in-tab" class="icon-btn" title="Open in new tab">↗</button>
          </div>
          <iframe id="website-iframe"></iframe>
        </div>
        
        <!-- Settings Modal -->
        <div id="sidepanel-settings-modal" class="sidepanel-settings-modal hidden">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Sidepanel Settings</h2>
              <button id="close-sidepanel-settings" class="icon-btn" title="Close">✕</button>
            </div>
            
            <div class="settings-tabs">
              <button data-tab="add-website" class="tab-btn active">Add Website</button>
              <button data-tab="manage-websites" class="tab-btn">Manage</button>
              <button data-tab="behavior" class="tab-btn">Behavior</button>
            </div>
            
            <div class="modal-body">
              <div id="add-website-tab" class="tab-content">
                <div class="form-group">
                  <label>Name:</label>
                  <input type="text" id="website-name" placeholder="e.g., ChatGPT">
                </div>
                <div class="form-group">
                  <label>URL:</label>
                  <input type="url" id="website-url" placeholder="https://example.com">
                </div>
                <div class="form-group">
                  <label>Icon:</label>
                  <input type="text" id="website-icon" placeholder="🌐">
                </div>
                <button id="add-website-btn" class="primary-btn">Add Website</button>
              </div>
              
              <div id="manage-websites-tab" class="tab-content hidden">
                <div id="manage-websites-list"></div>
              </div>
              
              <div id="behavior-tab" class="tab-content hidden">
                <p>Behavior settings coming soon!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  function createFallbackSidepanel() {
    console.log('🔧 Clean-Browsing: Creating fallback sidepanel (no Shadow DOM)...');
    
    try {
      // Create a simple overlay without Shadow DOM
      const fallbackHost = document.createElement('div');
      fallbackHost.id = 'clean-browsing-fallback-host';
      
      // Apply inline styles for maximum compatibility
      fallbackHost.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        right: 0 !important;
        width: 400px !important;
        height: 100vh !important;
        z-index: 2147483647 !important;
        pointer-events: auto !important;
        transform: translateX(100%) !important;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        overflow: hidden !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif !important;
      `;
      
      // Create the sidepanel structure directly (no Shadow DOM)
      sidepanelContainer = document.createElement('div');
      sidepanelContainer.className = 'sidepanel-container';
      sidepanelContainer.innerHTML = getSidepanelHTML();
      
      // Apply styles directly to container
      sidepanelContainer.style.cssText = `
        display: flex !important;
        flex-direction: row !important;
        height: 100vh !important;
        width: 100% !important;
        background: rgba(0, 0, 0, 0.2) !important;
        backdrop-filter: blur(10px) !important;
        border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
        color: #ffffff !important;
      `;
      
      fallbackHost.appendChild(sidepanelContainer);
      document.body.appendChild(fallbackHost);
      
      console.log('✅ Clean-Browsing: Fallback sidepanel created');
      return fallbackHost;
      
    } catch (error) {
      console.error('❌ Clean-Browsing: Fallback sidepanel creation also failed:', error);
      throw new Error('Both Shadow DOM and fallback approaches failed');
    }
  }
  
  function cleanupSidepanel() {
    console.log('🧹 Clean-Browsing: Cleaning up sidepanel...');
    
    try {
      // Remove Shadow DOM host
      const shadowHost = document.getElementById('clean-browsing-shadow-host');
      if (shadowHost) {
        shadowHost.remove();
      }
      
      // Remove fallback host
      const fallbackHost = document.getElementById('clean-browsing-fallback-host');
      if (fallbackHost) {
        fallbackHost.remove();
      }
      
      // Remove viewport wrapper
      removeViewportWrapper();
      
      // Reset variables
      shadowRoot = null;
      sidepanelContainer = null;
      sidepanelManager = null;
      isInjected = false;
      
      console.log('✅ Clean-Browsing: Cleanup completed');
      
    } catch (error) {
      console.error('❌ Clean-Browsing: Cleanup failed:', error);
    }
  }
  
  // Enhanced helper functions to query elements in both Shadow DOM and fallback modes
  function querySelector(selector) {
    try {
      // Try Shadow DOM first (most secure and isolated)
      if (shadowRoot && typeof shadowRoot.querySelector === 'function') {
        const element = shadowRoot.querySelector(selector);
        if (element) {
          console.debug(`Clean-Browsing: Found ${selector} in Shadow DOM`);
          return element;
        }
      }
      
      // Try fallback container (no Shadow DOM support)
      if (sidepanelContainer && typeof sidepanelContainer.querySelector === 'function') {
        const element = sidepanelContainer.querySelector(selector);
        if (element) {
          console.debug(`Clean-Browsing: Found ${selector} in fallback container`);
          return element;
        }
      }
      
      // Try direct document search for global elements (least preferred)
      if (selector.startsWith('#clean-browsing-')) {
        const element = document.querySelector(selector);
        if (element) {
          console.debug(`Clean-Browsing: Found ${selector} in document`);
          return element;
        }
      }
      
      console.warn(`Clean-Browsing: Element ${selector} not found in any scope`);
      return null;
      
    } catch (error) {
      console.error(`Clean-Browsing: Error querying ${selector}:`, error);
      return null;
    }
  }
  
  function querySelectorAll(selector) {
    try {
      let elements = [];
      
      // Try Shadow DOM first
      if (shadowRoot && typeof shadowRoot.querySelectorAll === 'function') {
        const shadowElements = shadowRoot.querySelectorAll(selector);
        if (shadowElements.length > 0) {
          console.debug(`Clean-Browsing: Found ${shadowElements.length} ${selector} elements in Shadow DOM`);
          return shadowElements;
        }
      }
      
      // Try fallback container
      if (sidepanelContainer && typeof sidepanelContainer.querySelectorAll === 'function') {
        const containerElements = sidepanelContainer.querySelectorAll(selector);
        if (containerElements.length > 0) {
          console.debug(`Clean-Browsing: Found ${containerElements.length} ${selector} elements in fallback container`);
          return containerElements;
        }
      }
      
      // Try document for global elements
      if (selector.startsWith('#clean-browsing-') || selector.startsWith('.clean-browsing-')) {
        const documentElements = document.querySelectorAll(selector);
        if (documentElements.length > 0) {
          console.debug(`Clean-Browsing: Found ${documentElements.length} ${selector} elements in document`);
          return documentElements;
        }
      }
      
      console.warn(`Clean-Browsing: No ${selector} elements found in any scope`);
      return [];
      
    } catch (error) {
      console.error(`Clean-Browsing: Error querying all ${selector}:`, error);
      return [];
    }
  }
  
  // Helper to check if we have a valid sidepanel container
  function hasSidepanelContainer() {
    return !!(shadowRoot || sidepanelContainer);
  }
  
  // Helper to get the appropriate root for event listeners
  function getSidepanelRoot() {
    if (shadowRoot) return shadowRoot;
    if (sidepanelContainer) return sidepanelContainer;
    return document;
  }
  
  function createSettingsModal() {
    console.log('🔧 Clean-Browsing: Settings modal is now part of Shadow DOM');
    // Settings modal is now embedded in the Shadow DOM structure
    // No need for separate creation
  }
  
  function initializeSidepanelManager() {
    console.log('⚙️ Clean-Browsing: Initializing advanced manager...');
    
    // Advanced unified manager with viewport wrapper
    sidepanelManager = {
      isOpen: false,
      sidepanelWidth: 400,
      minSidepanelWidth: 300,
      maxSidepanelWidth: 800,
      shadowHost: null,
      
      init(shadowHostElement) {
        this.shadowHost = shadowHostElement;
      },
      
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
        if (this.isOpen) {
          console.log(`📏 Clean-Browsing: Opening layout with width ${this.sidepanelWidth}px`);
          
          // Use transform-based approach on viewport wrapper
          if (viewportWrapper) {
            viewportWrapper.style.transform = `translateX(-${this.sidepanelWidth}px)`;
            viewportWrapper.style.width = `calc(100vw + ${this.sidepanelWidth}px)`;
          }
          
          // Update shadow host and show it
          if (this.shadowHost) {
            this.shadowHost.style.width = `${this.sidepanelWidth}px`;
            this.shadowHost.style.transform = 'translateX(0)';
          }
          
          // Trigger resize event to help websites adapt
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 100);
          
          console.log('✅ Clean-Browsing: Sidepanel opened with transform approach');
        } else {
          console.log('📏 Clean-Browsing: Closing layout');
          
          // Restore viewport wrapper
          if (viewportWrapper) {
            viewportWrapper.style.transform = 'translateX(0)';
            viewportWrapper.style.width = '100vw';
          }
          
          // Hide shadow host by sliding it out
          if (this.shadowHost) {
            this.shadowHost.style.transform = 'translateX(100%)';
          }
          
          // Trigger resize event to help websites adapt back
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 100);
          
          console.log('✅ Clean-Browsing: Sidepanel closed, viewport restored');
        }
      }
    };
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up resize handlers
    setupResizeHandlers();
    
    console.log('✅ Clean-Browsing: Manager initialized');
    
    function setupResizeHandlers() {
      console.log('🔧 Clean-Browsing: Setting up resize handlers...');
    
      const handle = querySelector('.sidepanel-resize-handle');
      if (!handle) {
        console.error('❌ Clean-Browsing: Resize handle not found!');
        return;
      }
      
      let isResizing = false;
      let startX = 0;
      let startWidth = 0;
      
      const handleMouseDown = (e) => {
        if (!sidepanelManager.isOpen) return;
        
        console.log('🔄 Clean-Browsing: Starting resize...');
        isResizing = true;
        startX = e.clientX;
        startWidth = sidepanelManager.sidepanelWidth;
        
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        
        e.preventDefault();
      };
      
      const handleMouseMove = (e) => {
        if (!isResizing) return;
        
        // Calculate delta (negative because dragging from right side)
        const deltaX = startX - e.clientX;
        const newWidth = Math.max(
          sidepanelManager.minSidepanelWidth,
          Math.min(sidepanelManager.maxSidepanelWidth, startWidth + deltaX)
        );
        
        sidepanelManager.sidepanelWidth = newWidth;
        sidepanelManager.updateLayout();
      };
      
      const handleMouseUp = () => {
        if (!isResizing) return;
        
        console.log('✅ Clean-Browsing: Resize completed, width:', sidepanelManager.sidepanelWidth);
        isResizing = false;
        
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
      
      // Mouse events
      handle.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Touch events for mobile
      handle.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        handleMouseDown({ clientX: touch.clientX, preventDefault: () => e.preventDefault() });
      });
      
      document.addEventListener('touchmove', (e) => {
        if (isResizing && e.touches.length > 0) {
          const touch = e.touches[0];
          handleMouseMove({ clientX: touch.clientX });
        }
      });
      
      document.addEventListener('touchend', () => {
        if (isResizing) {
          handleMouseUp();
        }
      });
      
      console.log('✅ Clean-Browsing: Resize handlers set up');
    }
  }
  
  function setupEventListeners() {
    const closeBtn = querySelector('#sidepanel-close-btn');
    const settingsBtn = querySelector('#sidepanel-settings-btn');
    const backBtn = querySelector('#back-to-list');
    const openInTabBtn = querySelector('#open-in-tab');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        console.log('🔄 Clean-Browsing: Close button clicked');
        sidepanelManager.close();
      });
    }
    
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        console.log('⚙️ Clean-Browsing: Settings button clicked');
        showSettingsModal();
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
        const iframe = querySelector('#website-iframe');
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
    
    const websiteList = querySelector('#website-list');
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
    const websiteList = querySelector('#website-list');
    const iframeContainer = querySelector('#iframe-container');
    const iframe = querySelector('#website-iframe');
    const iframeTitle = querySelector('#iframe-title');
    const iframeUrl = querySelector('#iframe-current-url');
    
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
    const websiteList = querySelector('#website-list');
    const iframeContainer = querySelector('#iframe-container');
    const iframe = querySelector('#website-iframe');
    
    // Clear iframe
    iframe.src = 'about:blank';
    
    // Show website list, hide iframe
    iframeContainer.style.display = 'none';
    websiteList.style.display = 'flex';
  }
  
  function showIframeError(website) {
    const iframeContainer = querySelector('#iframe-container');
    
    // Create error display without inline handlers
    const errorElement = document.createElement('div');
    errorElement.style.cssText = `
      flex: 1 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px !important;
      background: rgba(0, 0, 0, 0.1) !important;
    `;
    
    errorElement.innerHTML = `
      <div class="error-content" style="
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
        <div class="error-actions" style="
          display: flex !important;
          gap: 10px !important;
          justify-content: center !important;
          flex-wrap: wrap !important;
        ">
          <button class="open-in-tab-btn" data-url="${website.url}" style="
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
          <button class="back-to-list-btn" style="
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
    `;
    
    // Clear container and add error element
    iframeContainer.innerHTML = '';
    iframeContainer.appendChild(errorElement);
    
    // Add proper event listeners
    const openTabBtn = errorElement.querySelector('.open-in-tab-btn');
    const backBtn = errorElement.querySelector('.back-to-list-btn');
    
    if (openTabBtn) {
      openTabBtn.addEventListener('click', () => {
        const url = openTabBtn.getAttribute('data-url');
        if (url) {
          window.open(url, '_blank');
        }
      });
    }
    
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (typeof backToList === 'function') {
          backToList();
        } else if (window.embeddedSidepanel?.backToList) {
          window.embeddedSidepanel.backToList();
        }
      });
    }
  }
  
  function showSettingsModal() {
    console.log('🔧 Clean-Browsing: Showing settings modal');
    const modal = querySelector('#sidepanel-settings-modal');
    if (modal) {
      modal.classList.remove('hidden');
      setupSettingsModalListeners();
    } else {
      console.error('❌ Clean-Browsing: Settings modal not found!');
    }
  }
  
  function hideSettingsModal() {
    console.log('🔧 Clean-Browsing: Hiding settings modal');
    const modal = querySelector('#sidepanel-settings-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }
  
  function setupSettingsModalListeners() {
    const modal = querySelector('#sidepanel-settings-modal');
    if (!modal) return;
    
    // Close button
    const closeBtn = modal.querySelector('#close-sidepanel-settings');
    if (closeBtn) {
      closeBtn.addEventListener('click', hideSettingsModal);
    }
    
    // Tab switching
    const tabBtns = modal.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchSettingsTab(btn.dataset.tab));
    });
    
    // Add website functionality
    const addBtn = modal.querySelector('#add-website-btn');
    if (addBtn) {
      addBtn.addEventListener('click', addWebsite);
    }
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('sidepanel-settings-modal')) {
        hideSettingsModal();
      }
    });
  }
  
  function switchSettingsTab(tabName) {
    const modal = querySelector('#sidepanel-settings-modal');
    if (!modal) return;
    
    // Update tab buttons
    const tabBtns = modal.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Show/hide tab content
    const tabContents = modal.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      if (content.id === `${tabName}-tab`) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    });
  }
  
  async function addWebsite() {
    const modal = querySelector('#sidepanel-settings-modal');
    const nameInput = modal?.querySelector('#website-name');
    const urlInput = modal?.querySelector('#website-url');
    const iconInput = modal?.querySelector('#website-icon');
    
    const name = nameInput?.value.trim();
    const url = urlInput?.value.trim();
    const icon = iconInput?.value.trim();
    
    if (!name || !url) {
      showMessage('Please enter both name and URL');
      return;
    }
    
    const newWebsite = {
      id: Date.now().toString(),
      name: name,
      url: url,
      icon: icon || '🌐',
      favicon: null,
      openMode: 'iframe',
      position: sidebarSettings.sidebarWebsites.length
    };
    
    sidebarSettings.sidebarWebsites.push(newWebsite);
    
    try {
      await chrome.storage.local.set({ sidebarSettings });
      console.log('✅ Website added:', newWebsite);
      
      // Clear form
      if (nameInput) nameInput.value = '';
      if (urlInput) urlInput.value = '';
      if (iconInput) iconInput.value = '';
      
      // Refresh website list
      renderWebsiteList();
      hideSettingsModal();
      
    } catch (error) {
      console.error('❌ Failed to save website:', error);
      showMessage('Failed to save website');
    }
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