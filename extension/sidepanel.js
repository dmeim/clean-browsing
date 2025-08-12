// Sidepanel panel JavaScript
let sidebarSettings = null;
let currentWebsiteUrl = null;

// Utility function to get favicon URL from a website URL
function getFaviconUrl(websiteUrl) {
  try {
    const url = new URL(websiteUrl);
    return `${url.protocol}//${url.hostname}/favicon.ico`;
  } catch (e) {
    return null;
  }
}

// Utility function to get website icon (favicon or emoji)
function getWebsiteIcon(website) {
  if (sidebarSettings.sidebarBehavior.useFavicons && website.favicon) {
    return `<img src="${website.favicon}" alt="" class="website-favicon" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
            <span class="website-icon" style="display:none">${website.icon || '🌐'}</span>`;
  } else {
    return `<span class="website-icon">${website.icon || '🌐'}</span>`;
  }
}

// Initialize sidepanel on load
document.addEventListener('DOMContentLoaded', initializeSidepanel);

async function initializeSidepanel() {
  // Load settings from background script
  sidebarSettings = await loadSidebarSettings();
  
  // Render website list
  renderWebsiteList();
  
  // Set up event listeners
  setupEventListeners();
  
  // Apply behavior settings
  applyBehaviorSettings();
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
  
  const icon = sidebarSettings.sidebarBehavior.showIcons ? getWebsiteIcon(website) : '';
  const showUrls = sidebarSettings.sidebarBehavior.showUrls;
  
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
      chrome.runtime.sendMessage({ 
        action: 'openInNewTab', 
        url: website.url 
      });
      if (sidebarSettings.sidebarBehavior.autoClose) {
        window.close();
      }
      break;
    case 'currenttab':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.update(tabs[0].id, { url: website.url });
      });
      if (sidebarSettings.sidebarBehavior.autoClose) {
        window.close();
      }
      break;
  }
}

// Open website in iframe
function openInIframe(website) {
  const websiteList = document.getElementById('website-list');
  const iframeContainer = document.getElementById('iframe-container');
  const iframe = document.getElementById('website-iframe');
  const iframeTitle = document.getElementById('iframe-title');
  
  // Hide website list, show iframe
  websiteList.classList.add('hidden');
  iframeContainer.classList.remove('hidden');
  
  // Set title and current URL
  iframeTitle.textContent = website.name;
  currentWebsiteUrl = website.url;
  
  // Clear any existing handlers
  iframe.onerror = null;
  iframe.onload = null;
  
  // State tracking
  let hasResolved = false;
  let loadTimeout;
  
  // Resolve function to avoid duplicate handling
  const resolveLoad = (success, errorType = null) => {
    if (hasResolved) return;
    hasResolved = true;
    clearTimeout(loadTimeout);
    
    if (success) {
      console.log(`Successfully loaded ${website.name} in iframe`);
    } else {
      console.log(`Failed to load ${website.name} in iframe: ${errorType}`);
      handleIframeError(website, errorType);
    }
  };
  
  // Handle network errors (DNS failures, connection refused, etc.)
  iframe.onerror = () => {
    resolveLoad(false, 'network_error');
  };
  
  // Handle successful loads - keep it simple
  iframe.onload = () => {
    // Basic check: if contentWindow is accessible, assume it loaded something
    // CSP/X-Frame-Options violations typically result in no contentWindow or immediate errors
    if (iframe.contentWindow) {
      resolveLoad(true);
    } else {
      resolveLoad(false, 'frame_blocked');
    }
  };
  
  // Aggressive timeout - CSP and X-Frame-Options blocks happen immediately
  // If onload doesn't fire quickly, the site is likely blocking iframe embedding
  loadTimeout = setTimeout(() => {
    resolveLoad(false, 'timeout');
  }, 1500); // Very fast timeout - 1.5 seconds max
  
  // Load the URL
  iframe.src = website.url;
}

