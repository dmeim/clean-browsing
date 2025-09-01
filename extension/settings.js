const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsButton = document.getElementById('close-settings');

settingsModal.classList.add('hidden');

settingsButton.addEventListener('click', () => {
  settingsModal.classList.remove('hidden');
});

closeSettingsButton.addEventListener('click', (e) => {
  e.stopPropagation();
  settingsModal.classList.add('hidden');
});

// tab handling
const tabButtons = document.querySelectorAll('.settings-tabs button');
const tabContents = document.querySelectorAll('.tab-content');
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(`${btn.dataset.tab}-tab`).classList.remove('hidden');
  });
});

const defaultSettings = {
  background: { 
    type: 'gradient',
    gradient: {
      color1: '#667eea',
      color2: '#764ba2',
      angle: 135
    },
    solid: {
      color: '#222222'
    },
    image: {
      url: null,
      opacity: 100
    }
  },
  lastColor: '#222222',
  resetModalPosition: true,
  globalWidgetAppearance: {
    fontSize: 100,
    fontWeight: 400,
    italic: false,
    underline: false,
    textColor: '#ffffff',
    textOpacity: 100,
    backgroundColor: '#000000',
    backgroundOpacity: 20,
    blur: 10,
    borderRadius: 12,
    opacity: 100,
    textAlign: 'center',
    verticalAlign: 'center',
    padding: 16
  },
  sidebarSettings: {
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
        url: 'https://chatgpt.com',
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
  },
  widgets: [
    {
      type: 'clock',
      x: 0,
      y: 0,
      w: 4,
      h: 3,
      settings: {
        showSeconds: true,
        flashing: false,
        locale: 'auto',
        use24h: false,
        daylightSavings: true,
        textSize: 100
      }
    },
    {
      type: 'date',
      x: 5,
      y: 0,
      w: 4,
      h: 2,
      settings: {
        format: 'MM/DD/YYYY',
        separator: '/',
        locale: 'auto'
      }
    }
  ]
};

function normalizeColor(color) {
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }
  return color;
}

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('settings')) || { ...defaultSettings };
    if (s.background && s.background.type === 'color') {
      s.background.value = normalizeColor(s.background.value);
    }
    s.lastColor = normalizeColor(s.lastColor || defaultSettings.lastColor);
    s.globalWidgetAppearance = { ...defaultSettings.globalWidgetAppearance, ...(s.globalWidgetAppearance || {}) };
    s.sidebarSettings = s.sidebarSettings || defaultSettings.sidebarSettings;
    // Ensure sidepanel settings structure is complete
    if (s.sidebarSettings) {
      s.sidebarSettings.sidebarWebsites = s.sidebarSettings.sidebarWebsites || defaultSettings.sidebarSettings.sidebarWebsites;
      s.sidebarSettings.sidebarBehavior = { ...defaultSettings.sidebarSettings.sidebarBehavior, ...(s.sidebarSettings.sidebarBehavior || {}) };
    }
    // Also sync with ExtensionAPI storage for sidepanel access
    if (typeof ExtensionAPI !== 'undefined') {
      ExtensionAPI.storage.set({ sidebarSettings: s.sidebarSettings }).catch(() => {});
    }
    s.widgets = (s.widgets || defaultSettings.widgets).map(w => ({
      ...w,
      x: w.x || 0,
      y: w.y || 0,
      w: w.w || 4,
      h: w.h || 3,
    }));
    return s;
  } catch (e) {
    return { ...defaultSettings };
  }
}

function saveSettings(s) {
  localStorage.setItem('settings', JSON.stringify(s));
  // Also sync sidepanel settings with ExtensionAPI storage for sidepanel access
  if (typeof ExtensionAPI !== 'undefined' && s.sidebarSettings) {
    ExtensionAPI.storage.set({ sidebarSettings: s.sidebarSettings }).catch(() => {});
  }
}

function applyBackground(s) {
  // Handle legacy settings format
  if (s.background.value) {
    // Convert old format to new format
    if (s.background.type === 'color') {
      s.background = {
        type: 'solid',
        gradient: { color1: '#667eea', color2: '#764ba2', angle: 135 },
        solid: { color: s.background.value },
        image: { url: null, opacity: 100 }
      };
    } else if (s.background.type === 'image') {
      s.background = {
        type: 'image',
        gradient: { color1: '#667eea', color2: '#764ba2', angle: 135 },
        solid: { color: s.lastColor || '#222222' },
        image: { url: s.background.value, opacity: 100 }
      };
    }
    saveSettings(s);
  }
  
  // Apply new format backgrounds
  switch (s.background.type) {
    case 'gradient':
      const g = s.background.gradient;
      document.body.style.background = `linear-gradient(${g.angle}deg, ${g.color1} 0%, ${g.color2} 100%)`;
      break;
    case 'solid':
      document.body.style.background = s.background.solid.color;
      break;
    case 'image':
      const img = s.background.image;
      if (img.url) {
        const opacity = (100 - img.opacity) / 100;
        document.body.style.background = `linear-gradient(rgba(0,0,0,${opacity}), rgba(0,0,0,${opacity})), url('${img.url}') center/cover no-repeat`;
      } else {
        // Fallback to gradient if no image
        const g = s.background.gradient;
        document.body.style.background = `linear-gradient(${g.angle}deg, ${g.color1} 0%, ${g.color2} 100%)`;
      }
      break;
    default:
      // Fallback to gradient
      const fallback = s.background.gradient || { color1: '#667eea', color2: '#764ba2', angle: 135 };
      document.body.style.background = `linear-gradient(${fallback.angle}deg, ${fallback.color1} 0%, ${fallback.color2} 100%)`;
  }
}

let settings = loadSettings();
applyBackground(settings);

// Grid is now fixed and responsive - no user configuration needed

