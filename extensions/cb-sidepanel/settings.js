// CB-Sidepanel Settings Management
// Uses shared storage components for consistency

// Note: sidebarSettings is declared in sidepanel.js to avoid duplicate declaration

// Wait for dependencies to be ready with timeout and retry logic
function waitForDependencies() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 500; // 5 seconds total (10ms * 500)
    
    function checkDependencies() {
      attempts++;
      
      if (window.DefaultSettings && window.StorageManager) {
        console.log('Sidepanel dependencies loaded successfully after', attempts, 'attempts');
        resolve();
      } else if (attempts >= maxAttempts) {
        console.error('Sidepanel dependencies failed to load after', maxAttempts, 'attempts. Available:', {
          DefaultSettings: !!window.DefaultSettings,
          StorageManager: !!window.StorageManager
        });
        // Don't reject, resolve anyway to allow fallback behavior
        resolve();
      } else {
        // Check again in 10ms
        setTimeout(checkDependencies, 10);
      }
    }
    checkDependencies();
  });
}

// Load sidepanel settings using shared storage manager
async function loadSidebarSettings() {
  // Ensure dependencies are ready
  await waitForDependencies();
  
  if (window.StorageManager) {
    return await StorageManager.loadSidepanelSettings();
  } else {
    // Fallback: communicate with background script
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getSidebarSettings' }, (response) => {
        resolve(response || window.DefaultSettings.getDefaultSidepanelSettings());
      });
    });
  }
}

// Save sidepanel settings using shared storage manager
async function saveSidebarSettings(settings = sidebarSettings) {
  // Ensure dependencies are ready
  await waitForDependencies();
  
  if (window.StorageManager) {
    await StorageManager.saveSidepanelSettings(settings);
  } else {
    // Fallback: communicate with background script
    chrome.runtime.sendMessage({ 
      action: 'saveSidebarSettings', 
      settings: settings 
    });
  }
}

// Initialize sidepanel settings
async function initializeSidebarSettings() {
  sidebarSettings = await loadSidebarSettings();
  return sidebarSettings;
}

// Export functions for use by sidepanel.js
window.SidebarSettingsManager = {
  loadSidebarSettings,
  saveSidebarSettings,
  initializeSidebarSettings
};