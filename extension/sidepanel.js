// Sidepanel panel JavaScript
let sidebarSettings = null;
let currentWebsiteUrl = null;

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

// Load settings from background script
function loadSidebarSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getSidebarSettings' }, (response) => {
      resolve(response);
    });
  });
}

// Save settings to background script
function saveSidebarSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ 
      action: 'saveSidebarSettings', 
      settings: sidebarSettings 
    }, (response) => {
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
  
  const icon = sidebarSettings.sidebarBehavior.showIcons ? 
    `<span class="website-icon">${website.icon || '🌐'}</span>` : '';
  
  item.innerHTML = `
    ${icon}
    <span class="website-name">${website.name}</span>
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
  
  // Clear any existing event handlers to avoid duplicates
  iframe.onerror = null;
  iframe.onload = null;
  
  // Set up a loading timeout with better detection
  let loadTimeout;
  let hasLoadedSuccessfully = false;
  
  // Handle successful loads
  iframe.onload = () => {
    hasLoadedSuccessfully = true;
    clearTimeout(loadTimeout);
    console.log(`Successfully loaded ${website.name} in iframe`);
  };
  
  // Handle actual network errors only
  iframe.onerror = () => {
    if (!hasLoadedSuccessfully) {
      console.log(`Network error loading ${website.name} in iframe`);
      clearTimeout(loadTimeout);
      handleIframeError(website, 'network_error');
    }
  };
  
  // Set a reasonable timeout for loading
  loadTimeout = setTimeout(() => {
    if (!hasLoadedSuccessfully) {
      // Check if iframe appears to have blocked content
      let shouldFallback = false;
      
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        
        // Only treat as blocked if we can access the document AND it's clearly an error
        if (iframeDoc) {
          const body = iframeDoc.body;
          const bodyText = body ? body.textContent.toLowerCase().trim() : '';
          
          // Look for explicit blocking messages
          const blockingIndicators = [
            'refused to connect',
            'this site can\'t be reached',
            'x-frame-options',
            'refused to frame',
            'frame denied'
          ];
          
          shouldFallback = blockingIndicators.some(indicator => bodyText.includes(indicator)) ||
                           (bodyText === '' && body && body.innerHTML.trim() === '');
        }
        
        // If we get a CORS error, that's actually good - it means the site loaded
        // We'll assume it worked and let it be
        
      } catch (e) {
        // CORS error - this is normal and expected for most sites that work in iframes
        // Don't fallback, the site is working fine
        shouldFallback = false;
        console.log(`${website.name} loaded successfully (CORS protection is normal)`);
      }
      
      if (shouldFallback) {
        console.log(`${website.name} appears to block iframe embedding`);
        handleIframeError(website, 'frame_blocked');
      } else {
        hasLoadedSuccessfully = true;
        console.log(`${website.name} loaded successfully`);
      }
    }
  }, 5000); // Give sites 5 seconds to load
  
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
    const errorMessage = errorType === 'network_error' 
      ? 'Connection failed - opening in tab...'
      : 'Site blocks embedding - opening in tab...';
    
    iframeTitle.textContent = errorMessage;
    
    setTimeout(() => {
      iframeTitle.textContent = originalText;
      backToList();
    }, 2000); // Show message a bit longer for better UX
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
  document.getElementById('compact-mode').addEventListener('change', updateBehaviorSettings);
}

// Open settings modal
function openSettings() {
  const modal = document.getElementById('settings-modal');
  modal.classList.remove('hidden');
  
  // Load current settings into form
  document.getElementById('auto-close').checked = sidebarSettings.sidebarBehavior.autoClose;
  document.getElementById('show-icons').checked = sidebarSettings.sidebarBehavior.showIcons;
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
  
  // Add website to settings
  sidebarSettings.sidebarWebsites.push({
    id,
    name,
    url,
    icon,
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
    item.innerHTML = `
      <div class="manage-item-info">
        <span class="manage-icon">${website.icon}</span>
        <span class="manage-name">${website.name}</span>
        <span class="manage-mode">(${website.openMode})</span>
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