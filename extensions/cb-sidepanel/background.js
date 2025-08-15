// Background service worker for sidepanel panel management
// Initialize sidepanel behavior based on user settings
initializeSidepanelBehavior();

// Track active sidepanel sessions for header modification
let activeSidepanelSessions = new Set();

async function initializeSidepanelBehavior() {
  try {
    // Check if sidepanel is enabled in settings
    const result = await chrome.storage.local.get(['sidepanel_settings']);
    const settings = result.sidepanel_settings || getDefaultSidepanelSettings();
    
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
    chrome.storage.local.get(['sidepanel_settings'], (result) => {
      sendResponse(result.sidepanel_settings || getDefaultSidepanelSettings());
    });
    return true; // Keep message channel open for async response
  } else if (request.action === 'enableFrameBypass') {
    // Enable frame bypass for a specific URL
    activeSidepanelSessions.add(request.url);
    console.log('Frame bypass enabled for:', request.url);
    sendResponse({ success: true });
  } else if (request.action === 'disableFrameBypass') {
    // Disable frame bypass for a specific URL
    activeSidepanelSessions.delete(request.url);
    console.log('Frame bypass disabled for:', request.url);
    sendResponse({ success: true });
  } else if (request.action === 'saveSidebarSettings') {
    // Save sidepanel settings to storage
    chrome.storage.local.set({ sidepanel_settings: request.settings }, () => {
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

// Use minimal fallback settings for background script
// Note: Background scripts can't easily load shared modules, so we keep a minimal fallback
function getDefaultSidepanelSettings() {
  return {
    sidebarEnabled: true,
    sidebarWebsites: [],
    sidebarBehavior: {
      autoClose: false,
      compactMode: false,
      showUrls: false
    },
    appearance: {
      backgroundType: 'gradient',
      backgroundSettings: {
        color1: '#667eea',
        color2: '#764ba2',
        angle: 135
      }
    }
  };
}