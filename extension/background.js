// Background service worker for Clean-Browsing extension (Manifest V3)
// Uses declarativeNetRequest for header modification in Chrome MV3
// Falls back to webRequest for Firefox MV2

// Import required modules for service worker
importScripts('default-settings.js', 'browser-api.js');

// Track active sessions for header modification
// Per-tab mapping of allowed origins to modify
const sessionsByTab = new Map(); // tabId -> Set<string origin>

function addOriginForTab(tabId, origin) {
  if (typeof tabId !== 'number' || !origin) return;
  let set = sessionsByTab.get(tabId);
  if (!set) { 
    set = new Set(); 
    sessionsByTab.set(tabId, set); 
  }
  set.add(origin);
  console.log(`Added origin ${origin} for tab ${tabId}`);
}

function removeOriginForTab(tabId, origin) {
  if (typeof tabId !== 'number' || !origin) return;
  const set = sessionsByTab.get(tabId);
  if (set) {
    set.delete(origin);
    if (set.size === 0) sessionsByTab.delete(tabId);
    console.log(`Removed origin ${origin} for tab ${tabId}`);
  }
}

// Clean up when tab closes
ExtensionAPI.tabs.onRemoved.addListener((tabId) => {
  if (sessionsByTab.has(tabId)) {
    console.log(`Cleaning up sessions for closed tab ${tabId}`);
    sessionsByTab.delete(tabId);
  }
});

// Session cleanup - remove old sessions after timeout
function cleanupOldSessions() {
  const totalSessions = Array.from(sessionsByTab.values()).reduce((sum, set) => sum + set.size, 0);
  
  if (totalSessions > 50) {
    console.warn(`Large number of active sessions detected (${totalSessions}) - consider cleanup`);
  }
}

// Run cleanup periodically
setInterval(cleanupOldSessions, 5 * 60 * 1000); // Every 5 minutes

// Unified header modification using webRequest API (works in both Chrome and Firefox)
console.log(`Setting up ${ExtensionAPI.browser.name} webRequest header modification`);

ExtensionAPI.webRequest.onHeadersReceived.addListener(
  function(details) {
    try {
      // Only modify headers for sub_frame requests (iframe content)
      if (details.type !== 'sub_frame') {
        return {};
      }

      // Scope by tab and origin
      const tabId = details.tabId;
      const requestOrigin = new URL(details.url).origin;
      const set = sessionsByTab.get(tabId);
      if (!set || !set.has(requestOrigin)) {
        return {};
      }

      // Remove problematic headers that block iframe embedding
      const headersToRemove = [
        'x-frame-options',
        'content-security-policy', 
        'x-content-security-policy',
        'x-content-type-options',
        'permissions-policy',
        'cross-origin-opener-policy',
        'cross-origin-embedder-policy'
      ];
      
      const responseHeaders = details.responseHeaders || [];
      const filteredHeaders = responseHeaders.filter(header => {
        return !headersToRemove.includes(header.name.toLowerCase());
      });
      
      // Only return modified headers if we actually removed something
      if (filteredHeaders.length < responseHeaders.length) {
        console.log(`Modified headers for ${details.url} (removed ${responseHeaders.length - filteredHeaders.length} headers)`);
        return { responseHeaders: filteredHeaders };
      }
      
      return {};
    } catch (error) {
      console.error('Error in webRequest header modification:', error);
      // Return empty object to avoid breaking the request
      return {};
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking", "responseHeaders"]
);

// Follow redirects: if a sub_frame redirects within an active tab session, include the new origin
ExtensionAPI.webRequest.onBeforeRedirect.addListener(
  function(details) {
    try {
      if (details.type !== 'sub_frame') return;
      const tabId = details.tabId;
      if (!sessionsByTab.has(tabId)) return;
      const newOrigin = new URL(details.redirectUrl).origin;
      addOriginForTab(tabId, newOrigin);
    } catch (e) {
      // ignore parse errors
    }
  },
  { urls: ["<all_urls>"] }
);

// Listen for messages from the extension
ExtensionAPI.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  try {
    switch (request.action) {
      case 'getSidebarSettings':
        try {
          const result = await ExtensionAPI.storage.get(['sidebarSettings']);
          sendResponse(result.sidebarSettings || getDefaultSidebarSettings());
        } catch (error) {
          console.error('Error getting sidebar settings:', error);
          sendResponse(getDefaultSidebarSettings());
        }
        return true; // Keep message channel open for async response

      case 'enableFrameBypass':
        try {
          // Validate URL
          if (!request.url || typeof request.url !== 'string') {
            throw new Error('Invalid URL provided');
          }
          
          const url = new URL(request.url);
          
          // Enable frame bypass for this tab + origin
          const tabId = sender?.tab?.id;
          if (typeof tabId === 'number') {
            addOriginForTab(tabId, url.origin);
          }
          
          console.log(`Frame bypass enabled for: ${url.origin} (tab ${tabId ?? 'n/a'})`);
          
          sendResponse({ 
            success: true, 
            browser: ExtensionAPI.browser.name,
            method: 'webRequest'
          });
        } catch (error) {
          console.error('Error enabling frame bypass:', error);
          sendResponse({ 
            success: false, 
            error: error.message,
            fallback: 'URL will open in new tab instead'
          });
        }
        return true;

      case 'disableFrameBypass':
        try {
          const tabId = sender?.tab?.id;
          if (request.url && typeof request.url === 'string') {
            try {
              const origin = new URL(request.url).origin;
              if (typeof tabId === 'number') {
                removeOriginForTab(tabId, origin);
              }
            } catch (_) {
              // ignore parse errors
            }
          } else if (typeof tabId === 'number') {
            // If no URL, clear all for tab
            sessionsByTab.delete(tabId);
          }
          
          console.log(`Frame bypass disabled for tab ${tabId ?? 'n/a'}`);
          
          sendResponse({ 
            success: true, 
            browser: ExtensionAPI.browser.name,
            method: 'webRequest'
          });
        } catch (error) {
          console.error('Error disabling frame bypass:', error);
          sendResponse({ 
            success: false, 
            error: error.message
          });
        }
        return true;

      case 'saveSidebarSettings':
        try {
          await ExtensionAPI.storage.set({ sidebarSettings: request.settings });
          console.log('Sidebar settings saved');
          sendResponse({ success: true });
        } catch (error) {
          console.error('Error saving sidebar settings:', error);
          sendResponse({ success: false, error: error.message });
        }
        return true;

      case 'openInNewTab':
        try {
          // Validate URL
          if (!request.url || typeof request.url !== 'string') {
            throw new Error('Invalid URL provided');
          }
          
          // Test URL validity
          new URL(request.url);
          
          // Open URL in new tab
          await ExtensionAPI.tabs.create({ url: request.url });
          sendResponse({ success: true });
        } catch (error) {
          console.error('Error opening URL in new tab:', error);
          sendResponse({ success: false, error: error.message });
        }
        return true;

      default:
        console.warn('Unknown message action:', request.action);
        sendResponse({ success: false, error: 'Unknown action' });
        return true;
    }
  } catch (error) {
    console.error('Error in message listener:', error);
    sendResponse({ success: false, error: 'Internal error' });
    return true;
  }
});

