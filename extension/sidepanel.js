// Sidebar panel JavaScript
let sidebarSettings = null;
let currentWebsiteUrl = null;

// Initialize sidebar on load
document.addEventListener('DOMContentLoaded', initializeSidebar);

async function initializeSidebar() {
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
  
  // IMPORTANT: Just load the URL directly - let the browser handle it
  // Most sites will work, and we'll only intervene if there's a real problem
  iframe.src = website.url;
  
  // We'll use a different approach - monitor for navigation errors
  // Sites that block iframes will typically show an error page or blank content
  
  // Remove any existing event listeners to avoid duplicates
  iframe.onerror = null;
  iframe.onload = null;
  
  // Only handle network errors (site doesn't exist, connection refused, etc.)
  iframe.onerror = () => {
    console.log('Network error loading iframe');
    handleIframeError(website);
  };
  
  // For sites that block with X-Frame-Options, we need a different approach
  // We'll check if the iframe navigated away or shows an error page
  let checkAttempts = 0;
  const maxChecks = 3;
  
  const checkIframeStatus = () => {
    checkAttempts++;
    
    try {
      // Try to check if iframe loaded something
      // This will throw for CORS, which is fine - it means content loaded
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      // If we can access the document and it's empty or shows an error, it's blocked
      if (iframeDoc && (iframeDoc.body.innerHTML === '' || 
          iframeDoc.body.textContent.includes('refused to connect') ||
          iframeDoc.body.textContent.includes('blocked'))) {
        console.log('Site appears to block iframe embedding');
        handleIframeError(website);
        return;
      }
      
      // If we can access it and it has content, it's working!
      console.log('Iframe loaded successfully with accessible content');
      
    } catch (e) {
      // CORS error - this is GOOD! It means the site loaded but we can't access it
      // This is the normal case for most external sites that allow iframes
      console.log('Iframe loaded (CORS blocks access, which is normal and expected)');
    }
    
    // Check a few times in case of slow loading
    if (checkAttempts < maxChecks) {
      setTimeout(checkIframeStatus, 1500);
    }
  };
  
  // Start checking after a short delay to allow initial load
  setTimeout(checkIframeStatus, 1500);
}

// Handle iframe loading errors
function handleIframeError(website) {
  // Automatically open in new tab without asking - better UX
  console.log(`${website.name} cannot be embedded, opening in new tab instead`);
  
  // Open in new tab
  chrome.runtime.sendMessage({ 
    action: 'openInNewTab', 
    url: website.url 
  });
  
  // Update the website's openMode for future use (silently)
  const websiteIndex = sidebarSettings.sidebarWebsites.findIndex(w => w.id === website.id);
  if (websiteIndex !== -1) {
    sidebarSettings.sidebarWebsites[websiteIndex].openMode = 'newtab';
    saveSidebarSettings();
  }
  
  // Show a brief notification instead of confirm dialog
  const iframeTitle = document.getElementById('iframe-title');
  if (iframeTitle) {
    const originalText = iframeTitle.textContent;
    iframeTitle.textContent = 'Opening in new tab...';
    setTimeout(() => {
      iframeTitle.textContent = originalText;
      backToList();
    }, 1500);
  } else {
    backToList();
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
  document.getElementById('sidebar-settings-btn').addEventListener('click', openSettings);
  
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