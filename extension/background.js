// Background service worker for Clean-Browsing extension (cross-browser)
// Minimal cross-browser API wrapper (Chrome/Firefox)
const _api = (typeof browser !== 'undefined') ? browser : (typeof chrome !== 'undefined' ? chrome : undefined);
const _isPromise = (v) => v && typeof v.then === 'function';

// Browser detection
const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getURL;
const isChrome = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL;
const ext = {
  storageGet: async (keys) => {
    if (!_api?.storage?.local?.get) return {};
    const out = _api.storage.local.get(keys);
    return _isPromise(out) ? await out : await new Promise((resolve) => _api.storage.local.get(keys, resolve));
  },
  storageSet: async (obj) => {
    if (!_api?.storage?.local?.set) return;
    const out = _api.storage.local.set(obj);
    return _isPromise(out) ? await out : await new Promise((resolve) => _api.storage.local.set(obj, resolve));
  },
  tabsCreate: async (opts) => {
    const out = _api?.tabs?.create?.(opts);
    return _isPromise(out) ? await out : await new Promise((resolve) => _api.tabs.create(opts, resolve));
  },
  tabsSendMessage: async (tabId, message) => {
    const out = _api?.tabs?.sendMessage?.(tabId, message);
    return _isPromise(out) ? await out : await new Promise((resolve, reject) => {
      try { _api.tabs.sendMessage(tabId, message, resolve); } catch (e) { reject(e); }
    });
  },
  executeScriptSafely: async ({ tabId }, func) => {
    if (_api?.scripting?.executeScript) {
      const out = _api.scripting.executeScript({ target: { tabId }, func });
      return _isPromise(out) ? await out : await new Promise((resolve) => _api.scripting.executeScript({ target: { tabId }, func }, resolve));
    }
    if (_api?.tabs?.executeScript) {
      const code = '(' + func.toString() + ')()';
      const out = _api.tabs.executeScript(tabId, { code });
      return _isPromise(out) ? await out : await new Promise((resolve) => _api.tabs.executeScript(tabId, { code }, resolve));
    }
    throw new Error('No script execution API available');
  },
  actionOnClicked: (handler) => {
    if (_api?.action?.onClicked?.addListener) {
      _api.action.onClicked.addListener(handler);
    } else if (_api?.browserAction?.onClicked?.addListener) {
      _api.browserAction.onClicked.addListener(handler);
    }
  }
};

// Track active sessions for header modification
// Per-tab mapping of allowed origins to modify (Firefox path)
const sessionsByTab = new Map(); // tabId -> Set<string origin>
// Back-compat/global union for Chrome DNR rules
let activeSessions = new Set(); // Set<string origin>

function addOriginForTab(tabId, origin) {
  if (typeof tabId !== 'number' || !origin) return;
  let set = sessionsByTab.get(tabId);
  if (!set) { set = new Set(); sessionsByTab.set(tabId, set); }
  set.add(origin);
  // Maintain global union for Chrome rules
  activeSessions.add(origin);
}

function removeOriginForTab(tabId, origin) {
  if (typeof tabId !== 'number' || !origin) return;
  const set = sessionsByTab.get(tabId);
  if (set) {
    set.delete(origin);
    if (set.size === 0) sessionsByTab.delete(tabId);
  }
  // Rebuild global union; ensures complete accuracy
  const union = new Set();
  for (const s of sessionsByTab.values()) for (const o of s) union.add(o);
  activeSessions = union;
}

// Clean up when tab closes
try {
  _api?.tabs?.onRemoved?.addListener?.((tabId) => {
    if (sessionsByTab.has(tabId)) {
      sessionsByTab.delete(tabId);
      // Rebuild union
      const union = new Set();
      for (const s of sessionsByTab.values()) for (const o of s) union.add(o);
      activeSessions = union;
    }
  });
} catch (_) {}

// Session cleanup - remove old sessions after timeout
function cleanupOldSessions() {
  const now = Date.now();
  const CLEANUP_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  // In the future, we could store timestamps with URLs for better cleanup
  // For now, rely on explicit disable calls
  if (activeSessions.size > 50) {
    console.warn('Large number of active sessions detected - consider cleanup');
  }
}

// Run cleanup periodically
setInterval(cleanupOldSessions, 5 * 60 * 1000); // Every 5 minutes

