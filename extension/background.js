// Background service worker for sidepanel panel management
// Initialize sidepanel behavior based on user settings
initializeSidepanelBehavior();

async function initializeSidepanelBehavior() {
  try {
    // Check if sidepanel is enabled in settings
    const result = await chrome.storage.local.get(['sidebarSettings']);
    const settings = result.sidebarSettings || getDefaultSidebarSettings();
    
    const isEnabled = settings.sidebarEnabled !== false; // Default to true if not set
    
    // Only enable panel behavior if user has it enabled
    if (isEnabled) {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
      console.log('Sidepanel enabled');
    } else {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
      console.log('Sidepanel disabled by user settings');
    }
  } catch (error) {
    console.error('Error initializing sidepanel behavior:', error);
    // Fallback to enabled if there's an error
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
}

// Listen for messages from the sidepanel and main extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSidebarSettings') {
    // Get sidepanel settings from storage
    chrome.storage.local.get(['sidebarSettings'], (result) => {
      sendResponse(result.sidebarSettings || getDefaultSidebarSettings());
    });
    return true; // Keep message channel open for async response
  } else if (request.action === 'saveSidebarSettings') {
    // Save sidepanel settings to storage
    chrome.storage.local.set({ sidebarSettings: request.settings }, () => {
      // Update sidepanel behavior when settings change
      const isEnabled = request.settings.sidebarEnabled !== false;
      try {
        if (isEnabled) {
          chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
          console.log('Sidepanel enabled');
        } else {
          chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
          console.log('Sidepanel disabled');
        }
      } catch (error) {
        console.error('Error updating sidepanel behavior:', error);
      }
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