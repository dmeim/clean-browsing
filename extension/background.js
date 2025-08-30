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