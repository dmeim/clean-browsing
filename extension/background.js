// Background script for Clean-Browsing (Firefox-focused WebExtension)
// Relies on the shared ExtensionAPI wrapper for promise-based access.

// Import required modules after the polyfill has initialised the browser API
importScripts('browser-api.js', 'default-settings.js');

// Track active sessions for header modification
// Context mapping of allowed origins (tabId or special keys like 'sidebar')
const sessionsByContext = new Map(); // contextKey -> Set<string origin>

function addOriginForContext(contextKey, origin) {
  if (contextKey == null || !origin) return;
  let set = sessionsByContext.get(contextKey);
  if (!set) {
    set = new Set();
    sessionsByContext.set(contextKey, set);
  }
  set.add(origin);
  console.log(`Added origin ${origin} for context ${contextKey}`);
}

function removeOriginForContext(contextKey, origin) {
  if (contextKey == null || !origin) return;
  const set = sessionsByContext.get(contextKey);
  if (set) {
    set.delete(origin);
    if (set.size === 0) sessionsByContext.delete(contextKey);
    console.log(`Removed origin ${origin} for context ${contextKey}`);
  }
}

function clearContext(contextKey) {
  if (contextKey == null) return;
  if (sessionsByContext.delete(contextKey)) {
    console.log(`Cleared frame bypass sessions for context ${contextKey}`);
  }
}

function getContextKeyFromTabId(tabId) {
  return (typeof tabId === 'number' && tabId >= 0) ? tabId : null;
}

function getContextKeyFromSender(sender) {
  const tabId = sender?.tab?.id;
  if (typeof tabId === 'number' && tabId >= 0) {
    return tabId;
  }
  const senderUrl = sender?.url || '';
  if (senderUrl.includes('/sidepanel.html')) {
    return 'sidebar';
  }
  return null;
}

function getContextKeyFromDetails(details) {
  const tabKey = getContextKeyFromTabId(details.tabId);
  if (tabKey !== null) {
    return tabKey;
  }
  const docUrl = details.documentUrl || details.initiator || '';
  if (docUrl.includes('/sidepanel.html')) {
    return 'sidebar';
  }
  return null;
}

// Clean up when tab closes
ExtensionAPI.tabs.onRemoved.addListener((tabId) => {
  const contextKey = getContextKeyFromTabId(tabId);
  if (contextKey !== null) {
    clearContext(contextKey);
  }
});

// Session cleanup - remove old sessions after timeout
function cleanupOldSessions() {
  const totalSessions = Array.from(sessionsByContext.values()).reduce((sum, set) => sum + set.size, 0);
  
  if (totalSessions > 50) {
    console.warn(`Large number of active sessions detected (${totalSessions}) - consider cleanup`);
  }
}

// Run cleanup periodically
setInterval(cleanupOldSessions, 5 * 60 * 1000); // Every 5 minutes

// Unified header modification using webRequest API
console.log(`Setting up ${ExtensionAPI.browser.name} webRequest header modification`);

ExtensionAPI.webRequest.onHeadersReceived.addListener(
  function(details) {
    try {
      // Only modify headers for sub_frame requests (iframe content)
      if (details.type !== 'sub_frame') {
        return {};
      }

      // Scope by tab and origin
      const contextKey = getContextKeyFromDetails(details);
      if (contextKey == null) {
        return {};
      }
      const requestOrigin = new URL(details.url).origin;
      const set = sessionsByContext.get(contextKey);
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
        console.log(`Modified headers for ${details.url} (removed ${responseHeaders.length - filteredHeaders.length} headers) [context=${contextKey}]`);
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
      const contextKey = getContextKeyFromDetails(details);
      if (contextKey == null) return;
      if (!sessionsByContext.has(contextKey)) return;
      const newOrigin = new URL(details.redirectUrl).origin;
      addOriginForContext(contextKey, newOrigin);
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
          const contextKey = getContextKeyFromSender(sender);
          if (contextKey !== null) {
            addOriginForContext(contextKey, url.origin);
          }
          
          console.log(`Frame bypass enabled for: ${url.origin} (context ${contextKey ?? 'n/a'})`);
          
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
          const contextKey = getContextKeyFromSender(sender);
          if (request.url && typeof request.url === 'string') {
            try {
              const origin = new URL(request.url).origin;
              if (contextKey !== null) {
                removeOriginForContext(contextKey, origin);
              }
            } catch (_) {
              // ignore parse errors
            }
          } else if (contextKey !== null) {
            // If no URL, clear all for context
            clearContext(contextKey);
          }
          
          console.log(`Frame bypass disabled for context ${contextKey ?? 'n/a'}`);
          
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

// Handle extension icon click - prefer native sidebar, fall back to injected overlay when needed
ExtensionAPI.action.onClicked.addListener(async (tab) => {
  console.log('🖱️ Extension button clicked for tab:', tab.id, 'URL:', tab.url);

  const sidebarSupported = ExtensionAPI.sidebarAction?.isSupported;

  if (sidebarSupported) {
    try {
      const opened = await ExtensionAPI.sidebarAction.toggle(tab?.windowId);
      console.log(opened ? '📂 Sidebar opened' : '📁 Sidebar closed');
      return;
    } catch (sidebarError) {
      console.error('Sidebar toggle failed, falling back to injected sidepanel:', sidebarError);
    }
  }
  
  // Don't inject on new tab page (already has embedded panel) or extension/browser pages
  const excludedPrefixes = [
    'moz-extension://', 'about:', 'resource://', 'chrome://'
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
      console.log('   - Page is on a protected browser scheme (about:/chrome:/resource:)');
      console.log('   - Extension lacks necessary permissions');
    }
  }
});
