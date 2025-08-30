// Background service worker for Clean-Browsing extension
// Track active sessions for header modification
let activeSessions = new Set();

// Listen for messages from the embedded sidepanel and main extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSidebarSettings') {
    // Get embedded sidepanel settings from storage
    chrome.storage.local.get(['sidebarSettings'], (result) => {
      sendResponse(result.sidebarSettings || getDefaultSidebarSettings());
    });
    return true; // Keep message channel open for async response
  } else if (request.action === 'enableFrameBypass') {
    // Enable frame bypass for a specific URL
    activeSessions.add(request.url);
    console.log('Frame bypass enabled for:', request.url);
    sendResponse({ success: true });
  } else if (request.action === 'disableFrameBypass') {
    // Disable frame bypass for a specific URL
    activeSessions.delete(request.url);
    console.log('Frame bypass disabled for:', request.url);
    sendResponse({ success: true });
  } else if (request.action === 'saveSidebarSettings') {
    // Save sidebar settings to storage
    chrome.storage.local.set({ sidebarSettings: request.settings }, () => {
      console.log('Sidebar settings saved');
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'openInNewTab') {
    // Open URL in new tab
    chrome.tabs.create({ url: request.url });
    sendResponse({ success: true });
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
chrome.action.onClicked.addListener(async (tab) => {
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
    
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleSidepanel' });
    console.log('✅ Sidepanel toggle successful:', response);
    
  } catch (error) {
    console.log('❌ Content script not responding:', error.message);
    console.log('🔧 This likely means the content script failed to inject or the page has restrictive CSP');
    
    // Additional debugging - check if we can inject scripts
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            url: window.location.href,
            hasCleanBrowsingContainer: !!document.getElementById('clean-browsing-sidepanel-overlay'),
            documentReady: document.readyState,
            cspHeaders: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || 'none'
          };
        }
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