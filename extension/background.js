// Background service worker for sidebar panel management
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Listen for messages from the sidebar and main extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSidebarSettings') {
    // Get sidebar settings from storage
    chrome.storage.local.get(['sidebarSettings'], (result) => {
      sendResponse(result.sidebarSettings || getDefaultSidebarSettings());
    });
    return true; // Keep message channel open for async response
  } else if (request.action === 'saveSidebarSettings') {
    // Save sidebar settings to storage
    chrome.storage.local.set({ sidebarSettings: request.settings }, () => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'openInNewTab') {
    // Open URL in new tab
    chrome.tabs.create({ url: request.url });
    sendResponse({ success: true });
  }
});

// Default sidebar settings
function getDefaultSidebarSettings() {
  return {
    sidebarEnabled: true,
    sidebarWebsites: [
      {
        id: 'wikipedia',
        name: 'Wikipedia',
        url: 'https://en.wikipedia.org',
        icon: '📚',
        openMode: 'iframe',  // Try iframe first for all sites
        position: 0
      },
      {
        id: 'archive',
        name: 'Internet Archive',
        url: 'https://archive.org',
        icon: '📁',
        openMode: 'iframe',  // Try iframe first for all sites
        position: 1
      },
      {
        id: 'chatgpt',
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        icon: '🤖',
        openMode: 'iframe',  // Try iframe first, will auto-fallback if blocked
        position: 2
      },
      {
        id: 'claude',
        name: 'Claude',
        url: 'https://claude.ai',
        icon: '🧠',
        openMode: 'iframe',  // Try iframe first, will auto-fallback if blocked
        position: 3
      },
      {
        id: 'github',
        name: 'GitHub',
        url: 'https://github.com',
        icon: '💻',
        openMode: 'iframe',  // Try iframe first, will auto-fallback if blocked
        position: 4
      }
    ],
    sidebarBehavior: {
      autoClose: false,
      defaultOpenMode: 'iframe',
      showIcons: true,
      compactMode: false
    }
  };
}