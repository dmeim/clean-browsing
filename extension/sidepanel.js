// Sidepanel panel JavaScript
let sidebarSettings = null;
let currentWebsiteUrl = null;
let currentBackgroundImage = null;

// Utility function to get favicon URL from a website URL
function getFaviconUrl(websiteUrl) {
  try {
    const url = new URL(websiteUrl);
    return `${url.protocol}//${url.hostname}/favicon.ico`;
  } catch (e) {
    return null;
  }
}

// Utility function to get website icon (favicon, emoji, or none)
function getWebsiteIcon(website) {
  if (website.iconType === 'none') {
    return '';
  } else if (website.iconType === 'favicon' && website.favicon) {
    return `<div class="website-icon-wrapper">
              <img src="${website.favicon}" alt="" class="website-favicon" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <span class="website-icon" style="display:none">${website.icon || '🌐'}</span>
            </div>`;
  } else if (website.iconType === 'emoji' || !website.iconType) {
    return `<span class="website-icon">${website.icon || '🌐'}</span>`;
  }
  return '';
}

// Initialize sidepanel on load
document.addEventListener('DOMContentLoaded', initializeSidepanel);

// Listen for messages from iframe content scripts
window.addEventListener('message', (event) => {
  if (!event.data) return;

  // Handle URL change messages
  if (event.data.type === 'SIDEPANEL_URL_CHANGE') {
    const newUrl = event.data.url;
    
    if (newUrl) {
      console.log('URL change detected from content script:', currentWebsiteUrl, '→', newUrl);
      
      // Always update the current URL, even if it seems the same
      // This ensures we capture all navigation events
      currentWebsiteUrl = newUrl;
      lastKnownUrl = newUrl;
      
      // Update the display
      const iframeCurrentUrl = document.getElementById('iframe-current-url');
      if (iframeCurrentUrl && !iframeCurrentUrl.classList.contains('hidden')) {
        iframeCurrentUrl.textContent = newUrl;
        iframeCurrentUrl.title = 'Click to copy: ' + newUrl;
        iframeCurrentUrl.className = 'iframe-current-url';
        setupUrlClickHandler(iframeCurrentUrl, newUrl);
      }
    }
  }
  
  // Handle navigation state updates
  else if (event.data.type === 'SIDEPANEL_NAVIGATION_STATE') {
    navigationState.canGoBack = event.data.canGoBack || false;
    navigationState.canGoForward = event.data.canGoForward || false;
    updateNavigationButtons();
    console.log('Navigation state updated:', navigationState);
  }
  
  // Handle navigation results
  else if (event.data.type === 'SIDEPANEL_NAVIGATION_RESULT') {
    const requestId = event.data.requestId;
    const success = event.data.success;
    const command = event.data.command;
    const reason = event.data.reason;
    
    if (pendingNavigationRequests.has(requestId)) {
      pendingNavigationRequests.delete(requestId);
      
      if (success) {
        console.log(`Navigation ${command} succeeded`);
        // Request updated navigation state after successful navigation
        setTimeout(requestNavigationState, 200);
      } else {
        console.log(`Navigation ${command} failed:`, reason);
      }
    }
  }
});

async function initializeSidepanel() {
  // Load settings from background script
  sidebarSettings = await loadSidebarSettings();
  
  // Render website list
  renderWebsiteList();
  
  // Set up event listeners
  setupEventListeners();
  
  // Apply behavior settings
  applyBehaviorSettings();
  
  // Load and apply appearance settings
  loadAppearanceSettings();
}

// Load settings from main extension settings first, then fallback to background script
function loadSidebarSettings() {
  return new Promise((resolve) => {
    // First try to load from main extension settings (localStorage)
    try {
      const mainSettings = JSON.parse(localStorage.getItem('settings') || '{}');
      if (mainSettings.sidebarSettings && mainSettings.sidebarSettings.sidebarWebsites) {
        console.log('Loading sidepanel settings from main settings');
        resolve(mainSettings.sidebarSettings);
        return;
      }
    } catch (e) {
      console.log('Could not load from main settings, trying background script:', e);
    }
    
    // Fallback to background script storage
    chrome.runtime.sendMessage({ action: 'getSidebarSettings' }, (response) => {
      console.log('Loading sidepanel settings from background script');
      resolve(response);
    });
  });
}

// Save settings to background script and sync with main extension settings
function saveSidebarSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ 
      action: 'saveSidebarSettings', 
      settings: sidebarSettings 
    }, (response) => {
      // Also sync with main extension settings in localStorage for export/import
      try {
        const mainSettings = JSON.parse(localStorage.getItem('settings') || '{}');
        mainSettings.sidebarSettings = sidebarSettings;
        localStorage.setItem('settings', JSON.stringify(mainSettings));
      } catch (e) {
        console.log('Could not sync with main settings:', e);
      }
      resolve(response);
    });
  });
}

