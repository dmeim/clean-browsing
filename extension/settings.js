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
  background: { type: 'color', value: '#222222' },
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
}

function applyBackground(s) {
  if (s.background.type === 'color') {
    document.body.style.background = s.background.value;
  } else if (s.background.type === 'image') {
    document.body.style.background = `url(${s.background.value}) center/cover no-repeat`;
  }
}

let settings = loadSettings();
applyBackground(settings);

// Grid is now fixed and responsive - no user configuration needed

function updateBackgroundControls() {
  if (settings.background.type === 'image') {
    colorPicker.value = settings.lastColor || defaultSettings.lastColor;
    removeImageBtn.classList.remove('hidden');
  } else {
    colorPicker.value = settings.background.value;
    removeImageBtn.classList.add('hidden');
  }
}

// background controls
const colorPicker = document.getElementById('bg-color-picker');
const imagePicker = document.getElementById('bg-image-picker');
const removeImageBtn = document.getElementById('remove-bg-image');

updateBackgroundControls();

colorPicker.addEventListener('input', (e) => {
  settings.background = { type: 'color', value: e.target.value };
  settings.lastColor = e.target.value;
  applyBackground(settings);
  saveSettings(settings);
  updateBackgroundControls();
});

imagePicker.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    settings.background = { type: 'image', value: reader.result };
    applyBackground(settings);
    saveSettings(settings);
    updateBackgroundControls();
  };
  reader.readAsDataURL(file);
});

removeImageBtn.addEventListener('click', () => {
  settings.background = { type: 'color', value: settings.lastColor || defaultSettings.lastColor };
  applyBackground(settings);
  saveSettings(settings);
  imagePicker.value = '';
  updateBackgroundControls();
});

// Modal behavior controls
const resetModalPositionCheckbox = document.getElementById('reset-modal-position');

// Initialize checkbox state
resetModalPositionCheckbox.checked = settings.resetModalPosition !== false;

resetModalPositionCheckbox.addEventListener('change', (e) => {
  settings.resetModalPosition = e.target.checked;
  saveSettings(settings);
});

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
      
      // Keep within viewport bounds
      const maxWidth = window.innerWidth - this.modal.offsetLeft;
      const maxHeight = window.innerHeight - this.modal.offsetTop;
      
      this.modal.style.width = Math.min(newWidth, maxWidth) + 'px';
      this.modal.style.height = Math.min(newHeight, maxHeight) + 'px';
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
    this.modal.style.left = '';
    this.modal.style.top = '';
    this.modal.style.width = '';
    this.modal.style.height = '';
    this.modal.classList.remove('modal-positioned');
    this.hasBeenCustomized = false;
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