// Default sidepanel settings (using shared module)
function getDefaultSidebarSettings() {
  return DefaultSettings.getDefaultSidebarSettings();
}

// Handle extension icon click - inject embedded sidepanel on non-newtab pages
ExtensionAPI.action.onClicked.addListener(async (tab) => {
  console.log('🖱️ Extension button clicked for tab:', tab.id, 'URL:', tab.url);
  
  // Don't inject on new tab page (already has embedded panel) or extension/browser pages
  const excludedPrefixes = [
    'chrome-extension://', 'chrome://', 'edge://', 'about:', 
    'moz-extension://', 'firefox://'
  ];
  const isExcludedUrl = excludedPrefixes.some(prefix => tab.url?.startsWith(prefix));
  
  if (!tab.url || isExcludedUrl) {
    console.log('⏭️ Skipping sidepanel injection for excluded URL:', tab.url);
    return;
  }
  
  try {
    // Check if content script is already injected by trying to send a message
    console.log('📨 Sending toggle message to content script...');
    
    const response = await ExtensionAPI.tabs.sendMessage(tab.id, { action: 'toggleSidepanel' });
    console.log('✅ Sidepanel toggle successful:', response);
    
  } catch (error) {
    console.log('❌ Content script not responding:', error.message);
    console.log('🔧 This likely means the content script failed to inject or the page has restrictive CSP');
    
    // Additional debugging - check if we can inject scripts
    try {
      const results = await ExtensionAPI.executeScript({ tabId: tab.id }, () => {
        return {
          url: window.location.href,
          hasCleanBrowsingContainer: !!document.getElementById('clean-browsing-sidepanel-overlay'),
          documentReady: document.readyState,
          cspHeaders: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || 'none'
        };
      });
      
      console.log('🔍 Page analysis:', results[0].result);
      
      if (results[0].result.hasCleanBrowsingContainer) {
        console.log('⚠️ Sidepanel container already exists but content script not responding');
      } else {
        console.log('ℹ️ No sidepanel container found - content script may have failed to load');
      }
      
    } catch (scriptError) {
      console.error('🚫 Cannot execute scripts on this page:', scriptError.message);
      console.log('💡 This usually means:');
      console.log('   - Page has restrictive CSP');
      console.log('   - Page is on chrome:// or other protected scheme');
      console.log('   - Extension lacks necessary permissions');
    }
  }
});