// Firefox-specific header modification using webRequest API
if (isFirefox && _api.webRequest && _api.webRequest.onHeadersReceived) {
  console.log('Setting up Firefox webRequest header modification');
  
  _api.webRequest.onHeadersReceived.addListener(
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
          console.log(`Firefox: Modified headers for ${details.url} (removed ${responseHeaders.length - filteredHeaders.length} headers)`);
          return { responseHeaders: filteredHeaders };
        }
        
        return {};
      } catch (error) {
        console.error('Firefox: Error in webRequest header modification:', error);
        // Return empty object to avoid breaking the request
        return {};
      }
    },
    { urls: ["<all_urls>"] },
    ["blocking", "responseHeaders"]
  );

  // Follow redirects: if a sub_frame redirects within an active tab session, include the new origin
  try {
    _api.webRequest.onBeforeRedirect.addListener(
      function(details) {
        try {
          if (details.type !== 'sub_frame') return;
          const tabId = details.tabId;
          if (!sessionsByTab.has(tabId)) return;
          const newOrigin = new URL(details.redirectUrl).origin;
          addOriginForTab(tabId, newOrigin);
        } catch (e) {
          // ignore
        }
      },
      { urls: ["<all_urls>"] }
    );
  } catch (_) {}
} else if (isChrome && _api.declarativeNetRequest) {
  console.log('Chrome detected - using declarativeNetRequest for header modification');
  
  // Chrome dynamic rule management for selective header modification
  async function updateChromeRules() {
    try {
      // Get current dynamic rules
      const existingRules = await _api.declarativeNetRequest.getDynamicRules();
      const ruleIdsToRemove = existingRules.map(rule => rule.id);
      
      // Create new rules for active sessions
      const newRules = [];
      let ruleId = 1000; // Start from 1000 to avoid conflicts with static rules
      
      for (const origin of activeSessions) {
        try {
          const urlObj = new URL(origin);
          newRules.push({
            id: ruleId++,
            priority: 1,
            action: {
              type: "modifyHeaders",
              responseHeaders: [
                { header: "X-Frame-Options", operation: "remove" },
                { header: "Content-Security-Policy", operation: "remove" },
                { header: "X-Content-Security-Policy", operation: "remove" },
                { header: "X-Content-Type-Options", operation: "remove" },
                { header: "Permissions-Policy", operation: "remove" },
                { header: "Cross-Origin-Opener-Policy", operation: "remove" },
                { header: "Cross-Origin-Embedder-Policy", operation: "remove" }
              ]
            },
            condition: {
              urlFilter: `${urlObj.origin}/*`,
              resourceTypes: ["sub_frame"]
            }
          });
        } catch (e) {
          console.warn(`Invalid origin for Chrome rules: ${origin}`);
        }
      }
      
      // Update rules
      await _api.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIdsToRemove,
        addRules: newRules
      });
      
      console.log(`Chrome: Updated dynamic rules for ${newRules.length} active sessions`);
    } catch (error) {
      console.error('Chrome: Failed to update dynamic rules:', error);
    }
  }
  
  // Store reference for later use
  window.updateChromeRules = updateChromeRules;
} else {
  console.warn('Unknown browser - header modification may not work');
}

