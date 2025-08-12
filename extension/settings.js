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
    // Also sync with chrome.storage for sidepanel access
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ sidebarSettings: s.sidebarSettings });
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
  // Also sync sidepanel settings with chrome.storage for sidepanel access
  if (chrome.storage && chrome.storage.local && s.sidebarSettings) {
    chrome.storage.local.set({ sidebarSettings: s.sidebarSettings });
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

// export / import
const exportBtn = document.getElementById('export-btn');
const exportType = document.getElementById('export-type');
const importBtn = document.getElementById('import-btn');
const importType = document.getElementById('import-type');
const importFile = document.getElementById('import-file');

exportBtn.addEventListener('click', () => {
  const data = JSON.stringify(settings);
  if (exportType.value === 'text') {
    prompt('Copy your settings JSON:', data);
  } else {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }
});

importBtn.addEventListener('click', () => {
  if (importType.value === 'text') {
    const data = prompt('Paste settings JSON:');
    if (!data) return;
    try {
      settings = JSON.parse(data);
      saveSettings(settings);
      settings = loadSettings();
      applyBackground(settings);
      updateBackgroundControls();
      if (typeof renderWidgets === 'function') renderWidgets();
      if (typeof initSidebarSettings === 'function') initSidebarSettings();
      alert('Settings imported successfully!');
    } catch {
      alert('Invalid JSON');
    }
  } else {
    importFile.click();
  }
});

importFile.addEventListener('change', () => {
  const file = importFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      settings = JSON.parse(reader.result);
      saveSettings(settings);
      settings = loadSettings();
      applyBackground(settings);
      updateBackgroundControls();
      if (typeof renderWidgets === 'function') renderWidgets();
      if (typeof initSidebarSettings === 'function') initSidebarSettings();
      alert('Settings imported successfully from file!');
    } catch {
      alert('Invalid JSON file');
    }
  };
  reader.readAsText(file);
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
    
    if (aspectRatio > 1.3 && modalRect.width > 600) {
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

// Initialize drag and resize for both modals
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initModalDragResize);
} else {
  initModalDragResize();
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