// Handle iframe loading errors
function handleIframeError(website, errorType = 'unknown') {
  console.log(`${website.name} cannot be embedded (${errorType}), opening in new tab instead`);
  
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
function backToList() {
  const websiteList = document.getElementById('website-list');
  const iframeContainer = document.getElementById('iframe-container');
  const iframe = document.getElementById('website-iframe');
  
  // Show website list, hide iframe
  websiteList.classList.remove('hidden');
  iframeContainer.classList.add('hidden');
  
  // Clear iframe
  iframe.src = '';
  currentWebsiteUrl = null;
}

// Set up all event listeners
function setupEventListeners() {
  // Settings button
  document.getElementById('sidepanel-settings-btn').addEventListener('click', openSettings);
  
  // Settings modal
  document.getElementById('close-settings').addEventListener('click', closeSettings);
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('add-website-btn').addEventListener('click', addWebsite);
  
  // Iframe controls
  document.getElementById('back-to-list').addEventListener('click', backToList);
  document.getElementById('open-in-tab').addEventListener('click', () => {
    if (currentWebsiteUrl) {
      chrome.runtime.sendMessage({ 
        action: 'openInNewTab', 
        url: currentWebsiteUrl 
      });
    }
  });
  
  // Behavior checkboxes
  document.getElementById('auto-close').addEventListener('change', updateBehaviorSettings);
  document.getElementById('show-icons').addEventListener('change', updateBehaviorSettings);
  document.getElementById('use-favicons').addEventListener('change', updateBehaviorSettings);
  document.getElementById('show-urls').addEventListener('change', updateBehaviorSettings);
  document.getElementById('compact-mode').addEventListener('change', updateBehaviorSettings);
}

// Open settings modal
function openSettings() {
  const modal = document.getElementById('settings-modal');
  modal.classList.remove('hidden');
  
  // Load current settings into form
  document.getElementById('auto-close').checked = sidebarSettings.sidebarBehavior.autoClose;
  document.getElementById('show-icons').checked = sidebarSettings.sidebarBehavior.showIcons;
  document.getElementById('use-favicons').checked = sidebarSettings.sidebarBehavior.useFavicons || false;
  document.getElementById('show-urls').checked = sidebarSettings.sidebarBehavior.showUrls || false;
  document.getElementById('compact-mode').checked = sidebarSettings.sidebarBehavior.compactMode;
  
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
  const icon = document.getElementById('website-icon').value.trim() || '🌐';
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
  
  // Get favicon URL
  const favicon = getFaviconUrl(url);
  
  // Add website to settings
  sidebarSettings.sidebarWebsites.push({
    id,
    name,
    url,
    icon,
    favicon,
    openMode: mode,
    position: maxPosition + 1
  });
  
  // Clear form
  document.getElementById('website-name').value = '';
  document.getElementById('website-url').value = '';
  document.getElementById('website-icon').value = '';
  document.getElementById('website-mode').value = 'iframe';
  
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
    const iconDisplay = sidebarSettings.sidebarBehavior.useFavicons && website.favicon 
      ? `<img src="${website.favicon}" alt="" class="manage-favicon" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
         <span class="manage-icon" style="display:none">${website.icon}</span>`
      : `<span class="manage-icon">${website.icon}</span>`;
    
    item.innerHTML = `
      <div class="manage-item-info">
        ${iconDisplay}
        <div class="manage-website-details">
          <span class="manage-name">${website.name}</span>
          <span class="manage-url">${website.url}</span>
          <span class="manage-mode">(${website.openMode})</span>
        </div>
      </div>
      <div class="manage-item-actions">
        <button class="action-btn move-up" data-id="${website.id}" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button class="action-btn move-down" data-id="${website.id}" ${index === sortedWebsites.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="action-btn delete" data-id="${website.id}">🗑️</button>
      </div>
    `;
    manageList.appendChild(item);
  });
  
  // Add event listeners for manage actions
  manageList.querySelectorAll('.move-up').forEach(btn => {
    btn.addEventListener('click', (e) => moveWebsite(e.target.dataset.id, -1));
  });
  
  manageList.querySelectorAll('.move-down').forEach(btn => {
    btn.addEventListener('click', (e) => moveWebsite(e.target.dataset.id, 1));
  });
  
  manageList.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', (e) => deleteWebsite(e.target.dataset.id));
  });
  
  // Add empty state if no websites
  if (sortedWebsites.length === 0) {
    manageList.innerHTML = '<div class="empty-state">No websites added yet</div>';
  }
}

// Move website up or down
function moveWebsite(id, direction) {
  const website = sidebarSettings.sidebarWebsites.find(w => w.id === id);
  if (!website) return;
  
  // Sort websites by position
  const sortedWebsites = [...sidebarSettings.sidebarWebsites].sort((a, b) => a.position - b.position);
  const currentIndex = sortedWebsites.findIndex(w => w.id === id);
  const newIndex = currentIndex + direction;
  
  if (newIndex < 0 || newIndex >= sortedWebsites.length) return;
  
  // Swap positions
  const otherWebsite = sortedWebsites[newIndex];
  const tempPosition = website.position;
  website.position = otherWebsite.position;
  otherWebsite.position = tempPosition;
  
  // Re-render manage list
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
  sidebarSettings.sidebarBehavior.showIcons = document.getElementById('show-icons').checked;
  sidebarSettings.sidebarBehavior.useFavicons = document.getElementById('use-favicons').checked;
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