// Listen for messages from the embedded sidepanel and main extension
_api.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'getSidebarSettings') {
      // Get embedded sidepanel settings from storage
      ext.storageGet(['sidebarSettings']).then((result) => {
        sendResponse(result.sidebarSettings || getDefaultSidebarSettings());
      }).catch((error) => {
        console.error('Error getting sidebar settings:', error);
        sendResponse(getDefaultSidebarSettings());
      });
      return true; // Keep message channel open for async response
    } else if (request.action === 'enableFrameBypass') {
      try {
        // Validate URL
        if (!request.url || typeof request.url !== 'string') {
          throw new Error('Invalid URL provided');
        }
        
        // Test URL validity
        const u = new URL(request.url);

        // Enable frame bypass for this tab + origin
        const tabId = sender?.tab?.id;
        if (typeof tabId === 'number') {
          addOriginForTab(tabId, u.origin);
        } else {
          // Fallback: global union for Chrome if no tab context
          activeSessions.add(u.origin);
        }
        const browser = isFirefox ? 'Firefox (webRequest)' : isChrome ? 'Chrome (declarativeNetRequest)' : 'Unknown';
        console.log(`Frame bypass enabled for: ${u.origin} (tab ${sender?.tab?.id ?? 'n/a'}) using ${browser}`);
        
        // Update Chrome dynamic rules if available
        if (isChrome && window.updateChromeRules) {
          window.updateChromeRules().catch(e => {
            console.error('Failed to update Chrome rules:', e);
            // Don't fail the entire request if Chrome rule update fails
          });
        }
        
        sendResponse({ 
          success: true, 
          browser: browser,
          method: isFirefox ? 'webRequest' : 'declarativeNetRequest'
        });
      } catch (error) {
        console.error('Error enabling frame bypass:', error);
        sendResponse({ 
          success: false, 
          error: error.message,
          fallback: 'URL will open in new tab instead'
        });
      }
    } else if (request.action === 'disableFrameBypass') {
      try {
        const tabId = sender?.tab?.id;
        if (request.url && typeof request.url === 'string') {
          try {
            const origin = new URL(request.url).origin;
            if (typeof tabId === 'number') {
              removeOriginForTab(tabId, origin);
            } else {
              // Fallback global cleanup
              activeSessions.delete(origin);
            }
          } catch (_) {
            // ignore parse errors
          }
        } else if (typeof tabId === 'number') {
          // If no URL, clear all for tab
          sessionsByTab.delete(tabId);
          // Rebuild union
          const union = new Set();
          for (const s of sessionsByTab.values()) for (const o of s) union.add(o);
          activeSessions = union;
        }
        const browser = isFirefox ? 'Firefox (webRequest)' : isChrome ? 'Chrome (declarativeNetRequest)' : 'Unknown';
        console.log(`Frame bypass disabled for tab ${tabId ?? 'n/a'}`);
        
        // Update Chrome dynamic rules if available
        if (isChrome && window.updateChromeRules) {
          window.updateChromeRules().catch(e => {
            console.error('Failed to update Chrome rules:', e);
            // Don't fail the entire request if Chrome rule update fails
          });
        }
        
        sendResponse({ 
          success: true, 
          browser: browser,
          method: isFirefox ? 'webRequest' : 'declarativeNetRequest'
        });
      } catch (error) {
        console.error('Error disabling frame bypass:', error);
        sendResponse({ 
          success: false, 
          error: error.message
        });
      }
    } else if (request.action === 'saveSidebarSettings') {
      // Save sidebar settings to storage
      ext.storageSet({ sidebarSettings: request.settings }).then(() => {
        console.log('Sidebar settings saved');
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('Error saving sidebar settings:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    } else if (request.action === 'openInNewTab') {
      try {
        // Validate URL
        if (!request.url || typeof request.url !== 'string') {
          throw new Error('Invalid URL provided');
        }
        
        // Test URL validity
        new URL(request.url);
        
        // Open URL in new tab
        ext.tabsCreate({ url: request.url });
        sendResponse({ success: true });
      } catch (error) {
        console.error('Error opening URL in new tab:', error);
        sendResponse({ success: false, error: error.message });
      }
    } else {
      console.warn('Unknown message action:', request.action);
      sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error in message listener:', error);
    sendResponse({ success: false, error: 'Internal error' });
  }
});

// Default sidepanel settings
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
        openMode: 'iframe',  // Try iframe first for all sites
        position: 0
      },
      {
        id: 'archive',
        name: 'Internet Archive',
        url: 'https://archive.org',
        icon: '📁',
        favicon: 'https://archive.org/favicon.ico',
        openMode: 'iframe',  // Try iframe first for all sites
        position: 1
      },
      {
        id: 'chatgpt',
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        icon: '🤖',
        favicon: 'https://chat.openai.com/favicon.ico',
        openMode: 'iframe',  // Try iframe first, will auto-fallback if blocked
        position: 2
      },
      {
        id: 'claude',
        name: 'Claude',
        url: 'https://claude.ai',
        icon: '🧠',
        favicon: 'https://claude.ai/favicon.ico',
        openMode: 'iframe',  // Try iframe first, will auto-fallback if blocked
        position: 3
      },
      {
        id: 'github',
        name: 'GitHub',
        url: 'https://github.com',
        icon: '💻',
        favicon: 'https://github.com/favicon.ico',
        openMode: 'iframe',  // Try iframe first, will auto-fallback if blocked
        position: 4
      }
    ],
    sidebarBehavior: {
      autoClose: false,
      defaultOpenMode: 'iframe',
      showIcons: true,
      compactMode: false,
      useFavicons: false,  // Default to emojis, user can enable favicons
      showUrls: false      // Default to showing only names
    }
  };
}

// Handle extension icon click - inject embedded sidepanel on non-newtab pages
ext.actionOnClicked(async (tab) => {
  console.log('🖱️ Extension button clicked for tab:', tab.id, 'URL:', tab.url);
  
  // Don't inject on new tab page (already has embedded panel) or extension/browser pages
  const excludedPrefixes = ['chrome-extension://', 'chrome://', 'edge://', 'about:', 'moz-extension://'];
  const isExcludedUrl = excludedPrefixes.some(prefix => tab.url?.startsWith(prefix));
  
  if (!tab.url || isExcludedUrl) {
    console.log('⏭️ Skipping sidepanel injection for excluded URL:', tab.url);
    return;
  }
  
  try {
    // Check if content script is already injected by trying to send a message
    console.log('📨 Sending toggle message to content script...');
    
    const response = await ext.tabsSendMessage(tab.id, { action: 'toggleSidepanel' });
    console.log('✅ Sidepanel toggle successful:', response);
    
  } catch (error) {
    console.log('❌ Content script not responding:', error.message);
    console.log('🔧 This likely means the content script failed to inject or the page has restrictive CSP');
    
    // Additional debugging - check if we can inject scripts
    try {
      const results = await ext.executeScriptSafely({ tabId: tab.id }, () => {
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