// Legacy function kept for compatibility but no longer used
function updateBackgroundControls() {
  // This function is no longer needed with the new background system
}

function updateImagePickerDisplay() {
  // This function is no longer needed with the new background system
}

// Enhanced background controls
function setupBackgroundControls() {
  // Background type radio buttons
  document.querySelectorAll('input[name="main-bg-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const type = e.target.value;
      settings.background.type = type;
      
      // Show/hide appropriate options
      document.querySelectorAll('.bg-options-group').forEach(opt => opt.classList.add('hidden'));
      document.getElementById(`main-${type}-options`).classList.remove('hidden');
      
      applyBackground(settings);
      saveSettings(settings);
    });
  });
  
  // Gradient controls
  const gradientColor1 = document.getElementById('main-gradient-color1');
  const gradientColor1Text = document.getElementById('main-gradient-color1-text');
  const gradientColor2 = document.getElementById('main-gradient-color2');
  const gradientColor2Text = document.getElementById('main-gradient-color2-text');
  const gradientAngle = document.getElementById('main-gradient-angle');
  const gradientAngleValue = document.getElementById('main-gradient-angle-value');
  
  gradientColor1.addEventListener('input', (e) => {
    settings.background.gradient.color1 = e.target.value;
    gradientColor1Text.value = e.target.value;
    if (settings.background.type === 'gradient') {
      applyBackground(settings);
      saveSettings(settings);
    }
  });
  
  gradientColor1Text.addEventListener('input', (e) => {
    settings.background.gradient.color1 = e.target.value;
    gradientColor1.value = e.target.value;
    if (settings.background.type === 'gradient') {
      applyBackground(settings);
      saveSettings(settings);
    }
  });
  
  gradientColor2.addEventListener('input', (e) => {
    settings.background.gradient.color2 = e.target.value;
    gradientColor2Text.value = e.target.value;
    if (settings.background.type === 'gradient') {
      applyBackground(settings);
      saveSettings(settings);
    }
  });
  
  gradientColor2Text.addEventListener('input', (e) => {
    settings.background.gradient.color2 = e.target.value;
    gradientColor2.value = e.target.value;
    if (settings.background.type === 'gradient') {
      applyBackground(settings);
      saveSettings(settings);
    }
  });
  
  gradientAngle.addEventListener('input', (e) => {
    settings.background.gradient.angle = e.target.value;
    gradientAngleValue.textContent = e.target.value + '°';
    if (settings.background.type === 'gradient') {
      applyBackground(settings);
      saveSettings(settings);
    }
  });
  
  // Solid color controls
  const solidColor = document.getElementById('main-solid-color');
  const solidColorText = document.getElementById('main-solid-color-text');
  
  solidColor.addEventListener('input', (e) => {
    settings.background.solid.color = e.target.value;
    solidColorText.value = e.target.value;
    if (settings.background.type === 'solid') {
      applyBackground(settings);
      saveSettings(settings);
    }
  });
  
  solidColorText.addEventListener('input', (e) => {
    settings.background.solid.color = e.target.value;
    solidColor.value = e.target.value;
    if (settings.background.type === 'solid') {
      applyBackground(settings);
      saveSettings(settings);
    }
  });
  
  // Image controls
  const imageUpload = document.getElementById('main-bg-image-upload');
  const removeImage = document.getElementById('main-remove-bg-image');
  const imageOpacity = document.getElementById('main-bg-image-opacity');
  const imageOpacityValue = document.getElementById('main-bg-image-opacity-value');
  
  imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      settings.background.image.url = reader.result;
      settings.background.type = 'image';
      removeImage.classList.remove('hidden');
      applyBackground(settings);
      saveSettings(settings);
      
      // Update UI
      document.querySelector('input[name="main-bg-type"][value="image"]').checked = true;
      document.querySelectorAll('.bg-options-group').forEach(opt => opt.classList.add('hidden'));
      document.getElementById('main-image-options').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  });
  
  removeImage.addEventListener('click', () => {
    settings.background.image.url = null;
    settings.background.type = 'gradient';
    imageUpload.value = '';
    removeImage.classList.add('hidden');
    applyBackground(settings);
    saveSettings(settings);
    
    // Switch back to gradient
    document.querySelector('input[name="main-bg-type"][value="gradient"]').checked = true;
    document.querySelectorAll('.bg-options-group').forEach(opt => opt.classList.add('hidden'));
    document.getElementById('main-gradient-options').classList.remove('hidden');
  });
  
  imageOpacity.addEventListener('input', (e) => {
    settings.background.image.opacity = e.target.value;
    imageOpacityValue.textContent = e.target.value + '%';
    if (settings.background.type === 'image') {
      applyBackground(settings);
      saveSettings(settings);
    }
  });
  
  // Preset gradients
  document.querySelectorAll('.preset-gradient-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const [angle, color1, color2] = btn.dataset.gradient.split(',');
      settings.background.type = 'gradient';
      settings.background.gradient = { color1, color2, angle: parseInt(angle) };
      
      // Update UI
      document.querySelector('input[name="main-bg-type"][value="gradient"]').checked = true;
      document.querySelectorAll('.bg-options-group').forEach(opt => opt.classList.add('hidden'));
      document.getElementById('main-gradient-options').classList.remove('hidden');
      
      gradientColor1.value = color1;
      gradientColor1Text.value = color1;
      gradientColor2.value = color2;
      gradientColor2Text.value = color2;
      gradientAngle.value = angle;
      gradientAngleValue.textContent = angle + '°';
      
      applyBackground(settings);
      saveSettings(settings);
    });
  });
  
  // Load current settings into UI
  loadBackgroundUI();
}