// Render the website list
function renderWebsiteList() {
  const websiteList = document.getElementById('website-list');
  websiteList.innerHTML = '';
  
  // Sort websites by position
  const sortedWebsites = [...sidebarSettings.sidebarWebsites].sort((a, b) => a.position - b.position);
  
  sortedWebsites.forEach(website => {
    const websiteItem = createWebsiteItem(website);
    websiteList.appendChild(websiteItem);
  });
  
  // Add empty state if no websites
  if (sortedWebsites.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <p>No websites added yet</p>
      <p class="hint">Click the settings icon to add websites</p>
    `;
    websiteList.appendChild(emptyState);
  }
}

// Create a website item element
function createWebsiteItem(website) {
  const item = document.createElement('div');
  item.className = 'website-item';
  if (sidebarSettings.sidebarBehavior.compactMode) {
    item.classList.add('compact');
  }
  
  const icon = getWebsiteIcon(website);
  const showUrls = sidebarSettings.sidebarBehavior.showUrls;
  
  // Add class when URLs are shown for proper icon sizing
  if (showUrls) {
    item.classList.add('show-urls');
  }
  
  item.innerHTML = `
    ${icon}
    <div class="website-info">
      <span class="website-name">${website.name}</span>
      ${showUrls ? `<span class="website-url">${website.url}</span>` : ''}
    </div>
  `;
  
  item.addEventListener('click', () => openWebsite(website));
  
  return item;
}

// Open a website based on its mode
function openWebsite(website) {
  switch (website.openMode) {
    case 'iframe':
      openInIframe(website);
      break;
    case 'newtab':
      chrome.tabs.create({ url: website.url });
      if (sidebarSettings.sidebarBehavior.autoClose) {
        window.close();
      }
      break;
    case 'newwindow':
      chrome.windows.create({ url: website.url });
      if (sidebarSettings.sidebarBehavior.autoClose) {
        window.close();
      }
      break;
    case 'privatetab':
      chrome.windows.create({ 
        url: website.url, 
        incognito: true 
      });
      if (sidebarSettings.sidebarBehavior.autoClose) {
        window.close();
      }
      break;
    case 'privatewindow':
      chrome.windows.create({ 
        url: website.url, 
        incognito: true,
        type: 'normal'
      });
      if (sidebarSettings.sidebarBehavior.autoClose) {
        window.close();
      }
      break;
    default:
      // Fallback to new tab
      chrome.tabs.create({ url: website.url });
      if (sidebarSettings.sidebarBehavior.autoClose) {
        window.close();
      }
      break;
  }
}

// Open website in iframe
async function openInIframe(website) {
  const websiteList = document.getElementById('website-list');
  const iframeContainer = document.getElementById('iframe-container');
  const iframe = document.getElementById('website-iframe');
  const iframeTitle = document.getElementById('iframe-title');
  const iframeCurrentUrl = document.getElementById('iframe-current-url');
  
  // Hide website list, show iframe
  websiteList.classList.add('hidden');
  iframeContainer.classList.remove('hidden');
  
  // Set title and initialize current URL
  iframeTitle.textContent = website.name;
  iframeCurrentUrl.textContent = website.url;
  iframeCurrentUrl.title = 'Click to copy: ' + website.url;
  iframeCurrentUrl.className = 'iframe-current-url';
  currentWebsiteUrl = website.url;
  
  // Set up click handler for URL copying
  setupUrlClickHandler(iframeCurrentUrl, website.url);
  
  // Enable frame bypass for this URL
  await chrome.runtime.sendMessage({ 
    action: 'enableFrameBypass', 
    url: website.url 
  });
  
  // Add a small delay to ensure header rules are active
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Clear any existing handlers
  iframe.onerror = null;
  iframe.onload = null;
  
  // State tracking
  let loadTimeout;
  
  // Handle network errors (DNS failures, connection refused, etc.)
  iframe.onerror = () => {
    clearTimeout(loadTimeout);
    console.log(`Network error loading ${website.name}`);
    handleIframeError(website, 'network_error');
  };
  
  // Handle successful loads
  iframe.onload = () => {
    clearTimeout(loadTimeout);
    console.log(`Successfully loaded ${website.name} in iframe`);
    
    // Enable URL tracking in the iframe content script
    // Send multiple times to ensure the message is received
    const enableTracking = () => {
      try {
        iframe.contentWindow.postMessage({
          type: 'SIDEPANEL_ENABLE_TRACKING',
          enabled: true
        }, '*');
      } catch (e) {
        console.log('Could not enable tracking in iframe (CORS expected)');
      }
    };
    
    // Send immediately and after delays to ensure content script receives it
    enableTracking();
    setTimeout(enableTracking, 500);
    setTimeout(enableTracking, 1500);
    setTimeout(enableTracking, 3000);
    
    // Request navigation state after iframe loads
    setTimeout(() => {
      requestNavigationState();
    }, 2000);
  };
  
  // Set a reasonable timeout for slow-loading sites
  loadTimeout = setTimeout(() => {
    console.log(`Timeout loading ${website.name}`);
    handleIframeError(website, 'timeout');
  }, 10000); // 10 seconds for slow sites
  
  // Load the URL
  iframe.src = website.url;
  
  // Start URL tracking with simplified approach
  startUrlTracking(iframe, iframeCurrentUrl);
}

// URL tracking variables
let urlTrackingInterval = null;
let lastKnownUrl = null;
let navigationCheckInterval = null;

// Navigation state tracking
let navigationState = {
  canGoBack: false,
  canGoForward: false
};
let pendingNavigationRequests = new Map();

// Start tracking URL changes in iframe (enhanced approach)
function startUrlTracking(iframe, urlElement) {
  // Stop any existing tracking
  stopUrlTracking();
  
  // Initial URL from iframe src
  lastKnownUrl = iframe.src;
  currentWebsiteUrl = iframe.src;
  
  // Enable tracking message sending to content script periodically
  const enableTrackingPeriodically = () => {
    try {
      iframe.contentWindow.postMessage({
        type: 'SIDEPANEL_ENABLE_TRACKING',
        enabled: true
      }, '*');
    } catch (e) {
      // Expected for CORS
    }
  };
  
  // Send enable message periodically to ensure content script stays active
  navigationCheckInterval = setInterval(enableTrackingPeriodically, 5000);
  
  // Set up iframe load event detection to update the display
  const originalOnload = iframe.onload;
  iframe.onload = () => {
    console.log('Iframe navigation detected via onload, src:', iframe.src);
    if (originalOnload) originalOnload();
    
    // Update the URL immediately when iframe loads
    if (iframe.src && iframe.src !== 'about:blank') {
      currentWebsiteUrl = iframe.src;
      lastKnownUrl = iframe.src;
      urlElement.textContent = iframe.src;
      urlElement.title = 'Click to copy: ' + iframe.src;
      urlElement.className = 'iframe-current-url';
      setupUrlClickHandler(urlElement, iframe.src);
    }
    
    // Re-enable tracking after navigation
    setTimeout(enableTrackingPeriodically, 100);
    setTimeout(enableTrackingPeriodically, 500);
    
    // Try to set up enhanced navigation tracking
    setupEnhancedNavTracking(iframe, urlElement);
  };
  
  // Periodic check to ensure currentWebsiteUrl stays in sync 
  urlTrackingInterval = setInterval(() => {
    updateCurrentUrl(iframe, urlElement);
  }, 2000); // Check every 2 seconds
  
  // Additional navigation monitoring using various detection methods
  setupNavigationDetection(iframe, urlElement);
}

// Enhanced navigation tracking for same-origin or permissive sites
function setupEnhancedNavTracking(iframe, urlElement) {
  try {
    // Try to access the iframe's window object (works for same-origin)
    if (iframe.contentWindow) {
      // Monitor hash changes
      const originalHashchange = iframe.contentWindow.onhashchange;
      iframe.contentWindow.onhashchange = () => {
        if (originalHashchange) originalHashchange();
        setTimeout(() => updateCurrentUrl(iframe, urlElement), 100);
      };
      
      // Monitor popstate events (back/forward navigation)
      const originalPopstate = iframe.contentWindow.onpopstate;
      iframe.contentWindow.onpopstate = () => {
        if (originalPopstate) originalPopstate();
        setTimeout(() => updateCurrentUrl(iframe, urlElement), 100);
      };
    }
  } catch (e) {
    // CORS prevents access - this is expected for most external sites
    console.log('Enhanced navigation tracking blocked by CORS (expected for external sites)');
  }
}

// Set up multiple navigation detection methods
function setupNavigationDetection(iframe, urlElement) {
  // Monitor iframe attribute changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
        console.log('Iframe src changed via mutation observer');
        setTimeout(() => updateCurrentUrl(iframe, urlElement), 200);
      }
    });
  });
  
  observer.observe(iframe, {
    attributes: true,
    attributeFilter: ['src']
  });
  
  // Store observer reference for cleanup
  iframe._urlMutationObserver = observer;
}

// Update the current URL display (enhanced and reliable)
function updateCurrentUrl(iframe, urlElement) {
  try {
    let displayUrl = currentWebsiteUrl || iframe.src;
    let urlSource = 'cached';
    
    // Try multiple methods to get the most current URL
    
    // Method 1: Try to get actual current URL for same-origin content 
    try {
      if (iframe.contentWindow && iframe.contentWindow.location && 
          iframe.contentWindow.location.href && 
          iframe.contentWindow.location.href !== 'about:blank') {
        displayUrl = iframe.contentWindow.location.href;
        urlSource = 'contentWindow';
      }
    } catch (e) {
      // CORS blocked - this is expected for most external sites
    }
    
    // Method 2: Check iframe src (reliable for initial load)
    if (iframe.src && (!displayUrl || displayUrl === 'about:blank')) {
      displayUrl = iframe.src;
      urlSource = 'iframe.src';
    }
    
    // Method 3: Use stored currentWebsiteUrl as fallback
    if (!displayUrl || displayUrl === 'about:blank') {
      displayUrl = currentWebsiteUrl || lastKnownUrl;
      urlSource = 'fallback';
    }
    
    // Ensure we have a valid URL to display
    if (!displayUrl || displayUrl === 'about:blank') {
      urlElement.textContent = 'Loading...';
      urlElement.title = 'Loading website...';
      urlElement.className = 'iframe-current-url unavailable';
      removeUrlClickHandler(urlElement);
      return;
    }
    
    // Only update if URL actually changed to reduce noise
    if (displayUrl !== lastKnownUrl) {
      console.log(`URL updated (${urlSource}):`, lastKnownUrl, '→', displayUrl);
      currentWebsiteUrl = displayUrl;
      lastKnownUrl = displayUrl;
      
      // Update the display
      urlElement.textContent = displayUrl;
      urlElement.title = 'Click to copy: ' + displayUrl;
      urlElement.className = 'iframe-current-url';
      setupUrlClickHandler(urlElement, displayUrl);
    }
    
  } catch (error) {
    console.log('Error updating current URL:', error);
    urlElement.textContent = 'Error loading URL';
    urlElement.title = 'Unable to determine current URL';
    urlElement.className = 'iframe-current-url unavailable';
    removeUrlClickHandler(urlElement);
  }
}

// Stop URL tracking
function stopUrlTracking() {
  // Clear intervals
  if (urlTrackingInterval) {
    clearInterval(urlTrackingInterval);
    urlTrackingInterval = null;
  }
  
  if (navigationCheckInterval) {
    clearInterval(navigationCheckInterval);
    navigationCheckInterval = null;
  }
  
  // Clean up mutation observer
  const iframe = document.getElementById('website-iframe');
  if (iframe && iframe._urlMutationObserver) {
    iframe._urlMutationObserver.disconnect();
    delete iframe._urlMutationObserver;
  }
  
  // Reset tracking variables
  lastKnownUrl = null;
}

// Set up click handler for URL copying
function setupUrlClickHandler(urlElement, url) {
  // Remove any existing handler
  removeUrlClickHandler(urlElement);
  
  // Create new handler
  const clickHandler = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(url);
      
      // Show visual feedback
      const originalClass = urlElement.className;
      const originalText = urlElement.textContent;
      
      urlElement.className = 'iframe-current-url copied';
      urlElement.textContent = 'Copied!';
      
      // Restore after brief delay
      setTimeout(() => {
        urlElement.className = originalClass;
        urlElement.textContent = originalText;
      }, 1000);
      
    } catch (error) {
      console.log('Failed to copy URL:', error);
      
      // Show error feedback
      const originalClass = urlElement.className;
      const originalText = urlElement.textContent;
      
      urlElement.textContent = 'Copy failed';
      
      setTimeout(() => {
        urlElement.className = originalClass;
        urlElement.textContent = originalText;
      }, 1000);
    }
  };
  
  urlElement.addEventListener('click', clickHandler);
  urlElement._urlClickHandler = clickHandler; // Store reference for cleanup
}

// Remove click handler for URL copying
function removeUrlClickHandler(urlElement) {
  if (urlElement._urlClickHandler) {
    urlElement.removeEventListener('click', urlElement._urlClickHandler);
    delete urlElement._urlClickHandler;
  }
}

// Navigation control functions
function navigateIframe(command) {
  const iframe = document.getElementById('website-iframe');
  if (!iframe || !iframe.src || iframe.src === 'about:blank') {
    console.log('No iframe content available for navigation');
    return;
  }

  // Handle refresh differently - reload iframe from parent context
  if (command === 'refresh') {
    const refreshBtn = document.getElementById('nav-refresh');
    refreshBtn.classList.add('refreshing');
    
    // For refresh, we reload the iframe src directly
    const currentSrc = iframe.src;
    iframe.src = 'about:blank';
    setTimeout(() => {
      iframe.src = currentSrc;
      setTimeout(() => {
        refreshBtn.classList.remove('refreshing');
      }, 1000);
    }, 100);
    return;
  }

  // For back/forward, send command to content script
  const requestId = 'nav_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  // Store the request to track completion
  pendingNavigationRequests.set(requestId, {
    command: command,
    timestamp: Date.now()
  });

  // Send navigation command to iframe content script
  try {
    iframe.contentWindow.postMessage({
      type: 'SIDEPANEL_NAVIGATE',
      command: command,
      requestId: requestId
    }, '*');

    console.log(`Sent navigation command: ${command} with requestId: ${requestId}`);
  } catch (e) {
    console.log('Failed to send navigation command to iframe:', e);
    pendingNavigationRequests.delete(requestId);
  }

  // Cleanup request after timeout
  setTimeout(() => {
    if (pendingNavigationRequests.has(requestId)) {
      console.log(`Navigation request ${requestId} timed out`);
      pendingNavigationRequests.delete(requestId);
    }
  }, 5000);
}

// Update navigation button states
function updateNavigationButtons() {
  const backBtn = document.getElementById('nav-back');
  const forwardBtn = document.getElementById('nav-forward');
  
  if (backBtn) {
    backBtn.disabled = !navigationState.canGoBack;
  }
  
  if (forwardBtn) {
    forwardBtn.disabled = !navigationState.canGoForward;
  }
}

// Request navigation state from iframe content script
function requestNavigationState() {
  const iframe = document.getElementById('website-iframe');
  if (!iframe || !iframe.src || iframe.src === 'about:blank') {
    return;
  }

  try {
    iframe.contentWindow.postMessage({
      type: 'SIDEPANEL_GET_NAVIGATION_STATE'
    }, '*');
  } catch (e) {
    console.log('Failed to request navigation state from iframe:', e);
  }
}

// Handle iframe loading errors
function handleIframeError(website, errorType = 'unknown') {
  console.log(`${website.name} cannot be embedded (${errorType}), opening in new tab instead`);
  
  // Stop URL tracking when there's an error
  stopUrlTracking();
  
  // Open in new tab
  chrome.runtime.sendMessage({ 
    action: 'openInNewTab', 
    url: website.url 
  });
  
  // DO NOT permanently change the openMode - just fallback this time
  // This prevents permanent mode switching from temporary issues or false positives
  // Users can still try iframe mode again later
  
  // Show a brief notification with more helpful messaging
  const iframeTitle = document.getElementById('iframe-title');
  const iframeCurrentUrl = document.getElementById('iframe-current-url');
  if (iframeTitle) {
    const originalText = iframeTitle.textContent;
    
    let errorMessage;
    switch (errorType) {
      case 'network_error':
        errorMessage = 'Connection failed - opening in tab...';
        break;
      case 'frame_blocked':
        errorMessage = 'Site blocks embedding - opening in tab...';
        break;
      case 'timeout':
        errorMessage = 'Site unavailable - opening in tab...';
        break;
      default:
        errorMessage = 'Cannot embed - opening in tab...';
    }
    
    iframeTitle.textContent = errorMessage;
    if (iframeCurrentUrl) {
      iframeCurrentUrl.textContent = 'Error occurred';
    }
    
    setTimeout(() => {
      iframeTitle.textContent = originalText;
      backToList();
    }, 2500); // Show message longer for better readability
  } else {
    backToList();
  }
  
  // Optionally close sidepanel if auto-close is enabled
  if (sidebarSettings.sidebarBehavior.autoClose) {
    setTimeout(() => {
      window.close();
    }, 2500);
  }
}

// Back to website list
async function backToList() {
  const websiteList = document.getElementById('website-list');
  const iframeContainer = document.getElementById('iframe-container');
  const iframe = document.getElementById('website-iframe');
  const iframeCurrentUrl = document.getElementById('iframe-current-url');
  
  // Stop URL tracking
  stopUrlTracking();
  
  // Clean up URL click handler
  if (iframeCurrentUrl) {
    removeUrlClickHandler(iframeCurrentUrl);
  }
  
  // Disable tracking in iframe content script
  try {
    iframe.contentWindow.postMessage({
      type: 'SIDEPANEL_ENABLE_TRACKING',
      enabled: false
    }, '*');
  } catch (e) {
    // Expected for CORS protected content
  }
  
  // Disable frame bypass if we had a URL loaded
  if (currentWebsiteUrl) {
    await chrome.runtime.sendMessage({ 
      action: 'disableFrameBypass', 
      url: currentWebsiteUrl 
    });
  }
  
  // Show website list, hide iframe
  websiteList.classList.remove('hidden');
  iframeContainer.classList.add('hidden');
  
  // Clear iframe
  iframe.src = '';
  currentWebsiteUrl = null;
  
  // Reset navigation state
  navigationState.canGoBack = false;
  navigationState.canGoForward = false;
  updateNavigationButtons();
}

// Set up all event listeners
function setupEventListeners() {
  // Settings button
  document.getElementById('sidepanel-settings-btn').addEventListener('click', openSettings);
  
  // Settings modal
  document.getElementById('close-settings').addEventListener('click', closeSettings);
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('add-website-btn').addEventListener('click', addWebsite);
  
  // Edit modal
  document.getElementById('close-edit').addEventListener('click', closeEditModal);
  document.getElementById('save-edit').addEventListener('click', saveEditWebsite);
  
  // Tab switching
  document.querySelectorAll('.settings-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabName = e.target.dataset.tab;
      switchTab(tabName);
    });
  });
  
  // Icon type selectors for add website
  document.querySelectorAll('input[name="icon-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const emojiGroup = document.getElementById('emoji-input-group');
      if (e.target.value === 'emoji') {
        emojiGroup.style.display = 'block';
      } else {
        emojiGroup.style.display = 'none';
      }
    });
  });
  
  // Icon type selectors for edit website
  document.querySelectorAll('input[name="edit-icon-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const emojiGroup = document.getElementById('edit-emoji-input-group');
      if (e.target.value === 'emoji') {
        emojiGroup.style.display = 'block';
      } else {
        emojiGroup.style.display = 'none';
      }
    });
  });
  
  // Iframe controls
  document.getElementById('back-to-list').addEventListener('click', backToList);
  document.getElementById('open-in-tab').addEventListener('click', () => {
    // Get the most current URL available
    const iframe = document.getElementById('website-iframe');
    let urlToOpen = currentWebsiteUrl || lastKnownUrl;
    
    // Try to get current iframe src as fallback
    if ((!urlToOpen || urlToOpen === 'about:blank') && iframe && iframe.src && iframe.src !== 'about:blank') {
      urlToOpen = iframe.src;
    }
    
    console.log('Opening in new tab:', urlToOpen);
    
    if (urlToOpen && urlToOpen !== 'about:blank') {
      chrome.runtime.sendMessage({ 
        action: 'openInNewTab', 
        url: urlToOpen 
      });
    } else {
      console.error('No URL available to open in new tab');
    }
  });

  // Navigation controls
  document.getElementById('nav-back').addEventListener('click', () => navigateIframe('back'));
  document.getElementById('nav-forward').addEventListener('click', () => navigateIframe('forward'));
  document.getElementById('nav-refresh').addEventListener('click', () => navigateIframe('refresh'));
  
  // Behavior checkboxes
  document.getElementById('auto-close').addEventListener('change', updateBehaviorSettings);
  document.getElementById('show-urls').addEventListener('change', updateBehaviorSettings);
  document.getElementById('compact-mode').addEventListener('change', updateBehaviorSettings);
  
  // Appearance settings
  setupAppearanceListeners();
}

// Switch between tabs in settings modal
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.settings-tabs .tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  
  const activeTab = document.getElementById(`${tabName}-tab`);
  if (activeTab) {
    activeTab.classList.remove('hidden');
  }
}

// Open settings modal
function openSettings() {
  const modal = document.getElementById('settings-modal');
  modal.classList.remove('hidden');
  
  // Load current settings into form
  document.getElementById('auto-close').checked = sidebarSettings.sidebarBehavior.autoClose;
  document.getElementById('show-urls').checked = sidebarSettings.sidebarBehavior.showUrls || false;
  document.getElementById('compact-mode').checked = sidebarSettings.sidebarBehavior.compactMode;
  
  // Load appearance settings
  if (sidebarSettings.appearance) {
    const { backgroundType, backgroundSettings } = sidebarSettings.appearance;
    document.querySelector(`input[name="bg-type"][value="${backgroundType}"]`).checked = true;
    document.querySelectorAll('.bg-options').forEach(opt => opt.classList.add('hidden'));
    document.getElementById(`${backgroundType}-options`).classList.remove('hidden');
    
    if (backgroundType === 'gradient') {
      document.getElementById('gradient-color1').value = backgroundSettings.color1 || '#667eea';
      document.getElementById('gradient-color1-text').value = backgroundSettings.color1 || '#667eea';
      document.getElementById('gradient-color2').value = backgroundSettings.color2 || '#764ba2';
      document.getElementById('gradient-color2-text').value = backgroundSettings.color2 || '#764ba2';
      document.getElementById('gradient-angle').value = backgroundSettings.angle || 135;
      document.getElementById('gradient-angle-value').textContent = (backgroundSettings.angle || 135) + '°';
    } else if (backgroundType === 'solid') {
      document.getElementById('solid-color').value = backgroundSettings.color || '#667eea';
      document.getElementById('solid-color-text').value = backgroundSettings.color || '#667eea';
    } else if (backgroundType === 'image' && backgroundSettings.image) {
      currentBackgroundImage = backgroundSettings.image;
      document.getElementById('remove-bg-image').style.display = 'block';
    }
  }
  
  // Render manage websites list
  renderManageWebsitesList();
}

// Close settings modal
function closeSettings() {
  const modal = document.getElementById('settings-modal');
  modal.classList.add('hidden');
  
  // Clear form
  document.getElementById('website-name').value = '';
  document.getElementById('website-url').value = '';
  document.getElementById('website-icon').value = '';
  document.getElementById('website-mode').value = 'iframe';
}

// Save settings
async function saveSettings() {
  await saveSidebarSettings();
  renderWebsiteList();
  applyBehaviorSettings();
  closeSettings();
}

// Add a new website
function addWebsite() {
  const name = document.getElementById('website-name').value.trim();
  const url = document.getElementById('website-url').value.trim();
  const iconType = document.querySelector('input[name="icon-type"]:checked').value;
  const icon = iconType === 'emoji' ? (document.getElementById('website-icon').value.trim() || '🌐') : '🌐';
  const mode = document.getElementById('website-mode').value;
  
  if (!name || !url) {
    alert('Please enter both name and URL');
    return;
  }
  
  // Validate URL
  try {
    new URL(url);
  } catch {
    alert('Please enter a valid URL');
    return;
  }
  
  // Generate unique ID
  const id = 'website_' + Date.now();
  
  // Get next position
  const maxPosition = Math.max(...sidebarSettings.sidebarWebsites.map(w => w.position), -1);
  
  // Get favicon URL if needed
  const favicon = iconType === 'favicon' ? getFaviconUrl(url) : null;
  
  // Add website to settings
  sidebarSettings.sidebarWebsites.push({
    id,
    name,
    url,
    icon,
    favicon,
    iconType,
    openMode: mode,
    position: maxPosition + 1
  });
  
  // Clear form
  document.getElementById('website-name').value = '';
  document.getElementById('website-url').value = '';
  document.getElementById('website-icon').value = '';
  document.getElementById('website-mode').value = 'iframe';
  document.querySelector('input[name="icon-type"][value="favicon"]').checked = true;
  document.getElementById('emoji-input-group').style.display = 'none';
  
  // Re-render manage list
  renderManageWebsitesList();
}

// Render the manage websites list in settings
function renderManageWebsitesList() {
  const manageList = document.getElementById('manage-websites-list');
  manageList.innerHTML = '';
  
  // Sort websites by position
  const sortedWebsites = [...sidebarSettings.sidebarWebsites].sort((a, b) => a.position - b.position);
  
  sortedWebsites.forEach((website, index) => {
    const item = document.createElement('div');
    item.className = 'manage-item';
    item.draggable = true;
    item.dataset.id = website.id;
    
    // Get icon display based on icon type
    let iconDisplay = '';
    if (website.iconType === 'favicon' && website.favicon) {
      iconDisplay = `<img src="${website.favicon}" alt="" class="manage-favicon" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                     <span class="manage-icon" style="display:none">${website.icon}</span>`;
    } else if (website.iconType === 'emoji' || !website.iconType) {
      iconDisplay = `<span class="manage-icon">${website.icon}</span>`;
    }
    
    // Get friendly mode name
    const modeLabels = {
      'iframe': 'Embedded',
      'newtab': 'New Tab',
      'newwindow': 'New Window',
      'privatetab': 'Private Tab',
      'privatewindow': 'Private Window'
    };
    const modeLabel = modeLabels[website.openMode] || website.openMode;
    
    item.innerHTML = `
      <div class="manage-item-info">
        ${iconDisplay}
        <div class="manage-website-details">
          <span class="manage-name">${website.name}</span>
          <span class="manage-url">${website.url}</span>
          <span class="manage-mode">(${modeLabel})</span>
        </div>
      </div>
      <div class="manage-item-actions">
        <button class="action-btn edit" data-id="${website.id}">✏️</button>
        <button class="action-btn delete" data-id="${website.id}">🗑️</button>
      </div>
    `;
    
    // Add drag event listeners
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragleave', handleDragLeave);
    
    manageList.appendChild(item);
  });
  
  // Add event listeners for manage actions
  manageList.querySelectorAll('.edit').forEach(btn => {
    btn.addEventListener('click', (e) => openEditModal(e.target.dataset.id));
  });
  
  manageList.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', (e) => deleteWebsite(e.target.dataset.id));
  });
  
  // Add empty state if no websites
  if (sortedWebsites.length === 0) {
    manageList.innerHTML = '<div class="empty-state">No websites added yet</div>';
  }
}

// Drag and drop handlers
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  
  // Remove all drag-over classes
  document.querySelectorAll('.manage-item').forEach(item => {
    item.classList.remove('drag-over');
  });
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  if (this !== draggedElement) {
    this.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  if (draggedElement !== this) {
    // Get the IDs
    const draggedId = draggedElement.dataset.id;
    const targetId = this.dataset.id;
    
    // Find the websites
    const draggedWebsite = sidebarSettings.sidebarWebsites.find(w => w.id === draggedId);
    const targetWebsite = sidebarSettings.sidebarWebsites.find(w => w.id === targetId);
    
    if (draggedWebsite && targetWebsite) {
      // Swap positions
      const tempPosition = draggedWebsite.position;
      draggedWebsite.position = targetWebsite.position;
      targetWebsite.position = tempPosition;
      
      // Re-render the list
      renderManageWebsitesList();
    }
  }
  
  return false;
}

// Edit modal functions
let editingWebsiteId = null;

function openEditModal(websiteId) {
  const website = sidebarSettings.sidebarWebsites.find(w => w.id === websiteId);
  if (!website) return;
  
  editingWebsiteId = websiteId;
  
  // Populate edit form
  document.getElementById('edit-website-name').value = website.name;
  document.getElementById('edit-website-url').value = website.url;
  document.getElementById('edit-website-mode').value = website.openMode;
  
  // Set icon type
  const iconType = website.iconType || 'emoji';
  document.querySelector(`input[name="edit-icon-type"][value="${iconType}"]`).checked = true;
  
  // Show/hide emoji input
  const emojiGroup = document.getElementById('edit-emoji-input-group');
  if (iconType === 'emoji') {
    emojiGroup.style.display = 'block';
    document.getElementById('edit-website-icon').value = website.icon || '🌐';
  } else {
    emojiGroup.style.display = 'none';
  }
  
  // Show modal
  document.getElementById('edit-website-modal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('edit-website-modal').classList.add('hidden');
  editingWebsiteId = null;
}

function saveEditWebsite() {
  if (!editingWebsiteId) return;
  
  const website = sidebarSettings.sidebarWebsites.find(w => w.id === editingWebsiteId);
  if (!website) return;
  
  // Get form values
  const name = document.getElementById('edit-website-name').value.trim();
  const url = document.getElementById('edit-website-url').value.trim();
  const iconType = document.querySelector('input[name="edit-icon-type"]:checked').value;
  const icon = iconType === 'emoji' ? (document.getElementById('edit-website-icon').value.trim() || '🌐') : '🌐';
  const mode = document.getElementById('edit-website-mode').value;
  
  if (!name || !url) {
    alert('Please enter both name and URL');
    return;
  }
  
  // Validate URL
  try {
    new URL(url);
  } catch {
    alert('Please enter a valid URL');
    return;
  }
  
  // Update website
  website.name = name;
  website.url = url;
  website.iconType = iconType;
  website.icon = icon;
  website.favicon = iconType === 'favicon' ? getFaviconUrl(url) : website.favicon;
  website.openMode = mode;
  
  // Close modal and re-render
  closeEditModal();
  renderManageWebsitesList();
}



// Delete website
function deleteWebsite(id) {
  if (confirm('Are you sure you want to delete this website?')) {
    sidebarSettings.sidebarWebsites = sidebarSettings.sidebarWebsites.filter(w => w.id !== id);
    renderManageWebsitesList();
  }
}

// Update behavior settings
function updateBehaviorSettings() {
  sidebarSettings.sidebarBehavior.autoClose = document.getElementById('auto-close').checked;
  sidebarSettings.sidebarBehavior.showUrls = document.getElementById('show-urls').checked;
  sidebarSettings.sidebarBehavior.compactMode = document.getElementById('compact-mode').checked;
}

// Apply behavior settings to UI
function applyBehaviorSettings() {
  const websiteItems = document.querySelectorAll('.website-item');
  websiteItems.forEach(item => {
    if (sidebarSettings.sidebarBehavior.compactMode) {
      item.classList.add('compact');
    } else {
      item.classList.remove('compact');
    }
  });
}

// Setup appearance listeners
function setupAppearanceListeners() {
  // Background type radio buttons
  document.querySelectorAll('input[name="bg-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const type = e.target.value;
      document.querySelectorAll('.bg-options').forEach(opt => opt.classList.add('hidden'));
      document.getElementById(`${type}-options`).classList.remove('hidden');
    });
  });
  
  // Gradient controls
  document.getElementById('gradient-color1').addEventListener('input', updateGradientPreview);
  document.getElementById('gradient-color1-text').addEventListener('input', (e) => {
    document.getElementById('gradient-color1').value = e.target.value;
    updateGradientPreview();
  });
  
  document.getElementById('gradient-color2').addEventListener('input', updateGradientPreview);
  document.getElementById('gradient-color2-text').addEventListener('input', (e) => {
    document.getElementById('gradient-color2').value = e.target.value;
    updateGradientPreview();
  });
  
  document.getElementById('gradient-angle').addEventListener('input', (e) => {
    document.getElementById('gradient-angle-value').textContent = e.target.value + '°';
    updateGradientPreview();
  });
  
  // Solid color controls
  document.getElementById('solid-color').addEventListener('input', updateSolidColorPreview);
  document.getElementById('solid-color-text').addEventListener('input', (e) => {
    document.getElementById('solid-color').value = e.target.value;
    updateSolidColorPreview();
  });
  
  // Image upload
  document.getElementById('bg-image-upload').addEventListener('change', handleImageUpload);
  document.getElementById('remove-bg-image').addEventListener('click', removeBackgroundImage);
  
  document.getElementById('bg-image-opacity').addEventListener('input', (e) => {
    document.getElementById('bg-image-opacity-value').textContent = e.target.value + '%';
    updateImageOpacity();
  });
  
  // Preset gradients
  document.querySelectorAll('.preset-gradient').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const [angle, color1, color2] = e.target.dataset.gradient.split(',');
      document.getElementById('gradient-angle').value = angle;
      document.getElementById('gradient-angle-value').textContent = angle + '°';
      document.getElementById('gradient-color1').value = color1;
      document.getElementById('gradient-color1-text').value = color1;
      document.getElementById('gradient-color2').value = color2;
      document.getElementById('gradient-color2-text').value = color2;
      document.querySelector('input[name="bg-type"][value="gradient"]').checked = true;
      document.querySelectorAll('.bg-options').forEach(opt => opt.classList.add('hidden'));
      document.getElementById('gradient-options').classList.remove('hidden');
      updateGradientPreview();
    });
  });
}

// Update gradient preview
function updateGradientPreview() {
  const color1 = document.getElementById('gradient-color1').value;
  const color2 = document.getElementById('gradient-color2').value;
  const angle = document.getElementById('gradient-angle').value;
  
  document.getElementById('gradient-color1-text').value = color1;
  document.getElementById('gradient-color2-text').value = color2;
  
  applyBackground('gradient', { color1, color2, angle });
}

// Update solid color preview
function updateSolidColorPreview() {
  const color = document.getElementById('solid-color').value;
  document.getElementById('solid-color-text').value = color;
  applyBackground('solid', { color });
}

// Handle image upload
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    currentBackgroundImage = event.target.result;
    document.getElementById('remove-bg-image').style.display = 'block';
    applyBackground('image', { image: currentBackgroundImage });
  };
  reader.readAsDataURL(file);
}

// Remove background image
function removeBackgroundImage() {
  currentBackgroundImage = null;
  document.getElementById('bg-image-upload').value = '';
  document.getElementById('remove-bg-image').style.display = 'none';
  
  // Switch back to gradient
  document.querySelector('input[name="bg-type"][value="gradient"]').checked = true;
  document.querySelectorAll('.bg-options').forEach(opt => opt.classList.add('hidden'));
  document.getElementById('gradient-options').classList.remove('hidden');
  updateGradientPreview();
}

// Update image opacity
function updateImageOpacity() {
  const opacity = document.getElementById('bg-image-opacity').value / 100;
  if (currentBackgroundImage) {
    applyBackground('image', { image: currentBackgroundImage, opacity });
  }
}

// Apply background to sidepanel
function applyBackground(type, settings) {
  const body = document.body;
  
  switch (type) {
    case 'gradient':
      body.style.background = `linear-gradient(${settings.angle}deg, ${settings.color1} 0%, ${settings.color2} 100%)`;
      break;
    case 'solid':
      body.style.background = settings.color;
      break;
    case 'image':
      const opacity = settings.opacity || (document.getElementById('bg-image-opacity').value / 100);
      body.style.background = `linear-gradient(rgba(0,0,0,${1-opacity}), rgba(0,0,0,${1-opacity})), url('${settings.image}') center/cover`;
      break;
  }
  
  // Save to settings
  if (!sidebarSettings.appearance) {
    sidebarSettings.appearance = {};
  }
  sidebarSettings.appearance.backgroundType = type;
  sidebarSettings.appearance.backgroundSettings = settings;
}

// Load appearance settings
function loadAppearanceSettings() {
  if (!sidebarSettings.appearance) {
    // Default appearance
    sidebarSettings.appearance = {
      backgroundType: 'gradient',
      backgroundSettings: {
        color1: '#667eea',
        color2: '#764ba2',
        angle: 135
      }
    };
  }
  
  const { backgroundType, backgroundSettings } = sidebarSettings.appearance;
  
  // Apply the saved background
  applyBackground(backgroundType, backgroundSettings);
  
  // Update UI controls
  document.querySelector(`input[name="bg-type"][value="${backgroundType}"]`).checked = true;
  document.querySelectorAll('.bg-options').forEach(opt => opt.classList.add('hidden'));
  document.getElementById(`${backgroundType}-options`).classList.remove('hidden');
  
  if (backgroundType === 'gradient') {
    document.getElementById('gradient-color1').value = backgroundSettings.color1;
    document.getElementById('gradient-color1-text').value = backgroundSettings.color1;
    document.getElementById('gradient-color2').value = backgroundSettings.color2;
    document.getElementById('gradient-color2-text').value = backgroundSettings.color2;
    document.getElementById('gradient-angle').value = backgroundSettings.angle;
    document.getElementById('gradient-angle-value').textContent = backgroundSettings.angle + '°';
  } else if (backgroundType === 'solid') {
    document.getElementById('solid-color').value = backgroundSettings.color;
    document.getElementById('solid-color-text').value = backgroundSettings.color;
  } else if (backgroundType === 'image' && backgroundSettings.image) {
    currentBackgroundImage = backgroundSettings.image;
    document.getElementById('remove-bg-image').style.display = 'block';
    if (backgroundSettings.opacity !== undefined) {
      const opacityPercent = Math.round(backgroundSettings.opacity * 100);
      document.getElementById('bg-image-opacity').value = opacityPercent;
      document.getElementById('bg-image-opacity-value').textContent = opacityPercent + '%';
    }
  }
}