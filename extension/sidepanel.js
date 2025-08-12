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

// Utility function to get website icon (favicon, emoji, or none)
function getWebsiteIcon(website) {
  if (website.iconType === 'none') {
    return '';
  } else if (website.iconType === 'favicon' && website.favicon) {
    return `<img src="${website.favicon}" alt="" class="website-favicon" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
            <span class="website-icon" style="display:none">${website.icon || '🌐'}</span>`;
  } else if (website.iconType === 'emoji' || !website.iconType) {
    return `<span class="website-icon">${website.icon || '🌐'}</span>`;
  }
  return '';
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
  
  const icon = getWebsiteIcon(website);
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
  
  // Hide website list, show iframe
  websiteList.classList.add('hidden');
  iframeContainer.classList.remove('hidden');
  
  // Set title and current URL
  iframeTitle.textContent = website.name;
  currentWebsiteUrl = website.url;
  
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
  };
  
  // Set a reasonable timeout for slow-loading sites
  loadTimeout = setTimeout(() => {
    console.log(`Timeout loading ${website.name}`);
    handleIframeError(website, 'timeout');
  }, 10000); // 10 seconds for slow sites
  
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
async function backToList() {
  const websiteList = document.getElementById('website-list');
  const iframeContainer = document.getElementById('iframe-container');
  const iframe = document.getElementById('website-iframe');
  
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
    if (currentWebsiteUrl) {
      chrome.runtime.sendMessage({ 
        action: 'openInNewTab', 
        url: currentWebsiteUrl 
      });
    }
  });
  
  // Behavior checkboxes
  document.getElementById('auto-close').addEventListener('change', updateBehaviorSettings);
  document.getElementById('show-urls').addEventListener('change', updateBehaviorSettings);
  document.getElementById('compact-mode').addEventListener('change', updateBehaviorSettings);
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