// Robust sidepanel injector with Shadow DOM and viewport wrapper system
// Uses advanced CSS isolation and unified resize mechanism across all websites
// Uses unified cross-browser API wrapper

(function () {
  'use strict';

  console.log('🚀 Clean-Browsing: Advanced sidepanel injector loading...');

  const runtime = typeof browser !== 'undefined' && browser.runtime ? browser.runtime : null;

  // Load shared modules
  const defaultSettingsScript = document.createElement('script');
  defaultSettingsScript.src = runtime?.getURL
    ? runtime.getURL('default-settings.js')
    : 'default-settings.js';
  document.head.appendChild(defaultSettingsScript);

  const uiModuleScript = document.createElement('script');
  uiModuleScript.src = runtime?.getURL ? runtime.getURL('sidepanel-ui.js') : 'sidepanel-ui.js';
  document.head.appendChild(uiModuleScript);

  // Create minimal cross-browser wrapper for content script
  const _api = typeof browser !== 'undefined' ? browser : undefined;

  // Minimal ExtensionAPI for content script use
  const ExtensionAPI = {
    storage: {
      async get(keys) {
        if (!_api?.storage?.local?.get) {
          return {};
        }
        return await _api.storage.local.get(keys);
      },
      async set(obj) {
        if (!_api?.storage?.local?.set) {
          return;
        }
        return await _api.storage.local.set(obj);
      },
    },
    runtime: {
      async sendMessage(message) {
        if (!_api?.runtime?.sendMessage) {
          return {};
        }
        return await _api.runtime.sendMessage(message);
      },
      getURL(path) {
        return _api?.runtime?.getURL ? _api.runtime.getURL(path) : path;
      },
      onMessage: {
        addListener(handler) {
          if (_api?.runtime?.onMessage?.addListener) {
            _api.runtime.onMessage.addListener(handler);
          }
        },
      },
    },
  };

  // Only inject on main pages, not iframes
  if (window.top !== window.self) {
    console.log('🔄 Clean-Browsing: Skipping iframe injection');
    return;
  }

  // Don't inject on the new tab page (already has embedded sidepanel)
  const newTabUrl = runtime?.getURL ? runtime.getURL('newtab.html') : null;
  if (newTabUrl && window.location.href.startsWith(newTabUrl)) {
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
  let iframeLoadTimer = null;
  let bodyObserver = null;
  let currentWebsiteUrl = null;
  let currentBackgroundImage = null;

  // Listen for messages from background script
  ExtensionAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
        console.warn(
          '⚠️ Clean-Browsing: Shadow DOM failed, falling back to simple overlay:',
          shadowError
        );
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
        // Apply appearance to panel content if present
        try {
          applyAppearanceToPanel();
        } catch (_) {}
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
      const result = await ExtensionAPI.storage.get(['sidebarSettings']);
      sidebarSettings = result.sidebarSettings || getDefaultSidebarSettings();
      console.log('✅ Clean-Browsing: Settings loaded:', sidebarSettings);
    } catch (error) {
      console.error('❌ Clean-Browsing: Settings load failed:', error);
      sidebarSettings = getDefaultSidebarSettings();
    }
  }

  function getDefaultSidebarSettings() {
    // Use shared settings if available, otherwise fallback
    if (typeof DefaultSettings !== 'undefined' && DefaultSettings.getDefaultSidebarSettings) {
      const settings = DefaultSettings.getDefaultSidebarSettings();
      // Add iconType to websites for compatibility with content script
      settings.sidebarWebsites.forEach((website) => {
        if (!website.iconType) {
          website.iconType = 'favicon';
        }
      });
      return settings;
    }

    // Fallback settings (minimal)
    return {
      sidebarEnabled: true,
      sidebarWebsites: [
        {
          id: 'chatgpt',
          name: 'ChatGPT',
          url: 'https://chatgpt.com',
          icon: '🤖',
          favicon: 'https://chatgpt.com/favicon.ico',
          iconType: 'favicon',
          openMode: 'iframe',
          position: 0,
        },
      ],
      sidebarBehavior: {
        autoClose: false,
        showUrls: true,
        compactMode: false,
      },
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
        /* Allow page to manage vertical scroll; hide only horizontal overflow via body */
        overflow: visible !important;
        box-sizing: border-box !important;
        z-index: 0 !important;
      `;

      // Gracefully move body children into the wrapper
      const bodyChildren = Array.from(document.body.children);
      bodyChildren.forEach((child) => {
        try {
          if (
            child.id !== 'clean-browsing-viewport-wrapper' &&
            !child.id.startsWith('clean-browsing-')
          ) {
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
        /* Keep vertical scrolling semantics intact; only prevent horizontal scroll */
        overflow-x: hidden !important;
        position: relative !important;
      `;

      // Try to apply styles safely
      try {
        document.body.style.cssText += bodyStyles;
      } catch (error) {
        console.warn(
          '⚠️ Clean-Browsing: Could not apply body styles directly, trying individual properties'
        );
        document.body.style.setProperty('margin', '0', 'important');
        document.body.style.setProperty('padding', '0', 'important');
        document.body.style.setProperty('overflow-x', 'hidden', 'important');
        document.body.style.setProperty('position', 'relative', 'important');
      }

      // Also ensure the root element can't introduce horizontal scroll
      try {
        document.documentElement.style.setProperty('overflow-x', 'hidden', 'important');
      } catch (_) {}

      console.log('✅ Clean-Browsing: Viewport wrapper created');

      // Begin observing for new body children so late-injected content is also shifted
      try {
        startBodyObserver();
      } catch (obsErr) {
        console.warn('⚠️ Clean-Browsing: Failed to start body observer:', obsErr);
      }
    } catch (error) {
      console.error('❌ Clean-Browsing: Failed to create viewport wrapper:', error);
      throw new Error('Viewport wrapper creation failed: ' + error.message);
    }
  }

  function removeViewportWrapper() {
    console.log('🔄 Clean-Browsing: Removing viewport wrapper...');

    if (viewportWrapper) {
      // Stop observing body mutations
      stopBodyObserver();

      // Move children back to body
      const wrapperChildren = Array.from(viewportWrapper.children);
      wrapperChildren.forEach((child) => {
        document.body.appendChild(child);
      });

      // Remove wrapper
      viewportWrapper.remove();
      viewportWrapper = null;

      // Restore original body styles
      document.body.style.cssText = '';
      try {
        document.documentElement.style.removeProperty('overflow-x');
      } catch (_) {}

      // Restore original viewport meta
      if (originalViewportMeta) {
        const currentViewport = document.querySelector('meta[name="viewport"]');
        if (currentViewport) {
          currentViewport.replaceWith(originalViewportMeta.cloneNode(true));
        }
      }
    }
  }

  // Observe direct children of body so anything appended after injection also shifts with the page
  function startBodyObserver() {
    if (!document.body || !viewportWrapper) return;
    if (bodyObserver) return; // already observing

    bodyObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== 'childList') continue;
        mutation.addedNodes.forEach((node) => {
          try {
            // Only handle element nodes
            if (!(node instanceof Element)) return;

            // Skip our own infra elements
            const id = node.id || '';
            if (
              id === 'clean-browsing-viewport-wrapper' ||
              id === 'clean-browsing-shadow-host' ||
              id === 'clean-browsing-fallback-host' ||
              id.startsWith('clean-browsing-')
            ) {
              return;
            }

            // If it's already inside the wrapper, skip
            if (node.parentElement === viewportWrapper) return;

            // Move the node into the wrapper so transforms apply uniformly
            // Temporarily disconnect to avoid feedback loops
            bodyObserver.disconnect();
            viewportWrapper.appendChild(node);
            bodyObserver.observe(document.body, { childList: true });
          } catch (e) {
            console.warn(
              '⚠️ Clean-Browsing: Failed to migrate new body child into wrapper:',
              node,
              e
            );
          }
        });
      }
    });

    bodyObserver.observe(document.body, { childList: true });
    console.log('✅ Clean-Browsing: Body observer started');
  }

  function stopBodyObserver() {
    if (bodyObserver) {
      try {
        bodyObserver.disconnect();
      } catch (_) {}
      bodyObserver = null;
      console.log('✅ Clean-Browsing: Body observer stopped');
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
        shadowStyles.textContent =
          typeof SidepanelUI !== 'undefined' && SidepanelUI.getShadowDOMStyles
            ? SidepanelUI.getShadowDOMStyles()
            : '/* Shadow DOM styles not loaded */';
        shadowRoot.appendChild(shadowStyles);

        // Also bring in existing sidepanel.css for exact look & feel
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = ExtensionAPI.runtime.getURL('sidepanel.css');
        shadowRoot.appendChild(link);
      } catch (stylesError) {
        console.error('❌ Clean-Browsing: Failed to inject Shadow DOM styles:', stylesError);
        throw new Error('Shadow DOM styles injection failed');
      }

      // Create the sidepanel structure inside Shadow DOM
      try {
        sidepanelContainer = document.createElement('div');
        sidepanelContainer.className = 'sidepanel-container';
        sidepanelContainer.innerHTML =
          typeof SidepanelUI !== 'undefined' && SidepanelUI.getSidepanelHTML
            ? SidepanelUI.getSidepanelHTML()
            : '<div>Sidepanel UI module not loaded</div>';

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
        padding: 8px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        min-height: 36px;
        flex-shrink: 0;
        line-height: 1;
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
      
      /* Settings Modal (confined to sidepanel host) */
      .settings-modal {
        position: absolute; /* relative to shadow host */
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
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
        width: calc(100% - 24px); /* full panel width with margin */
        max-width: none;
        max-height: calc(100% - 24px);
        overflow: auto;
        color: #ffffff;
        margin: 12px;
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
        padding: 14px 16px;
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        font-size: 14px;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        line-height: 1.2;
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
      .form-group.checkbox-group label { cursor: pointer; }
      .icon-type-selector .icon-type-option input { accent-color: #6c63ff; }
      .bg-options input[type="text"] {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: #fff;
        border-radius: 6px;
        padding: 6px 8px;
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
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        font-size: 14px;
        width: 100%;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        line-height: 1.2;
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
            <div class="iframe-navigation">
              <button id="nav-back" class="nav-btn" title="Back">⬅</button>
              <button id="nav-refresh" class="nav-btn" title="Refresh">↻</button>
            </div>
            <button id="open-in-tab" class="icon-btn" title="Open in new tab">↗</button>
          </div>
          <iframe id="website-iframe"></iframe>
        </div>
        
        <!-- Settings Modal -->
        <div id="settings-modal" class="settings-modal hidden">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Sidepanel Settings</h2>
              <button id="close-settings" class="icon-btn" title="Close">✕</button>
            </div>
          
          <div class="settings-tabs">
            <button data-tab="add-website" class="tab-btn active">Add Website</button>
            <button data-tab="manage-websites" class="tab-btn">Manage</button>
            <button data-tab="behavior" class="tab-btn">Behavior</button>
            <button data-tab="appearance" class="tab-btn">Appearance</button>
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
                <label>Icon Type:</label>
                <div class="icon-type-selector" style="display:flex; gap:12px;">
                  <label class="icon-type-option" style="display:flex; align-items:center; gap:6px;">
                    <input type="radio" name="icon-type" value="favicon" checked>
                    <span>Favicon</span>
                  </label>
                  <label class="icon-type-option" style="display:flex; align-items:center; gap:6px;">
                    <input type="radio" name="icon-type" value="emoji">
                    <span>Emoji</span>
                  </label>
                  <label class="icon-type-option" style="display:flex; align-items:center; gap:6px;">
                    <input type="radio" name="icon-type" value="none">
                    <span>No Icon</span>
                  </label>
                </div>
              </div>
              <div class="form-group" id="emoji-input-group" style="display: none;">
                <label>Icon (emoji):</label>
                <input type="text" id="website-icon" placeholder="🌐" maxlength="2">
              </div>
              <div class="form-group">
                <label>Open Mode:</label>
                <select id="website-mode">
                  <option value="iframe" selected>Embedded (iframe)</option>
                  <option value="newtab">New Tab</option>
                  <option value="newwindow">New Window</option>
                </select>
              </div>
              <button id="add-website-btn" class="primary-btn">Add Website</button>
            </div>
            
            <div id="manage-websites-tab" class="tab-content hidden">
              <div id="manage-websites-list"></div>
            </div>
            
            <div id="behavior-tab" class="tab-content hidden">
              <div class="form-group checkbox-group" style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="auto-close">
                <label for="auto-close">Auto-close sidepanel after opening link</label>
              </div>
              <div class="form-group checkbox-group" style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="show-urls">
                <label for="show-urls">Show URLs in website list</label>
              </div>
              <div class="form-group checkbox-group" style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="compact-mode">
                <label for="compact-mode">Compact mode</label>
              </div>
            </div>

            <div id="appearance-tab" class="tab-content hidden">
              <div class="form-group">
                <label>Background Type:</label>
                <div class="icon-type-selector" style="display:flex; gap:12px;">
                  <label class="icon-type-option" style="display:flex; align-items:center; gap:6px;">
                    <input type="radio" name="bg-type" value="gradient" checked>
                    <span>Gradient</span>
                  </label>
                  <label class="icon-type-option" style="display:flex; align-items:center; gap:6px;">
                    <input type="radio" name="bg-type" value="solid">
                    <span>Solid Color</span>
                  </label>
                  <label class="icon-type-option" style="display:flex; align-items:center; gap:6px;">
                    <input type="radio" name="bg-type" value="image">
                    <span>Image</span>
                  </label>
                </div>
              </div>
              <div id="gradient-options" class="bg-options">
                <div class="form-group">
                  <label for="gradient-color1">Start Color:</label>
                  <input type="color" id="gradient-color1" value="#667eea" style="margin-right:8px;">
                  <input type="text" id="gradient-color1-text" value="#667eea" placeholder="#667eea">
                </div>
                <div class="form-group">
                  <label for="gradient-color2">End Color:</label>
                  <input type="color" id="gradient-color2" value="#764ba2" style="margin-right:8px;">
                  <input type="text" id="gradient-color2-text" value="#764ba2" placeholder="#764ba2">
                </div>
                <div class="form-group">
                  <label for="gradient-angle">Angle:</label>
                  <input type="range" id="gradient-angle" min="0" max="360" value="135" style="margin:0 8px;">
                  <span id="gradient-angle-value">135°</span>
                </div>
              </div>
              <div id="solid-options" class="bg-options hidden">
                <div class="form-group">
                  <label for="solid-color">Background Color:</label>
                  <input type="color" id="solid-color" value="#667eea" style="margin-right:8px;">
                  <input type="text" id="solid-color-text" value="#667eea" placeholder="#667eea">
                </div>
              </div>
              <div id="image-options" class="bg-options hidden">
                <div class="form-group">
                  <label for="bg-image-upload">Background Image:</label>
                  <input type="file" id="bg-image-upload" accept="image/*" style="margin-left:8px;">
                  <button id="remove-bg-image" class="icon-btn" style="display:none; margin-left:8px;">Remove</button>
                </div>
                <div class="form-group">
                  <label for="bg-image-opacity">Image Opacity:</label>
                  <input type="range" id="bg-image-opacity" min="0" max="100" value="100" style="margin:0 8px;">
                  <span id="bg-image-opacity-value">100%</span>
                </div>
                <div class="form-group">
                  <label>Preset Gradients:</label>
                  <div class="preset-gradients" style="display:flex; flex-wrap:wrap; gap:8px;">
                    <button class="preset-gradient" data-gradient="135,#667eea,#764ba2" title="Purple Dream"></button>
                    <button class="preset-gradient" data-gradient="135,#f093fb,#f5576c" title="Pink Sunset"></button>
                    <button class="preset-gradient" data-gradient="135,#4facfe,#00f2fe" title="Ocean Blue"></button>
                    <button class="preset-gradient" data-gradient="135,#43e97b,#38f9d7" title="Mint Fresh"></button>
                    <button class="preset-gradient" data-gradient="135,#fa709a,#fee140" title="Warm Sunrise"></button>
                    <button class="preset-gradient" data-gradient="135,#30cfd0,#330867" title="Deep Space"></button>
                    <button class="preset-gradient" data-gradient="135,#a8edea,#fed6e3" title="Soft Pastel"></button>
                    <button class="preset-gradient" data-gradient="135,#ff9a9e,#fecfef" title="Cotton Candy"></button>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer" style="padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.1); display:flex; justify-content:flex-end;">
              <button id="save-settings" class="primary-btn">Save Settings</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Website Modal -->
      <div id="edit-website-modal" class="settings-modal hidden">
        <div class="modal-content edit-modal">
          <div class="modal-header">
            <h2>Edit Website</h2>
            <button id="close-edit" class="icon-btn">✕</button>
          </div>
          <div class="modal-body">
            <div class="settings-section">
              <div class="form-group">
                <label for="edit-website-name">Name:</label>
                <input type="text" id="edit-website-name" placeholder="e.g., ChatGPT">
              </div>
              <div class="form-group">
                <label for="edit-website-url">URL:</label>
                <input type="url" id="edit-website-url" placeholder="https://example.com">
              </div>
              <div class="form-group">
                <label>Icon Type:</label>
                <div class="icon-type-selector">
                  <label class="icon-type-option"><input type="radio" name="edit-icon-type" value="favicon"><span>Favicon</span></label>
                  <label class="icon-type-option"><input type="radio" name="edit-icon-type" value="emoji"><span>Emoji</span></label>
                  <label class="icon-type-option"><input type="radio" name="edit-icon-type" value="none"><span>No Icon</span></label>
                </div>
              </div>
              <div class="form-group" id="edit-emoji-input-group" style="display:none;">
                <label for="edit-website-icon">Icon (emoji):</label>
                <input type="text" id="edit-website-icon" placeholder="🌐" maxlength="2">
              </div>
              <div class="form-group">
                <label for="edit-website-mode">Open Mode:</label>
                <select id="edit-website-mode">
                  <option value="iframe">Embedded (iframe)</option>
                  <option value="newtab">New Tab</option>
                  <option value="newwindow">New Window</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button id="save-edit" class="primary-btn">Save</button>
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
      sidepanelContainer.innerHTML =
        typeof SidepanelUI !== 'undefined' && SidepanelUI.getSidepanelHTML
          ? SidepanelUI.getSidepanelHTML()
          : '<div>Sidepanel UI module not loaded</div>';

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

      // Minimal CSS to support modal and layout in fallback mode
      const fallbackStyles = document.createElement('style');
      fallbackStyles.textContent = `
        .settings-modal {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(0,0,0,0.5);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        .settings-modal:not(.hidden) { display: flex; }
        .modal-content {
          background: rgba(0,0,0,0.9);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          width: calc(100% - 24px);
          max-width: none;
          max-height: calc(100% - 24px);
          overflow: auto;
          color: #fff;
          margin: 12px;
        }
      `;

      sidepanelContainer.appendChild(fallbackStyles);
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

      // Disable frame bypass if active
      if (currentWebsiteUrl) {
        try {
          ExtensionAPI.runtime
            .sendMessage({ action: 'disableFrameBypass', url: currentWebsiteUrl })
            .catch(() => {});
        } catch (_) {}
        currentWebsiteUrl = null;
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
      const elements = [];

      // Try Shadow DOM first
      if (shadowRoot && typeof shadowRoot.querySelectorAll === 'function') {
        const shadowElements = shadowRoot.querySelectorAll(selector);
        if (shadowElements.length > 0) {
          console.debug(
            `Clean-Browsing: Found ${shadowElements.length} ${selector} elements in Shadow DOM`
          );
          return shadowElements;
        }
      }

      // Try fallback container
      if (sidepanelContainer && typeof sidepanelContainer.querySelectorAll === 'function') {
        const containerElements = sidepanelContainer.querySelectorAll(selector);
        if (containerElements.length > 0) {
          console.debug(
            `Clean-Browsing: Found ${containerElements.length} ${selector} elements in fallback container`
          );
          return containerElements;
        }
      }

      // Try document for global elements
      if (selector.startsWith('#clean-browsing-') || selector.startsWith('.clean-browsing-')) {
        const documentElements = document.querySelectorAll(selector);
        if (documentElements.length > 0) {
          console.debug(
            `Clean-Browsing: Found ${documentElements.length} ${selector} elements in document`
          );
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
            // Keep wrapper width equal to viewport and create breathing room with padding
            viewportWrapper.style.width = '100vw';
            viewportWrapper.style.paddingRight = `${this.sidepanelWidth}px`;
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
            viewportWrapper.style.paddingRight = '0px';
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
      },
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

    // Iframe navigation controls
    const navBack = querySelector('#nav-back');
    const navRefresh = querySelector('#nav-refresh');
    if (navBack) navBack.addEventListener('click', () => navigateIframe('back'));
    if (navRefresh) navRefresh.addEventListener('click', () => navigateIframe('refresh'));

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

    if (
      !sidebarSettings ||
      !sidebarSettings.sidebarWebsites ||
      !sidebarSettings.sidebarWebsites.length
    ) {
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
    const sortedWebsites = [...sidebarSettings.sidebarWebsites].sort(
      (a, b) => a.position - b.position
    );

    sortedWebsites.forEach((website) => {
      try {
        const websiteItem = createWebsiteItem(website);
        if (websiteItem) {
          websiteList.appendChild(websiteItem);
        }
      } catch (error) {
        console.error('❌ Clean-Browsing: Failed to create website item:', website, error);
      }
    });

    console.log('✅ Clean-Browsing: Website list rendered');
  }

  function createWebsiteItem(website) {
    const item = document.createElement('div');
    item.className = 'website-item';
    const compact = !!sidebarSettings?.sidebarBehavior?.compactMode;
    const showUrls = !!sidebarSettings?.sidebarBehavior?.showUrls;
    if (compact) item.classList.add('compact');
    if (showUrls) item.classList.add('show-urls');

    const icon = getWebsiteIcon(website);

    item.innerHTML = `
      ${icon}
      <div class="website-info">
        <div class="website-name">${website.name}</div>
        ${showUrls ? `<div class="website-url">${website.url}</div>` : ''}
      </div>
    `;

    item.addEventListener('click', () => openWebsite(website));
    // hover handled by CSS

    return item;
  }

  function getWebsiteIcon(website) {
    const iconType = website.iconType || 'emoji';
    if (iconType === 'none') return '';
    if (iconType === 'favicon' && website.favicon) {
      return `<div class="website-icon-wrapper">
                <img src="${website.favicon}" alt="" class="website-favicon" onerror="this.style.display='none'">
              </div>`;
    }
    const emoji = website.icon || '🌐';
    return `<span class="website-icon">${emoji}</span>`;
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
    if (!website || !website.url) {
      console.error('❌ Clean-Browsing: Invalid website object:', website);
      return;
    }

    const websiteList = querySelector('#website-list');
    const iframeContainer = querySelector('#iframe-container');
    const iframe = querySelector('#website-iframe');
    const iframeTitle = querySelector('#iframe-title');
    const iframeUrl = querySelector('#iframe-current-url');

    // Validate required elements
    if (!websiteList || !iframeContainer || !iframe || !iframeTitle || !iframeUrl) {
      console.error('❌ Clean-Browsing: Required iframe elements not found');
      showIframeError(website);
      return;
    }

    try {
      // Hide website list, show iframe
      websiteList.style.display = 'none';
      websiteList.classList.add('hidden');
      // Ensure iframe container is visible and not marked hidden
      iframeContainer.classList.remove('hidden');
      iframeContainer.style.display = 'flex';
      // Ensure iframe is present/visible and remove any previous error blocks
      const oldError =
        iframeContainer && iframeContainer.querySelector
          ? iframeContainer.querySelector('.iframe-error')
          : null;
      if (oldError && oldError.remove) oldError.remove();
      if (iframe) iframe.style.display = 'block';

      // Set title and URL
      iframeTitle.textContent = website.name;
      iframeUrl.textContent = website.url;

      // Clear any prior timer
      if (iframeLoadTimer) {
        try {
          clearTimeout(iframeLoadTimer);
        } catch (_) {}
        iframeLoadTimer = null;
      }

      let hasLoadStarted = false;

      // Handle iframe errors
      iframe.onerror = () => {
        console.log('❌ Clean-Browsing: Iframe error for:', website.name);
        if (iframeLoadTimer) {
          try {
            clearTimeout(iframeLoadTimer);
          } catch (_) {}
          iframeLoadTimer = null;
        }
        showIframeError(website);
      };

      iframe.onload = () => {
        hasLoadStarted = true;
        // Check if the iframe actually loaded content
        try {
          // Try to access iframe's content window - will throw if cross-origin blocked
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc || iframeDoc.location.href === 'about:blank') {
            console.log('⚠️ Clean-Browsing: Iframe loaded but empty for:', website.name);
            showIframeError(website);
            return;
          }
        } catch (e) {
          // Cross-origin access denied is actually OK - means content loaded
          console.log('✅ Clean-Browsing: Iframe loaded (cross-origin):', website.name);
        }

        console.log('✅ Clean-Browsing: Iframe loaded successfully:', website.name);
        if (iframeLoadTimer) {
          try {
            clearTimeout(iframeLoadTimer);
          } catch (_) {}
          iframeLoadTimer = null;
        }
      };

      // Enable temporary header bypass via background (Firefox/Chrome)
      if (currentWebsiteUrl && currentWebsiteUrl !== website.url) {
        try {
          ExtensionAPI.runtime
            .sendMessage({ action: 'disableFrameBypass', url: currentWebsiteUrl })
            .catch(() => {});
        } catch (_) {}
      }
      currentWebsiteUrl = website.url;
      (async () => {
        try {
          const resp = await ExtensionAPI.runtime.sendMessage({
            action: 'enableFrameBypass',
            url: website.url,
          });
          if (!resp?.success) {
            console.warn('Frame bypass not enabled:', resp?.error || 'unknown');
          }
        } catch (e) {
          console.warn('Failed to request frame bypass:', e);
        }
        // Give the browser a brief moment to apply rules
        await new Promise((r) => setTimeout(r, 200));
        // Load the URL after rules are applied
        try {
          iframe.src = website.url;
        } catch (_) {}
      })();

      // Set a shorter timeout for faster fallback
      iframeLoadTimer = setTimeout(() => {
        // If onload did not clear this timer, treat as blocked
        if (!hasLoadStarted) {
          console.log('⏰ Clean-Browsing: Iframe load timed out for:', website.name);
          showIframeError(website);
        }
        iframeLoadTimer = null;
      }, 5000); // Reduced from 12000ms to 5000ms for faster fallback
    } catch (error) {
      console.error('❌ Clean-Browsing: Error in openInIframe:', error);
      showIframeError(website);
    }
  }

  function backToList() {
    const websiteList = querySelector('#website-list');
    const iframeContainer = querySelector('#iframe-container');
    const iframe = querySelector('#website-iframe');

    // Clear iframe
    iframe.src = 'about:blank';

    // Show website list, hide iframe
    iframeContainer.style.display = 'none';
    iframeContainer.classList.add('hidden');
    // Remove any error UI if present
    const oldError =
      iframeContainer && iframeContainer.querySelector
        ? iframeContainer.querySelector('.iframe-error')
        : null;
    if (oldError && oldError.remove) oldError.remove();
    // Restore list
    websiteList.style.display = 'flex';
    websiteList.classList.remove('hidden');

    // Disable frame bypass rules for last URL
    if (currentWebsiteUrl) {
      try {
        ExtensionAPI.runtime
          .sendMessage({ action: 'disableFrameBypass', url: currentWebsiteUrl })
          .catch(() => {});
      } catch (_) {}
      currentWebsiteUrl = null;
    }
  }

  function navigateIframe(command) {
    const iframe = querySelector('#website-iframe');
    if (!iframe || !iframe.contentWindow) return;
    try {
      iframe.contentWindow.postMessage(
        { type: 'SIDEPANEL_NAVIGATE', command, requestId: Date.now() },
        '*'
      );
    } catch (e) {
      console.warn('Navigation postMessage failed (likely cross-origin restrictions):', e);
      // Fallback: try limited direct actions when possible
      if (command === 'refresh') {
        iframe.src = iframe.src;
      }
    }
  }

  function showIframeError(website) {
    // Show a message that the site can't be embedded
    console.log('🚫 Clean-Browsing: Site cannot be embedded, opening in new tab:', website.name);

    // Known sites that block iframe embedding
    const knownBlockedSites = [
      'google.com',
      'youtube.com',
      'facebook.com',
      'twitter.com',
      'x.com',
      'instagram.com',
      'linkedin.com',
      'reddit.com',
      'amazon.com',
      'netflix.com',
    ];

    const isKnownBlocked = knownBlockedSites.some((site) => website.url.includes(site));
    if (isKnownBlocked) {
      console.log('ℹ️ Clean-Browsing: This is a known site that blocks iframe embedding');
    }

    // Transparent fallback: open in a new tab via background (avoids popup blockers)
    (async () => {
      try {
        await ExtensionAPI.runtime.sendMessage({ action: 'openInNewTab', url: website.url });
        showMessage(`${website.name} opened in new tab (iframe blocked by site)`);
      } catch (_) {
        try {
          window.open(website.url, '_blank');
          showMessage(`${website.name} opened in new tab`);
        } catch (_) {
          showMessage(`Failed to open ${website.name}`);
        }
      }
      // Return UI to list view and cleanup rules
      try {
        if (typeof backToList === 'function') {
          backToList();
        } else if (window.embeddedSidepanel?.backToList) {
          window.embeddedSidepanel.backToList();
        }
      } catch (_) {}
      // Optionally close the sidepanel if user set autoClose
      try {
        if (sidebarSettings?.sidebarBehavior?.autoClose && sidepanelManager?.close) {
          sidepanelManager.close();
        }
      } catch (_) {}
    })();
  }

  function showSettingsModal() {
    console.log('🔧 Clean-Browsing: Showing settings modal');
    const modal = querySelector('#settings-modal');
    if (modal) {
      modal.classList.remove('hidden');
      setupSettingsModalListeners();
      // Populate behavior checkboxes
      const autoClose = querySelector('#auto-close');
      const showUrls = querySelector('#show-urls');
      const compact = querySelector('#compact-mode');
      if (autoClose) autoClose.checked = !!sidebarSettings?.sidebarBehavior?.autoClose;
      if (showUrls) showUrls.checked = !!sidebarSettings?.sidebarBehavior?.showUrls;
      if (compact) compact.checked = !!sidebarSettings?.sidebarBehavior?.compactMode;

      // Load appearance into controls and apply
      loadAppearanceSettings();
      // Render manage list
      renderManageWebsitesList();
    } else {
      console.error('❌ Clean-Browsing: Settings modal not found!');
    }
  }

  function hideSettingsModal() {
    console.log('🔧 Clean-Browsing: Hiding settings modal');
    const modal = querySelector('#settings-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  function setupSettingsModalListeners() {
    const modal = querySelector('#settings-modal');
    if (!modal) return;
    if (modal.dataset.initialized === 'true') return;

    // Close button
    const closeBtn = modal.querySelector('#close-settings');
    if (closeBtn) {
      closeBtn.addEventListener('click', hideSettingsModal);
    }

    // Tab switching
    const tabBtns = modal.querySelectorAll('.tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => switchSettingsTab(btn.dataset.tab));
    });

    // Add website functionality
    const addBtn = modal.querySelector('#add-website-btn');
    if (addBtn) {
      addBtn.addEventListener('click', addWebsite);
    }
    const saveBtn = modal.querySelector('#save-settings');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        await ExtensionAPI.storage.set({ sidebarSettings });
        hideSettingsModal();
      });
    }

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('settings-modal')) {
        hideSettingsModal();
      }
    });

    // Icon type show/hide emoji input
    const iconTypeRadios = modal.querySelectorAll('input[name="icon-type"]');
    const emojiGroup = modal.querySelector('#emoji-input-group');
    iconTypeRadios.forEach((r) =>
      r.addEventListener('change', (e) => {
        if (emojiGroup) emojiGroup.style.display = e.target.value === 'emoji' ? 'block' : 'none';
      })
    );

    // Behavior checkbox listeners
    const autoClose = querySelector('#auto-close');
    const showUrls = querySelector('#show-urls');
    const compact = querySelector('#compact-mode');
    const saveBehavior = async () => {
      try {
        sidebarSettings.sidebarBehavior = sidebarSettings.sidebarBehavior || {};
        sidebarSettings.sidebarBehavior.autoClose = !!autoClose?.checked;
        sidebarSettings.sidebarBehavior.showUrls = !!showUrls?.checked;
        sidebarSettings.sidebarBehavior.compactMode = !!compact?.checked;
        await ExtensionAPI.storage.set({ sidebarSettings });
        renderWebsiteList();
      } catch (e) {
        console.error('Failed to save behavior settings', e);
      }
    };
    if (autoClose) autoClose.addEventListener('change', saveBehavior);
    if (showUrls) showUrls.addEventListener('change', saveBehavior);
    if (compact) compact.addEventListener('change', saveBehavior);

    // Appearance listeners
    setupAppearanceListeners();

    // Preset gradients
    modal.querySelectorAll('.preset-gradient').forEach((btn) => {
      btn.addEventListener('click', () => {
        const data = btn.getAttribute('data-gradient') || ''; // e.g., "135,#667eea,#764ba2"
        const [angle, c1, c2] = data.split(',');
        const ga = modal.querySelector('#gradient-angle');
        const gav = modal.querySelector('#gradient-angle-value');
        const gc1 = modal.querySelector('#gradient-color1');
        const gc1t = modal.querySelector('#gradient-color1-text');
        const gc2 = modal.querySelector('#gradient-color2');
        const gc2t = modal.querySelector('#gradient-color2-text');
        if (ga) ga.value = angle || '135';
        if (gav) gav.textContent = (angle || '135') + '°';
        if (gc1) gc1.value = c1 || '#667eea';
        if (gc1t) gc1t.value = c1 || '#667eea';
        if (gc2) gc2.value = c2 || '#764ba2';
        if (gc2t) gc2t.value = c2 || '#764ba2';
        const radio = modal.querySelector('input[name="bg-type"][value="gradient"]');
        if (radio) radio.checked = true;
        saveAppearanceFromControls();
      });
    });

    modal.dataset.initialized = 'true';
  }

  function switchSettingsTab(tabName) {
    const modal = querySelector('#settings-modal');
    if (!modal) return;

    // Update tab buttons
    const tabBtns = modal.querySelectorAll('.tab-btn');
    tabBtns.forEach((btn) => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Show/hide tab content
    const tabContents = modal.querySelectorAll('.tab-content');
    tabContents.forEach((content) => {
      if (content.id === `${tabName}-tab`) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    });
  }

  async function addWebsite() {
    const modal = querySelector('#settings-modal');
    const nameInput = modal?.querySelector('#website-name');
    const urlInput = modal?.querySelector('#website-url');
    const iconInput = modal?.querySelector('#website-icon');
    const iconType = modal?.querySelector('input[name="icon-type"]:checked')?.value || 'favicon';
    const modeSelect = modal?.querySelector('#website-mode');

    const name = nameInput?.value.trim();
    const url = urlInput?.value.trim();
    const icon = iconInput?.value.trim();
    const openMode = modeSelect?.value || 'iframe';

    if (!name || !url) {
      showMessage('Please enter both name and URL');
      return;
    }

    const newWebsite = {
      id: Date.now().toString(),
      name: name,
      url: url,
      icon: icon || '🌐',
      iconType,
      favicon: iconType === 'favicon' ? getFaviconUrl(url) : null,
      openMode,
      position: sidebarSettings.sidebarWebsites.length,
    };

    sidebarSettings.sidebarWebsites.push(newWebsite);

    try {
      await ExtensionAPI.storage.set({ sidebarSettings });
      console.log('✅ Website added:', newWebsite);

      // Clear form
      if (nameInput) nameInput.value = '';
      if (urlInput) urlInput.value = '';
      if (iconInput) iconInput.value = '';

      // Refresh website list and manage list
      renderWebsiteList();
      renderManageWebsitesList();
      hideSettingsModal();
    } catch (error) {
      console.error('❌ Failed to save website:', error);
      showMessage('Failed to save website');
    }
  }

  // Utilities
  function getFaviconUrl(websiteUrl) {
    try {
      const u = new URL(websiteUrl);
      return `${u.protocol}//${u.hostname}/favicon.ico`;
    } catch {
      return null;
    }
  }

  function renderManageWebsitesList() {
    const list = querySelector('#manage-websites-list');
    if (!list) return;
    list.innerHTML = '';
    const items = [...(sidebarSettings?.sidebarWebsites || [])].sort(
      (a, b) => a.position - b.position
    );
    items.forEach((w, idx) => {
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex; align-items:center; gap:8px; padding:8px; border:1px solid rgba(255,255,255,0.2); border-radius:6px; margin-bottom:6px;';
      const name = document.createElement('div');
      name.textContent = w.name;
      name.style.cssText = 'flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
      const up = document.createElement('button');
      up.className = 'icon-btn';
      up.textContent = '↑';
      up.title = 'Move up';
      const down = document.createElement('button');
      down.className = 'icon-btn';
      down.textContent = '↓';
      down.title = 'Move down';
      const edit = document.createElement('button');
      edit.className = 'icon-btn';
      edit.textContent = '✎';
      edit.title = 'Edit';
      const del = document.createElement('button');
      del.className = 'icon-btn';
      del.textContent = '🗑';
      del.title = 'Delete';
      row.appendChild(name);
      row.appendChild(up);
      row.appendChild(down);
      row.appendChild(edit);
      row.appendChild(del);
      list.appendChild(row);

      up.disabled = idx === 0;
      down.disabled = idx === items.length - 1;
      up.addEventListener('click', async () => {
        reorderWebsite(w.id, -1);
      });
      down.addEventListener('click', async () => {
        reorderWebsite(w.id, +1);
      });
      del.addEventListener('click', async () => {
        await deleteWebsite(w.id);
      });
      edit.addEventListener('click', () => {
        openEditWebsiteModal(w);
      });
    });
  }

  async function saveSettingsAndRefresh() {
    await ExtensionAPI.storage.set({ sidebarSettings });
    renderWebsiteList();
    renderManageWebsitesList();
  }

  async function deleteWebsite(id) {
    sidebarSettings.sidebarWebsites = sidebarSettings.sidebarWebsites.filter((w) => w.id !== id);
    // Reassign positions
    sidebarSettings.sidebarWebsites
      .sort((a, b) => a.position - b.position)
      .forEach((w, i) => (w.position = i));
    await saveSettingsAndRefresh();
  }

  async function reorderWebsite(id, delta) {
    const arr = sidebarSettings.sidebarWebsites;
    const idx = arr.findIndex((w) => w.id === id);
    if (idx < 0) return;
    const swapIdx = idx + delta;
    if (swapIdx < 0 || swapIdx >= arr.length) return;
    const tmpPos = arr[idx].position;
    arr[idx].position = arr[swapIdx].position;
    arr[swapIdx].position = tmpPos;
    arr.sort((a, b) => a.position - b.position);
    await saveSettingsAndRefresh();
  }

  function openEditWebsiteModal(website) {
    const modal = querySelector('#edit-website-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    const name = modal.querySelector('#edit-website-name');
    if (name) name.value = website.name || '';
    const url = modal.querySelector('#edit-website-url');
    if (url) url.value = website.url || '';
    const mode = modal.querySelector('#edit-website-mode');
    if (mode) mode.value = website.openMode || 'iframe';
    const iconTypeRadios = modal.querySelectorAll('input[name="edit-icon-type"]');
    iconTypeRadios.forEach((r) => {
      r.checked = r.value === (website.iconType || 'favicon');
    });
    const emojiGroup = modal.querySelector('#edit-emoji-input-group');
    const emojiInput = modal.querySelector('#edit-website-icon');
    if (emojiInput) emojiInput.value = website.icon || '';
    if (emojiGroup) emojiGroup.style.display = website.iconType === 'emoji' ? 'block' : 'none';
    // Listeners
    iconTypeRadios.forEach((r) =>
      r.addEventListener('change', (e) => {
        if (emojiGroup) emojiGroup.style.display = e.target.value === 'emoji' ? 'block' : 'none';
      })
    );
    const close = modal.querySelector('#close-edit');
    if (close) close.onclick = () => modal.classList.add('hidden');
    const save = modal.querySelector('#save-edit');
    if (save) {
      save.onclick = async () => {
        website.name = name?.value?.trim() || website.name;
        website.url = url?.value?.trim() || website.url;
        website.openMode = mode?.value || website.openMode || 'iframe';
        const sel = modal.querySelector('input[name="edit-icon-type"]:checked');
        website.iconType = sel?.value || website.iconType || 'favicon';
        website.icon =
          website.iconType === 'emoji' ? emojiInput?.value?.trim() || '🌐' : website.icon;
        website.favicon = website.iconType === 'favicon' ? getFaviconUrl(website.url) : null;
        await saveSettingsAndRefresh();
        modal.classList.add('hidden');
      };
    }
  }

  // Appearance handling
  function setupAppearanceListeners() {
    const modal = querySelector('#settings-modal');
    if (!modal) return;
    const bgRadios = modal.querySelectorAll('input[name="bg-type"]');
    const gradientOpt = modal.querySelector('#gradient-options');
    const solidOpt = modal.querySelector('#solid-options');
    const imageOpt = modal.querySelector('#image-options');
    bgRadios.forEach((r) =>
      r.addEventListener('change', () => {
        const val = modal.querySelector('input[name="bg-type"]:checked')?.value || 'gradient';
        gradientOpt?.classList.add('hidden');
        solidOpt?.classList.add('hidden');
        imageOpt?.classList.add('hidden');
        if (val === 'gradient') gradientOpt?.classList.remove('hidden');
        if (val === 'solid') solidOpt?.classList.remove('hidden');
        if (val === 'image') imageOpt?.classList.remove('hidden');
        // Save & apply immediately
        saveAppearanceFromControls();
      })
    );

    const gc1 = modal.querySelector('#gradient-color1');
    const gc1t = modal.querySelector('#gradient-color1-text');
    const gc2 = modal.querySelector('#gradient-color2');
    const gc2t = modal.querySelector('#gradient-color2-text');
    const ga = modal.querySelector('#gradient-angle');
    const gav = modal.querySelector('#gradient-angle-value');
    const sc = modal.querySelector('#solid-color');
    const sct = modal.querySelector('#solid-color-text');
    const imgUpload = modal.querySelector('#bg-image-upload');
    const imgRemove = modal.querySelector('#remove-bg-image');
    const imgOpacity = modal.querySelector('#bg-image-opacity');
    const imgOpacityVal = modal.querySelector('#bg-image-opacity-value');

    const sync = () => saveAppearanceFromControls();
    [gc1, gc1t, gc2, gc2t, sc, sct].forEach((el) => {
      if (el) el.addEventListener('input', sync);
    });
    if (ga)
      ga.addEventListener('input', () => {
        if (gav) gav.textContent = ga.value + '°';
        sync();
      });
    if (imgUpload) imgUpload.addEventListener('change', handleImageUpload);
    if (imgRemove) imgRemove.addEventListener('click', removeBackgroundImage);
    if (imgOpacity)
      imgOpacity.addEventListener('input', () => {
        if (imgOpacityVal) imgOpacityVal.textContent = imgOpacity.value + '%';
        sync();
      });
  }

  function saveAppearanceFromControls() {
    const modal = querySelector('#settings-modal');
    if (!modal) return;
    sidebarSettings.appearance = sidebarSettings.appearance || {
      backgroundType: 'gradient',
      backgroundSettings: {},
    };
    const type = modal.querySelector('input[name="bg-type"]:checked')?.value || 'gradient';
    if (type === 'gradient') {
      const color1 = modal.querySelector('#gradient-color1')?.value || '#667eea';
      const color2 = modal.querySelector('#gradient-color2')?.value || '#764ba2';
      const angle = parseInt(modal.querySelector('#gradient-angle')?.value || '135', 10);
      sidebarSettings.appearance.backgroundType = 'gradient';
      sidebarSettings.appearance.backgroundSettings = { color1, color2, angle };
    } else if (type === 'solid') {
      const color = modal.querySelector('#solid-color')?.value || '#667eea';
      sidebarSettings.appearance.backgroundType = 'solid';
      sidebarSettings.appearance.backgroundSettings = { color };
    } else if (type === 'image') {
      const opacity = parseInt(modal.querySelector('#bg-image-opacity')?.value || '100', 10) / 100;
      sidebarSettings.appearance.backgroundType = 'image';
      sidebarSettings.appearance.backgroundSettings = {
        image: currentBackgroundImage || null,
        opacity,
      };
    }
    applyAppearanceToPanel();
    ExtensionAPI.storage.set({ sidebarSettings }).catch(() => {});
  }

  function loadAppearanceSettings() {
    if (!sidebarSettings.appearance) {
      sidebarSettings.appearance = {
        backgroundType: 'gradient',
        backgroundSettings: { color1: '#667eea', color2: '#764ba2', angle: 135 },
      };
    }
    const modal = querySelector('#settings-modal');
    if (!modal) return;
    const { backgroundType, backgroundSettings } = sidebarSettings.appearance;
    const sel = modal.querySelector(`input[name="bg-type"][value="${backgroundType}"]`);
    if (sel) sel.checked = true;
    modal.querySelectorAll('.bg-options').forEach((el) => el.classList.add('hidden'));
    const active = modal.querySelector(`#${backgroundType}-options`);
    if (active) active.classList.remove('hidden');
    if (backgroundType === 'gradient') {
      modal.querySelector('#gradient-color1').value = backgroundSettings.color1 || '#667eea';
      modal.querySelector('#gradient-color1-text').value = backgroundSettings.color1 || '#667eea';
      modal.querySelector('#gradient-color2').value = backgroundSettings.color2 || '#764ba2';
      modal.querySelector('#gradient-color2-text').value = backgroundSettings.color2 || '#764ba2';
      modal.querySelector('#gradient-angle').value = backgroundSettings.angle || 135;
      modal.querySelector('#gradient-angle-value').textContent =
        (backgroundSettings.angle || 135) + '°';
    } else if (backgroundType === 'solid') {
      modal.querySelector('#solid-color').value = backgroundSettings.color || '#667eea';
      modal.querySelector('#solid-color-text').value = backgroundSettings.color || '#667eea';
    } else if (backgroundType === 'image') {
      currentBackgroundImage = backgroundSettings.image || null;
      const rm = modal.querySelector('#remove-bg-image');
      if (rm) rm.style.display = currentBackgroundImage ? 'block' : 'none';
      const op = Math.round((backgroundSettings.opacity ?? 1) * 100);
      modal.querySelector('#bg-image-opacity').value = op;
      modal.querySelector('#bg-image-opacity-value').textContent = op + '%';
    }
    applyAppearanceToPanel();
  }

  function applyAppearanceToPanel() {
    // Apply background to the sidepanel content area
    const content = querySelector('.sidepanel-content');
    if (!content) return;
    const { backgroundType, backgroundSettings } = sidebarSettings.appearance || {};
    if (backgroundType === 'gradient') {
      const { color1 = '#667eea', color2 = '#764ba2', angle = 135 } = backgroundSettings || {};
      content.style.background = `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
    } else if (backgroundType === 'solid') {
      const { color = '#667eea' } = backgroundSettings || {};
      content.style.background = color;
    } else if (backgroundType === 'image') {
      const { image = null, opacity = 1 } = backgroundSettings || {};
      if (image) {
        content.style.background = `linear-gradient(rgba(0,0,0,${1 - opacity}), rgba(0,0,0,${1 - opacity})), url('${image}') center/cover`;
      } else {
        content.style.background = '';
      }
    } else {
      // default translucent
      content.style.background = 'rgba(0,0,0,0.2)';
    }
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      currentBackgroundImage = ev.target?.result;
      const rm = querySelector('#remove-bg-image');
      if (rm) rm.style.display = 'block';
      saveAppearanceFromControls();
    };
    reader.readAsDataURL(file);
  }

  function removeBackgroundImage() {
    currentBackgroundImage = null;
    const up = querySelector('#bg-image-upload');
    if (up) up.value = '';
    const rm = querySelector('#remove-bg-image');
    if (rm) rm.style.display = 'none';
    // Switch back to gradient for a pleasant default
    const g = querySelector('input[name="bg-type"][value="gradient"]');
    if (g) g.checked = true;
    saveAppearanceFromControls();
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
    setTimeout(() => (toast.style.opacity = '1'), 10);

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