function loadBackgroundUI() {
  // Ensure background settings have the new format
  if (!settings.background.gradient) {
    settings.background.gradient = { color1: '#667eea', color2: '#764ba2', angle: 135 };
  }
  if (!settings.background.solid) {
    settings.background.solid = { color: '#222222' };
  }
  if (!settings.background.image) {
    settings.background.image = { url: null, opacity: 100 };
  }
  
  // Set the active type
  document.querySelector(`input[name="main-bg-type"][value="${settings.background.type}"]`).checked = true;
  document.querySelectorAll('.bg-options-group').forEach(opt => opt.classList.add('hidden'));
  document.getElementById(`main-${settings.background.type}-options`).classList.remove('hidden');
  
  // Load gradient settings
  document.getElementById('main-gradient-color1').value = settings.background.gradient.color1;
  document.getElementById('main-gradient-color1-text').value = settings.background.gradient.color1;
  document.getElementById('main-gradient-color2').value = settings.background.gradient.color2;
  document.getElementById('main-gradient-color2-text').value = settings.background.gradient.color2;
  document.getElementById('main-gradient-angle').value = settings.background.gradient.angle;
  document.getElementById('main-gradient-angle-value').textContent = settings.background.gradient.angle + '°';
  
  // Load solid color settings
  document.getElementById('main-solid-color').value = settings.background.solid.color;
  document.getElementById('main-solid-color-text').value = settings.background.solid.color;
  
  // Load image settings
  if (settings.background.image.url) {
    document.getElementById('main-remove-bg-image').classList.remove('hidden');
  }
  document.getElementById('main-bg-image-opacity').value = settings.background.image.opacity;
  document.getElementById('main-bg-image-opacity-value').textContent = settings.background.image.opacity + '%';
  
  // Initialize modal controls after settings are loaded
  setupModalControls();
}

// Initialize background controls
setupBackgroundControls();

// Modal behavior controls function
function setupModalControls() {
  const resetModalPositionCheckbox = document.getElementById('reset-modal-position');
  
  if (resetModalPositionCheckbox && settings) {
    // Initialize checkbox state based on current settings
    // Use explicit check for the setting value
    const currentSetting = settings.resetModalPosition;
    resetModalPositionCheckbox.checked = currentSetting !== false && currentSetting !== undefined;
    
    resetModalPositionCheckbox.addEventListener('change', (e) => {
      settings.resetModalPosition = e.target.checked;
      saveSettings(settings);
    });
  }
}

// Grid controls removed - using fixed responsive grid

// New selective configuration management system
const configMode = document.getElementById('config-mode');
const configActionBtn = document.getElementById('config-action-btn');
const configImportFile = document.getElementById('config-import-file');
const configStatus = document.getElementById('config-status');
const configAllCheckbox = document.getElementById('config-all');
const configCategoryCheckboxes = document.querySelectorAll('.config-category');

// Quick action elements
const configQuickExportAll = document.getElementById('config-quick-export-all');
const configQuickImportAll = document.getElementById('config-quick-import-all');
const configQuickImportFile = document.getElementById('config-quick-import-file');

// Helper function to show status messages
function showConfigStatus(message, isError = false) {
  configStatus.textContent = message;
  configStatus.className = `config-status ${isError ? 'error' : 'success'}`;
  setTimeout(() => {
    configStatus.textContent = '';
    configStatus.className = 'config-status';
  }, 5000);
}

// Helper function to get selected categories
function getSelectedCategories() {
  const selected = [];
  configCategoryCheckboxes.forEach(checkbox => {
    if (checkbox.checked) {
      const categoryId = checkbox.id.replace('config-', '');
      selected.push(categoryId);
    }
  });
  return selected;
}

// Helper function to create settings data structure for export
async function createExportData(categories) {
  const exportData = {
    version: "0.4.0",
    exportDate: new Date().toISOString().split('T')[0],
    categories: {}
  };

  for (const category of categories) {
    switch (category) {
      case 'background':
        exportData.categories.background = settings.background;
        break;
      case 'appearance':
        exportData.categories.globalAppearance = settings.globalWidgetAppearance;
        break;
      case 'widgets':
        // Export widgets with embedded image data
        if (settings.widgets) {
          exportData.categories.widgets = await exportWidgetsWithImages(settings.widgets);
        }
        break;
      case 'sidepanel':
        exportData.categories.sidepanel = settings.sidebarSettings;
        break;
      case 'preferences':
        exportData.categories.preferences = {
          resetModalPosition: settings.resetModalPosition,
          lastColor: settings.lastColor
        };
        break;
    }
  }

  // Include IndexedDB images if widgets are being exported
  if (categories.includes('widgets') && window.storageManager) {
    try {
      exportData.imageDatabase = await window.storageManager.exportAllImages();
    } catch (error) {
      console.warn('Failed to export IndexedDB images:', error);
    }
  }

  return exportData;
}

// Helper function to export widgets with resolved image references
async function exportWidgetsWithImages(widgets) {
  const exportedWidgets = [];
  
  for (const widget of widgets) {
    const exportedWidget = { ...widget };
    
    // If this is a picture widget with an IndexedDB reference, resolve the image
    if (widget.type === 'picture' && widget.settings?.imageRef) {
      try {
        const imageRef = widget.settings.imageRef;
        if (typeof imageRef === 'object' && imageRef.type === 'indexeddb') {
          // Convert IndexedDB reference to data URL for export
          const imageData = await window.storageManager.getImage(imageRef);
          if (imageData) {
            exportedWidget.settings = {
              ...widget.settings,
              imageRef: imageData // Store as data URL in export
            };
          }
        }
      } catch (error) {
        console.warn(`Failed to resolve image for widget ${widget.type}:`, error);
      }
    }
    
    exportedWidgets.push(exportedWidget);
  }
  
  return exportedWidgets;
}

