// Content script to inject embedded sidepanel on any webpage
// This creates an overlay sidepanel that works exactly like the new tab version

(function() {
  'use strict';
  
  // Only inject on main pages, not iframes
  if (window.top !== window.self) {
    return;
  }
  
  // Don't inject on the new tab page (already has embedded sidepanel)
  if (window.location.href.includes('chrome-extension://') && window.location.href.includes('newtab.html')) {
    return;
  }
  
  let isInjected = false;
  let sidepanelContainer = null;
  let splitViewManager = null;
  let embeddedSidepanel = null;
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleSidepanel') {
      toggleSidepanel();
      sendResponse({ success: true });
    }
    return true;
  });
  
  function toggleSidepanel() {
    if (!isInjected) {
      injectSidepanel();
    } else {
      if (splitViewManager) {
        splitViewManager.toggle();
      }
    }
  }
  
  function injectSidepanel() {
    if (isInjected) return;
    
    // Create container that won't affect page layout
    const container = document.createElement('div');
    container.id = 'clean-browsing-sidepanel-overlay';
    container.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 0;
      height: 100vh;
      z-index: 2147483647;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      transition: width 0.3s ease;
    `;
    
    // Create the sidepanel structure
    container.innerHTML = `
      <div class="sidepanel-container sidepanel-closed" style="
        display: flex;
        flex-direction: row;
        height: 100vh;
        background: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: auto;
      ">
        <div class="sidepanel-resize-handle" style="
          width: 6px;
          background: rgba(255, 255, 255, 0.1);
          cursor: ew-resize;
          border-right: 1px solid rgba(255, 255, 255, 0.2);
          transition: background-color 0.2s ease;
          flex-shrink: 0;
          position: relative;
          z-index: 100;
        " title="Drag to resize"></div>
        
        <div class="sidepanel-content" style="
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          min-width: 280px;
          color: #ffffff;
        ">
          <!-- Header -->
          <div class="sidepanel-header" style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: rgba(0, 0, 0, 0.4);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            flex-shrink: 0;
            gap: 8px;
          ">
            <div class="header-title" style="
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;
              font-weight: 600;
              min-width: 0;
              flex: 1;
            ">
              <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Quick Access</span>
            </div>
            <button id="sidepanel-settings-btn" class="icon-btn" title="Settings" style="
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
            ">⚙️</button>
            <button id="sidepanel-close-btn" class="icon-btn" title="Close Panel" style="
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
            ">✕</button>
          </div>

          <!-- Website List -->
          <div id="website-list" class="website-list" style="
            flex: 1;
            overflow-y: auto;
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          ">
            <!-- Websites will be dynamically added here -->
          </div>

          <!-- Iframe Container -->
          <div id="iframe-container" class="iframe-container hidden" style="
            flex: 1;
            display: flex;
            flex-direction: column;
            background: rgba(0, 0, 0, 0.1);
          ">
            <div class="iframe-header" style="
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px 12px;
              background: rgba(0, 0, 0, 0.4);
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
              min-height: 40px;
            ">
              <button id="back-to-list" class="icon-btn" title="Back to list" style="
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                padding: 2px 6px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                min-width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
              ">←</button>
              <div class="iframe-info" style="
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 1px;
              ">
                <span id="iframe-title" class="iframe-name" style="
                  font-weight: 500;
                  font-size: 12px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                "></span>
                <span id="iframe-current-url" class="iframe-current-url" style="
                  font-size: 10px;
                  color: rgba(255, 255, 255, 0.7);
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  cursor: pointer;
                  transition: color 0.2s ease;
                ">Loading...</span>
              </div>
              <div class="iframe-navigation" style="display: flex; gap: 4px;">
                <button id="nav-back" class="nav-btn" title="Back" style="
                  background: rgba(255, 255, 255, 0.1);
                  border: 1px solid rgba(255, 255, 255, 0.2);
                  color: #ffffff;
                  padding: 2px 6px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 12px;
                  min-width: 20px;
                  height: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">⬅</button>
                <button id="nav-refresh" class="nav-btn" title="Refresh" style="
                  background: rgba(255, 255, 255, 0.1);
                  border: 1px solid rgba(255, 255, 255, 0.2);
                  color: #ffffff;
                  padding: 2px 6px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 12px;
                  min-width: 20px;
                  height: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">↻</button>
              </div>
              <button id="open-in-tab" class="icon-btn" title="Open in new tab" style="
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                padding: 4px 8px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                min-width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
              ">↗</button>
            </div>
            <iframe id="website-iframe" class="website-iframe" style="
              flex: 1;
              width: 100%;
              border: none;
              background: #ffffff;
            "></iframe>
          </div>
          
          <!-- Settings and other modals will be added here -->
          <div id="sidepanel-settings-modal" class="hidden"></div>
          <div id="edit-website-modal" class="hidden"></div>
        </div>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(container);
    sidepanelContainer = container;
    
    // Load required scripts dynamically
    loadSidepanelScripts().then(() => {
      // Initialize functionality
      initializeSidepanelFunctionality();
      
      // Open the panel
      setTimeout(() => {
        if (splitViewManager) {
          splitViewManager.open();
        }
      }, 100);
      
      isInjected = true;
    }).catch(error => {
      console.error('Failed to load sidepanel scripts:', error);
    });
  }
  
  async function loadSidepanelScripts() {
    // Create a simplified split view manager for the overlay
    window.SplitViewManager = class {
      constructor() {
        this.isOpen = false;
        this.sidepanelWidth = 400;
        this.minSidepanelWidth = 300;
        this.maxSidepanelWidth = 800;
        this.container = sidepanelContainer;
        this.sidepanelContainer = sidepanelContainer.querySelector('.sidepanel-container');
        this.setupEventListeners();
      }
      
      setupEventListeners() {
        const closeBtn = this.sidepanelContainer.querySelector('#sidepanel-close-btn');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => this.close());
        }
        
        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
          if (e.altKey && e.key === 's') {
            e.preventDefault();
            this.toggle();
          }
          if (e.key === 'Escape' && this.isOpen) {
            this.close();
          }
        });
      }
      
      open() {
        this.isOpen = true;
        this.updateLayout();
        this.saveState();
        
        window.dispatchEvent(new CustomEvent('sidepanel-opened', {
          detail: { width: this.sidepanelWidth }
        }));
      }
      
      close() {
        this.isOpen = false;
        this.updateLayout();
        this.saveState();
        
        window.dispatchEvent(new CustomEvent('sidepanel-closed'));
      }
      
      toggle() {
        if (this.isOpen) {
          this.close();
        } else {
          this.open();
        }
      }
      
      updateLayout() {
        if (this.isOpen) {
          this.container.style.width = this.sidepanelWidth + 'px';
          this.sidepanelContainer.classList.remove('sidepanel-closed');
          this.sidepanelContainer.classList.add('sidepanel-open');
          this.sidepanelContainer.style.opacity = '1';
        } else {
          this.container.style.width = '0';
          this.sidepanelContainer.classList.remove('sidepanel-open');
          this.sidepanelContainer.classList.add('sidepanel-closed');
          this.sidepanelContainer.style.opacity = '0';
        }
      }
      
      isSidepanelOpen() {
        return this.isOpen;
      }
      
      getSidepanelWidth() {
        return this.sidepanelWidth;
      }
      
      setSidepanelWidth(width) {
        this.sidepanelWidth = Math.max(this.minSidepanelWidth, Math.min(this.maxSidepanelWidth, width));
        if (this.isOpen) {
          this.updateLayout();
        }
      }
      
      saveState() {
        try {
          const state = {
            isOpen: this.isOpen,
            width: this.sidepanelWidth,
            timestamp: Date.now()
          };
          localStorage.setItem('injectedSidepanelState', JSON.stringify(state));
        } catch (error) {
          console.error('Failed to save sidepanel state:', error);
        }
      }
    };
    
    // Load the embedded sidepanel class (simplified version)
    const response = await fetch(chrome.runtime.getURL('sidepanel-embedded.js'));
    const scriptText = await response.text();
    
    // Execute the script in this context
    const script = document.createElement('script');
    script.textContent = scriptText;
    document.head.appendChild(script);
  }
  
  function initializeSidepanelFunctionality() {
    // Create split view manager instance
    splitViewManager = new window.SplitViewManager();
    window.splitViewManager = splitViewManager;
    
    // Initialize embedded sidepanel if the class is available
    if (window.EmbeddedSidepanel) {
      embeddedSidepanel = new window.EmbeddedSidepanel();
      window.embeddedSidepanel = embeddedSidepanel;
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Ready to inject when background script triggers
    });
  }
})();