// Helper function to apply imported settings
async function applyImportedSettings(importData, selectedCategories) {
  let appliedCategories = [];

  for (const category of selectedCategories) {
    if (!importData.categories) {
      continue; // Skip if no categories in import data
    }

    switch (category) {
      case 'background':
        if (importData.categories.background) {
          settings.background = importData.categories.background;
          appliedCategories.push('Background');
        }
        break;
      case 'appearance':
        if (importData.categories.globalAppearance) {
          settings.globalWidgetAppearance = { ...defaultSettings.globalWidgetAppearance, ...importData.categories.globalAppearance };
          appliedCategories.push('Global Widget Styles');
        }
        break;
      case 'widgets':
        if (importData.categories.widgets) {
          // Process widgets and restore images if needed
          settings.widgets = await importWidgetsWithImages(importData.categories.widgets, importData.imageDatabase);
          appliedCategories.push('Widgets & Layout');
        }
        break;
      case 'sidepanel':
        // Handle both new 'sidepanel' and legacy 'sidebar' naming
        const sidepanelData = importData.categories.sidepanel || importData.categories.sidebar;
        if (sidepanelData) {
          settings.sidebarSettings = { ...defaultSettings.sidebarSettings, ...sidepanelData };
          appliedCategories.push('Sidepanel Websites');
        }
        break;
      case 'preferences':
        if (importData.categories.preferences) {
          if (importData.categories.preferences.resetModalPosition !== undefined) {
            settings.resetModalPosition = importData.categories.preferences.resetModalPosition;
          }
          if (importData.categories.preferences.lastColor !== undefined) {
            settings.lastColor = importData.categories.preferences.lastColor;
          }
          appliedCategories.push('Application Preferences');
        }
        break;
    }
  }

  return appliedCategories;
}

// Helper function to import widgets with image restoration
async function importWidgetsWithImages(widgets, imageDatabase) {
  const importedWidgets = [];
  
  for (const widget of widgets) {
    const importedWidget = { ...widget };
    
    // If this is a picture widget, process the image reference
    if (widget.type === 'picture' && widget.settings?.imageRef) {
      try {
        const imageRef = widget.settings.imageRef;
        
        // If imageRef is a data URL (from export), store it appropriately
        if (typeof imageRef === 'string' && imageRef.startsWith('data:')) {
          // Store the image using storage manager
          const storedImageRef = await window.storageManager.storeImage(imageRef);
          importedWidget.settings = {
            ...widget.settings,
            imageRef: storedImageRef
          };
        }
        // If it's already an IndexedDB reference, keep it as is
      } catch (error) {
        console.warn(`Failed to import image for widget ${widget.type}:`, error);
        // Keep the widget but without the image reference
        importedWidget.settings = {
          ...widget.settings,
          imageRef: null
        };
      }
    }
    
    importedWidgets.push(importedWidget);
  }
  
  // Import any additional images from the database
  if (imageDatabase && window.storageManager) {
    try {
      await window.storageManager.importImages(imageDatabase);
    } catch (error) {
      console.warn('Failed to import image database:', error);
    }
  }
  
  return importedWidgets;
}

// Mode change handler - updates UI based on export/import selection
configMode.addEventListener('change', () => {
  const isExport = configMode.value === 'export';
  configActionBtn.textContent = isExport ? 'Export Selected' : 'Import Selected';
  configQuickAll.textContent = isExport ? 'Quick Export All' : 'Quick Import All';
});

// All settings checkbox handler
configAllCheckbox.addEventListener('change', () => {
  const isChecked = configAllCheckbox.checked;
  configCategoryCheckboxes.forEach(checkbox => {
    checkbox.checked = isChecked;
  });
});

// Individual category checkboxes handler
configCategoryCheckboxes.forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    const allChecked = Array.from(configCategoryCheckboxes).every(cb => cb.checked);
    const noneChecked = Array.from(configCategoryCheckboxes).every(cb => !cb.checked);
    
    if (allChecked) {
      configAllCheckbox.checked = true;
      configAllCheckbox.indeterminate = false;
    } else if (noneChecked) {
      configAllCheckbox.checked = false;
      configAllCheckbox.indeterminate = false;
    } else {
      configAllCheckbox.checked = false;
      configAllCheckbox.indeterminate = true;
    }
  });
});

// Main action button handler (Export Selected / Import Selected)
configActionBtn.addEventListener('click', async () => {
  const isExport = configMode.value === 'export';
  const selectedCategories = getSelectedCategories();

  if (selectedCategories.length === 0) {
    showConfigStatus('Please select at least one category.', true);
    return;
  }

  if (isExport) {
    try {
      configActionBtn.disabled = true;
      configActionBtn.textContent = 'Exporting...';
      
      const exportData = await createExportData(selectedCategories);
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `newtab-config-${exportData.exportDate}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showConfigStatus(`Exported ${selectedCategories.length} category${selectedCategories.length > 1 ? 'ies' : ''} successfully!`);
    } catch (error) {
      showConfigStatus('Export failed. Please try again.', true);
    } finally {
      configActionBtn.disabled = false;
      configActionBtn.textContent = 'Export Selected';
    }
  } else {
    // Import mode - trigger file picker
    configImportFile.click();
  }
});


// File import handler
configImportFile.addEventListener('change', () => {
  const file = configImportFile.files[0];
  if (!file) return;

  const selectedCategories = getSelectedCategories();
  if (selectedCategories.length === 0) {
    showConfigStatus('Please select categories to import.', true);
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const importData = JSON.parse(reader.result);
      
      // Validate import data structure
      if (!importData.version || !importData.categories) {
        showConfigStatus('Invalid configuration file format.', true);
        return;
      }

      // Version compatibility check
      if (importData.version !== "0.4.0" && importData.version !== "0.3.0") {
        if (!confirm('This configuration file is from a different version. Import anyway? Some settings may not be compatible.')) {
          return;
        }
      }

      // Show loading status for imports with images
      const hasImages = importData.imageDatabase || 
        (importData.categories.widgets && 
         importData.categories.widgets.some(w => w.type === 'picture'));
      
      if (hasImages) {
        showConfigStatus('Importing settings and images...', false);
      }

      // Apply selected categories
      const appliedCategories = await applyImportedSettings(importData, selectedCategories);
      
      if (appliedCategories.length === 0) {
        showConfigStatus('No matching categories found in the configuration file.', true);
        return;
      }

      // Save and apply changes
      saveSettings(settings);
      settings = loadSettings();
      
      // Update UI to reflect changes
      applyBackground(settings);
      loadBackgroundUI();
      updateGlobalWidgetControls();
      if (typeof renderWidgets === 'function') renderWidgets();
      if (typeof initSidebarSettings === 'function') initSidebarSettings();
      
      showConfigStatus(`Successfully imported: ${appliedCategories.join(', ')}`);
      
    } catch (error) {
      console.error('Import error:', error);
      showConfigStatus('Import failed: ' + (error.message || 'Invalid JSON file or corrupted data.'), true);
    }
  };
  reader.readAsText(file);
  
  // Reset file input
  configImportFile.value = '';
});

// Quick Export All Handler
configQuickExportAll.addEventListener('click', async () => {
  try {
    configQuickExportAll.disabled = true;
    configQuickExportAll.textContent = 'Exporting...';
    
    const allCategories = ['background', 'appearance', 'widgets', 'sidepanel', 'preferences'];
    const exportData = await createExportData(allCategories);
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newtab-config-complete-${exportData.exportDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showConfigStatus('Complete configuration exported successfully!');
  } catch (error) {
    showConfigStatus('Export failed. Please try again.', true);
  } finally {
    configQuickExportAll.disabled = false;
    configQuickExportAll.textContent = 'Quick Export All';
  }
});

// Quick Import All Handler
configQuickImportAll.addEventListener('click', () => {
  configQuickImportFile.click();
});

// Quick Import File Handler
configQuickImportFile.addEventListener('change', () => {
  const file = configQuickImportFile.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const importData = JSON.parse(reader.result);
      
      // Validate import data structure
      if (!importData.version || !importData.categories) {
        showConfigStatus('Invalid configuration file format.', true);
        return;
      }

      // Version compatibility check
      if (importData.version !== "0.4.0" && importData.version !== "0.3.0") {
        if (!confirm('This configuration file is from a different version. Import anyway? Some settings may not be compatible.')) {
          return;
        }
      }

      // Show loading status for imports with images
      const hasImages = importData.imageDatabase || 
        (importData.categories.widgets && 
         importData.categories.widgets.some(w => w.type === 'picture'));
      
      if (hasImages) {
        showConfigStatus('Importing complete configuration and images...', false);
      }

      // Import all categories
      const allCategories = ['background', 'appearance', 'widgets', 'sidepanel', 'preferences'];
      const appliedCategories = await applyImportedSettings(importData, allCategories);
      
      if (appliedCategories.length === 0) {
        showConfigStatus('No valid categories found in the configuration file.', true);
        return;
      }

      // Save and apply changes
      saveSettings(settings);
      settings = loadSettings();
      
      // Update UI to reflect changes
      applyBackground(settings);
      loadBackgroundUI();
      updateGlobalWidgetControls();
      if (typeof renderWidgets === 'function') renderWidgets();
      if (typeof initSidebarSettings === 'function') initSidebarSettings();
      
      showConfigStatus(`Quick import successful! Imported: ${appliedCategories.join(', ')}`);
      
    } catch (error) {
      console.error('Quick import error:', error);
      showConfigStatus('Import failed: ' + (error.message || 'Invalid JSON file or corrupted data.'), true);
    }
  };
  reader.readAsText(file);
  
  // Reset file input
  configQuickImportFile.value = '';
});

// Global Widget Appearance Controls
function updateGlobalWidgetControls() {
  const g = settings.globalWidgetAppearance;
  
  document.getElementById('global-widget-font-size').value = g.fontSize;
  document.getElementById('global-widget-font-size-value').textContent = g.fontSize + '%';
  
  document.getElementById('global-widget-font-weight').value = g.fontWeight;
  document.getElementById('global-widget-italic').checked = g.italic;
  document.getElementById('global-widget-underline').checked = g.underline;
  document.getElementById('global-widget-text-color').value = g.textColor;
  document.getElementById('global-widget-text-opacity').value = g.textOpacity;
  document.getElementById('global-widget-text-opacity-value').textContent = g.textOpacity + '%';
  
  document.getElementById('global-widget-bg-color').value = g.backgroundColor;
  document.getElementById('global-widget-bg-opacity').value = g.backgroundOpacity;
  document.getElementById('global-widget-bg-opacity-value').textContent = g.backgroundOpacity + '%';
  document.getElementById('global-widget-blur').value = g.blur;
  document.getElementById('global-widget-blur-value').textContent = g.blur + 'px';
  document.getElementById('global-widget-border-radius').value = g.borderRadius;
  document.getElementById('global-widget-border-radius-value').textContent = g.borderRadius + 'px';
  document.getElementById('global-widget-opacity').value = g.opacity;
  document.getElementById('global-widget-opacity-value').textContent = g.opacity + '%';
  
  document.getElementById('global-widget-text-align').value = g.textAlign;
  document.getElementById('global-widget-vertical-align').value = g.verticalAlign;
  document.getElementById('global-widget-padding').value = g.padding;
  document.getElementById('global-widget-padding-value').textContent = g.padding + 'px';
}

function initGlobalWidgetControls() {
  updateGlobalWidgetControls();
  
  // Font size
  const fontSizeSlider = document.getElementById('global-widget-font-size');
  const fontSizeValue = document.getElementById('global-widget-font-size-value');
  fontSizeSlider.addEventListener('input', (e) => {
    settings.globalWidgetAppearance.fontSize = parseInt(e.target.value);
    fontSizeValue.textContent = e.target.value + '%';
    saveSettings(settings);
    if (typeof renderWidgets === 'function') renderWidgets();
  });
  
  // Font weight
  document.getElementById('global-widget-font-weight').addEventListener('change', (e) => {
    settings.globalWidgetAppearance.fontWeight = parseInt(e.target.value);
    saveSettings(settings);
    if (typeof renderWidgets === 'function') renderWidgets();
  });
  
  // Font style
  document.getElementById('global-widget-italic').addEventListener('change', (e) => {
    settings.globalWidgetAppearance.italic = e.target.checked;
    saveSettings(settings);
    if (typeof renderWidgets === 'function') renderWidgets();
  });
  
  document.getElementById('global-widget-underline').addEventListener('change', (e) => {
    settings.globalWidgetAppearance.underline = e.target.checked;
    saveSettings(settings);
    if (typeof renderWidgets === 'function') renderWidgets();
  });
  
  // Text color
  document.getElementById('global-widget-text-color').addEventListener('input', (e) => {
    settings.globalWidgetAppearance.textColor = e.target.value;
    saveSettings(settings);
    if (typeof renderWidgets === 'function') renderWidgets();
  });
  
  // Text opacity
  const textOpacitySlider = document.getElementById('global-widget-text-opacity');
  const textOpacityValue = document.getElementById('global-widget-text-opacity-value');
  textOpacitySlider.addEventListener('input', (e) => {
    settings.globalWidgetAppearance.textOpacity = parseInt(e.target.value);
    textOpacityValue.textContent = e.target.value + '%';
    saveSettings(settings);
    if (typeof renderWidgets === 'function') renderWidgets();
  });
  
  // Background color
  document.getElementById('global-widget-bg-color').addEventListener('input', (e) => {
    settings.globalWidgetAppearance.backgroundColor = e.target.value;
    saveSettings(settings);
    if (typeof renderWidgets === 'function') renderWidgets();
  });
  
  // Background opacity
  const bgOpacitySlider = document.getElementById('global-widget-bg-opacity');
  const bgOpacityValue = document.getElementById('global-widget-bg-opacity-value');
  bgOpacitySlider.addEventListener('input', (e) => {
    settings.globalWidgetAppearance.backgroundOpacity = parseInt(e.target.value);
    bgOpacityValue.textContent = e.target.value + '%';
    saveSettings(settings);
    if (typeof renderWidgets === 'function') renderWidgets();
  });
  
  // Blur
  const blurSlider = document.getElementById('global-widget-blur');
  const blurValue = document.getElementById('global-widget-blur-value');
  blurSlider.addEventListener('input', (e) => {
    settings.globalWidgetAppearance.blur = parseInt(e.target.value);
    blurValue.textContent = e.target.value + 'px';
    saveSettings(settings);
    if (typeof renderWidgets === 'function') renderWidgets();
  });
  
  // Border radius
  const borderRadiusSlider = document.getElementById('global-widget-border-radius');
  const borderRadiusValue = document.getElementById('global-widget-border-radius-value');
  borderRadiusSlider.addEventListener('input', (e) => {
    settings.globalWidgetAppearance.borderRadius = parseInt(e.target.value);
    borderRadiusValue.textContent = e.target.value + 'px';
    saveSettings(settings);
    if (typeof renderWidgets === 'function') renderWidgets();
  });
  
  // Widget opacity
  const opacitySlider = document.getElementById('global-widget-opacity');
  const opacityValue = document.getElementById('global-widget-opacity-value');
  opacitySlider.addEventListener('input', (e) => {
    settings.globalWidgetAppearance.opacity = parseInt(e.target.value);
    opacityValue.textContent = e.target.value + '%';
    saveSettings(settings);
    if (typeof renderWidgets === 'function') renderWidgets();
  });
  
  // Text alignment
  document.getElementById('global-widget-text-align').addEventListener('change', (e) => {
    settings.globalWidgetAppearance.textAlign = e.target.value;
    saveSettings(settings);
    if (typeof renderWidgets === 'function') renderWidgets();
  });
  
  // Vertical alignment
  document.getElementById('global-widget-vertical-align').addEventListener('change', (e) => {
    settings.globalWidgetAppearance.verticalAlign = e.target.value;
    saveSettings(settings);
    if (typeof renderWidgets === 'function') renderWidgets();
  });
  
  // Padding
  const paddingSlider = document.getElementById('global-widget-padding');
  const paddingValue = document.getElementById('global-widget-padding-value');
  paddingSlider.addEventListener('input', (e) => {
    settings.globalWidgetAppearance.padding = parseInt(e.target.value);
    paddingValue.textContent = e.target.value + 'px';
    saveSettings(settings);
    if (typeof renderWidgets === 'function') renderWidgets();
  });
  
  // Reset button
  document.getElementById('reset-global-widget-appearance').addEventListener('click', () => {
    settings.globalWidgetAppearance = { ...defaultSettings.globalWidgetAppearance };
    updateGlobalWidgetControls();
    saveSettings(settings);
    if (typeof renderWidgets === 'function') renderWidgets();
  });
}

// Initialize global widget controls when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGlobalWidgetControls);
} else {
  initGlobalWidgetControls();
}

// Modal drag and resize functionality
class ModalDragResize {
  constructor(modal) {
    this.modal = modal;
    this.header = modal.querySelector('.modal-header');
    this.isDragging = false;
    this.isResizing = false;
    this.hasBeenCustomized = false;
    this.wasHidden = true;
    this.dragOffset = { x: 0, y: 0 };
    this.resizeStart = { x: 0, y: 0, width: 0, height: 0 };
    
    this.init();
  }
  
  init() {
    // Make modal draggable by header
    this.header.addEventListener('mousedown', this.startDrag.bind(this));
    
    // Create custom resize handle
    this.createResizeHandle();
    
    // Global mouse events
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Observe modal visibility to reset position
    this.observer = new MutationObserver(this.handleVisibilityChange.bind(this));
    this.observer.observe(this.modal, { attributes: true, attributeFilter: ['class'] });
  }
  
  createResizeHandle() {
    this.resizeHandle = document.createElement('div');
    this.resizeHandle.className = 'modal-resize-handle';
    this.resizeHandle.style.cssText = `
      position: absolute;
      bottom: 0;
      right: 0;
      width: 20px;
      height: 20px;
      cursor: se-resize;
      z-index: 11;
    `;
    this.resizeHandle.addEventListener('mousedown', this.startResize.bind(this));
    this.modal.appendChild(this.resizeHandle);
  }
  
  startDrag(e) {
    // Don't drag if clicking on close button or other interactive elements
    if (e.target.closest('.close-button') || e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) {
      return;
    }
    
    this.isDragging = true;
    this.hasBeenCustomized = true;
    this.modal.classList.add('modal-dragging');
    
    const rect = this.modal.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    e.preventDefault();
  }
  
  startResize(e) {
    this.isResizing = true;
    this.hasBeenCustomized = true;
    this.modal.classList.add('modal-resizing');
    
    const rect = this.modal.getBoundingClientRect();
    
    // Immediately set explicit position to prevent transform-based jumping
    if (!this.modal.classList.contains('modal-positioned')) {
      this.modal.style.left = rect.left + 'px';
      this.modal.style.top = rect.top + 'px';
      this.modal.classList.add('modal-positioned');
    }
    
    this.resizeStart = {
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height
    };
    
    e.preventDefault();
    e.stopPropagation();
  }
  
  handleMouseMove(e) {
    if (this.isDragging) {
      const newX = e.clientX - this.dragOffset.x;
      const newY = e.clientY - this.dragOffset.y;
      
      // Keep modal within viewport bounds
      const maxX = window.innerWidth - this.modal.offsetWidth;
      const maxY = window.innerHeight - this.modal.offsetHeight;
      
      const clampedX = Math.max(0, Math.min(newX, maxX));
      const clampedY = Math.max(0, Math.min(newY, maxY));
      
      this.modal.style.left = clampedX + 'px';
      this.modal.style.top = clampedY + 'px';
      this.modal.classList.add('modal-positioned');
    }
    
    if (this.isResizing) {
      const deltaX = e.clientX - this.resizeStart.x;
      const deltaY = e.clientY - this.resizeStart.y;
      
      const newWidth = Math.max(300, this.resizeStart.width + deltaX);
      const newHeight = Math.max(400, this.resizeStart.height + deltaY);
      
      // Get current modal position for boundary calculations
      const modalRect = this.modal.getBoundingClientRect();
      const modalLeft = this.modal.offsetLeft || modalRect.left;
      const modalTop = this.modal.offsetTop || modalRect.top;
      
      // Keep within viewport bounds with safety margins
      const maxWidth = Math.max(300, window.innerWidth - modalLeft - 20);
      const maxHeight = Math.max(400, window.innerHeight - modalTop - 20);
      
      const finalWidth = Math.min(newWidth, maxWidth);
      const finalHeight = Math.min(newHeight, maxHeight);
      
      this.modal.style.width = finalWidth + 'px';
      this.modal.style.height = finalHeight + 'px';
      this.modal.classList.add('modal-positioned');
      
      // Update content layout
      this.updateContentLayout();
    }
  }
  
  handleMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.modal.classList.remove('modal-dragging');
    }
    
    if (this.isResizing) {
      this.isResizing = false;
      this.modal.classList.remove('modal-resizing');
    }
  }
  
  updateContentLayout() {
    const content = this.modal.querySelector('.modal-content');
    if (!content) return;
    
    const modalRect = this.modal.getBoundingClientRect();
    const aspectRatio = modalRect.width / modalRect.height;
    
    // Remove existing layout classes
    content.classList.remove('layout-wide', 'layout-narrow');
    
    // Update settings sections
    const sections = content.querySelectorAll('.settings-section');
    const groups = content.querySelectorAll('.settings-group');
    const tabContent = content.querySelectorAll('.tab-content');
    
    if (modalRect.width > 900) {
      // Wide layout
      content.classList.add('layout-wide');
      sections.forEach(section => section.classList.add('compact'));
      groups.forEach(group => group.classList.add('horizontal'));
      
      // Special handling for settings modal tabs
      if (this.modal.id === 'settings-modal') {
        tabContent.forEach(tab => {
          if (!tab.classList.contains('hidden')) {
            tab.classList.add('layout-wide');
            tab.classList.remove('layout-narrow');
          }
        });
      }
    } else {
      // Narrow layout
      content.classList.add('layout-narrow');
      sections.forEach(section => section.classList.remove('compact'));
      groups.forEach(group => group.classList.remove('horizontal'));
      
      // Special handling for settings modal tabs
      if (this.modal.id === 'settings-modal') {
        tabContent.forEach(tab => {
          tab.classList.remove('layout-wide');
          tab.classList.add('layout-narrow');
        });
      }
    }
  }
  
  handleVisibilityChange(mutations) {
    mutations.forEach(mutation => {
      if (mutation.attributeName === 'class') {
        const isHidden = this.modal.classList.contains('hidden');
        const wasJustShown = this.wasHidden && !isHidden;
        
        if (wasJustShown) {
          // Check if we should reset position based on user setting
          if (settings.resetModalPosition) {
            this.resetPosition();
          }
          this.updateContentLayout();
}


        this.wasHidden = isHidden;
      }
    });
  }
  
  resetPosition() {
    // Clear all custom positioning and sizing styles
    this.modal.style.left = '';
    this.modal.style.top = '';
    this.modal.style.width = '';
    this.modal.style.height = '';
    
    // Remove positioning class and reset state
    this.modal.classList.remove('modal-positioned');
    this.modal.classList.remove('modal-dragging');
    this.modal.classList.remove('modal-resizing');
    this.hasBeenCustomized = false;
    this.isDragging = false;
    this.isResizing = false;
  }
  
  destroy() {
    this.observer.disconnect();
    if (this.resizeHandle) {
      this.resizeHandle.remove();
    }
  }
}

// Storage Management Functionality
async function initStorageManagement() {
  const storageOptimizeBtn = document.getElementById('storage-optimize');
  const storageClearOrphanedBtn = document.getElementById('storage-clear-orphaned');
  const storageClearAllBtn = document.getElementById('storage-clear-all');
  const storageCleanupStatus = document.getElementById('storage-cleanup-status');

  // Update storage information
  await updateStorageDisplay();

  // Optimize storage
  storageOptimizeBtn?.addEventListener('click', async () => {
    try {
      storageOptimizeBtn.disabled = true;
      storageOptimizeBtn.textContent = 'Optimizing...';
      
      showStorageStatus('Optimizing storage...', 'info');
      
      const results = await window.storageManager.optimizeStorage();
      
      if (results.errors.length > 0) {
        showStorageStatus(`Optimization completed with ${results.errors.length} error(s): ${results.errors.join(', ')}`, 'error');
      } else {
        const sizeSaved = results.totalSizeBefore - results.totalSizeAfter;
        showStorageStatus(`Optimization completed! Cleaned ${results.orphanedCleaned} orphaned images, freed ${Math.round(sizeSaved/1024)}KB`, 'success');
      }
      
      await updateStorageDisplay();
      
    } catch (error) {
      showStorageStatus('Optimization failed: ' + error.message, 'error');
    } finally {
      storageOptimizeBtn.disabled = false;
      storageOptimizeBtn.textContent = 'Optimize Storage';
    }
  });

  // Clean orphaned images
  storageClearOrphanedBtn?.addEventListener('click', async () => {
    try {
      storageClearOrphanedBtn.disabled = true;
      storageClearOrphanedBtn.textContent = 'Cleaning...';
      
      const activeImageRefs = window.storageManager.getActiveImageReferences();
      const cleanedCount = await window.storageManager.cleanupOrphanedImages(activeImageRefs);
      
      showStorageStatus(`Cleaned ${cleanedCount} orphaned images`, 'success');
      await updateStorageDisplay();
      
    } catch (error) {
      showStorageStatus('Cleanup failed: ' + error.message, 'error');
    } finally {
      storageClearOrphanedBtn.disabled = false;
      storageClearOrphanedBtn.textContent = 'Clean Orphaned Images';
    }
  });

  // Clear all images
  storageClearAllBtn?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete ALL stored images? This cannot be undone and will remove images from all picture widgets.')) {
      return;
    }
    
    try {
      storageClearAllBtn.disabled = true;
      storageClearAllBtn.textContent = 'Clearing...';
      
      await window.storageManager.clearAllImages();
      
      showStorageStatus('All images cleared successfully', 'success');
      await updateStorageDisplay();
      
      // Also clear image references from settings
      if (settings.widgets) {
        settings.widgets.forEach(widget => {
          if (widget.type === 'picture') {
            widget.settings.imageRef = null;
          }
        });
        saveSettings(settings);
        if (typeof renderWidgets === 'function') renderWidgets();
      }
      
    } catch (error) {
      showStorageStatus('Clear all failed: ' + error.message, 'error');
    } finally {
      storageClearAllBtn.disabled = false;
      storageClearAllBtn.textContent = 'Clear All Images';
    }
  });
}

async function updateStorageDisplay() {
  try {
    const info = await window.storageManager.getStorageInfo();
    const stats = await window.storageManager.getStorageStats();
    
    // Update storage display
    const storageText = document.getElementById('storage-text');
    const storageDetails = document.getElementById('storage-details');
    
    if (storageText) {
      storageText.textContent = `${info.totalSizeMB}MB used`;
    }
    
    if (storageDetails) {
      storageDetails.innerHTML = `
        <strong>${info.imageCount}</strong> images stored<br>
        Using <strong>${info.totalSizeMB}MB</strong> of browser storage
      `;
    }
    
    // Update statistics
    document.getElementById('stat-image-count').textContent = stats.imageCount;
    document.getElementById('stat-avg-size').textContent = stats.averageImageSize ? `${Math.round(stats.averageImageSize/1024)}KB` : '-';
    document.getElementById('stat-largest').textContent = stats.largestImage ? `${Math.round(stats.largestImage/1024)}KB` : '-';
    document.getElementById('stat-oldest').textContent = stats.oldestImageDate || '-';
    
  } catch (error) {
    console.error('Failed to update storage display:', error);
  }
}

function showStorageStatus(message, type = 'info') {
  const statusElement = document.getElementById('storage-cleanup-status');
  if (statusElement) {
    statusElement.className = `storage-status ${type}`;
    statusElement.textContent = message;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      statusElement.className = 'storage-status';
    }, 5000);
  }
}

// Initialize drag and resize for both modals
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initModalDragResize();
    if (window.storageManager) {
      initStorageManagement();
    } else {
      // Wait for storage manager to initialize
      setTimeout(() => {
        if (window.storageManager) {
          initStorageManagement();
        }
      }, 1000);
    }
  });
} else {
  initModalDragResize();
  if (window.storageManager) {
    initStorageManagement();
  } else {
    // Wait for storage manager to initialize
    setTimeout(() => {
      if (window.storageManager) {
        initStorageManagement();
      }
    }, 1000);
  }
}

function initModalDragResize() {
  try {
    const settingsModalDragResize = new ModalDragResize(settingsModal);
    const widgetsModal = document.getElementById('widgets-panel');
    const widgetsModalDragResize = new ModalDragResize(widgetsModal);
  } catch (error) {
    console.error('Error initializing modal drag/resize:', error);
  }
}

