// Shared storage management for Clean Browsing extensions
// Provides consistent storage interface across cb-newtab and cb-sidepanel

// Storage keys used across extensions
const STORAGE_KEYS = {
  NEWTAB_SETTINGS: 'newtab_settings',
  SIDEPANEL_SETTINGS: 'sidepanel_settings',
  SHARED_SETTINGS: 'shared_settings'
};

// Generic storage functions
async function loadStorageData(key, fallbackValue = {}) {
  try {
    // Try chrome.storage first (cross-extension compatibility)
    if (chrome.storage && chrome.storage.local) {
      const result = await chrome.storage.local.get([key]);
      return result[key] || fallbackValue;
    }
    // Fallback to localStorage
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallbackValue;
  } catch (error) {
    console.error(`Error loading storage data for ${key}:`, error);
    return fallbackValue;
  }
}

async function saveStorageData(key, data) {
  try {
    // Save to both chrome.storage and localStorage for compatibility
    if (chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [key]: data });
    }
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving storage data for ${key}:`, error);
  }
}

// Extension-specific storage functions
async function loadNewtabSettings() {
  try {
    const getDefaultNewtabSettings = window.DefaultSettings?.getDefaultNewtabSettings;
    if (!getDefaultNewtabSettings) {
      console.error('DefaultSettings not loaded, using minimal fallback');
      // Minimal fallback settings
      const fallbackSettings = {
        background: { type: 'gradient', gradient: { color1: '#667eea', color2: '#764ba2', angle: 135 } },
        widgets: [],
        globalWidgetAppearance: {
          fontSize: 100, fontWeight: 400, textColor: '#ffffff',
          backgroundColor: '#000000', backgroundOpacity: 20, blur: 10, borderRadius: 12
        }
      };
      return await loadStorageData(STORAGE_KEYS.NEWTAB_SETTINGS, fallbackSettings);
    }
    
    const settings = await loadStorageData(STORAGE_KEYS.NEWTAB_SETTINGS, getDefaultNewtabSettings());
    
    // Ensure settings structure is complete
    const defaults = getDefaultNewtabSettings();
    return {
      ...defaults,
      ...settings,
      globalWidgetAppearance: { ...defaults.globalWidgetAppearance, ...(settings.globalWidgetAppearance || {}) },
      widgets: (settings.widgets || defaults.widgets).map(w => ({
        ...w,
        x: w.x || 0,
        y: w.y || 0,
        w: w.w || 4,
        h: w.h || 3,
      }))
    };
  } catch (error) {
    console.error('Error loading newtab settings:', error);
    // Return absolute minimal settings to prevent crashes
    return {
      background: { type: 'gradient', gradient: { color1: '#667eea', color2: '#764ba2', angle: 135 } },
      widgets: [],
      globalWidgetAppearance: {
        fontSize: 100, fontWeight: 400, textColor: '#ffffff',
        backgroundColor: '#000000', backgroundOpacity: 20, blur: 10, borderRadius: 12,
        opacity: 100, textAlign: 'center', verticalAlign: 'center', padding: 16
      }
    };
  }
}

async function saveNewtabSettings(settings) {
  await saveStorageData(STORAGE_KEYS.NEWTAB_SETTINGS, settings);
}

async function loadSidepanelSettings() {
  try {
    const getDefaultSidepanelSettings = window.DefaultSettings?.getDefaultSidepanelSettings;
    if (!getDefaultSidepanelSettings) {
      console.error('DefaultSettings not loaded for sidepanel, using minimal fallback');
      // Minimal fallback settings
      const fallbackSettings = {
        sidebarEnabled: true,
        sidebarWebsites: [],
        sidebarBehavior: { autoClose: false, compactMode: false, showUrls: false },
        appearance: { backgroundType: 'gradient', backgroundSettings: { color1: '#667eea', color2: '#764ba2', angle: 135 } }
      };
      return await loadStorageData(STORAGE_KEYS.SIDEPANEL_SETTINGS, fallbackSettings);
    }
    
    const settings = await loadStorageData(STORAGE_KEYS.SIDEPANEL_SETTINGS, getDefaultSidepanelSettings());
    
    // Ensure settings structure is complete
    const defaults = getDefaultSidepanelSettings();
    return {
      ...defaults,
      ...settings,
      sidebarWebsites: settings.sidebarWebsites || defaults.sidebarWebsites,
      sidebarBehavior: { ...defaults.sidebarBehavior, ...(settings.sidebarBehavior || {}) }
    };
  } catch (error) {
    console.error('Error loading sidepanel settings:', error);
    // Return absolute minimal settings to prevent crashes
    return {
      sidebarEnabled: true,
      sidebarWebsites: [],
      sidebarBehavior: { autoClose: false, compactMode: false, showUrls: false },
      appearance: { backgroundType: 'gradient', backgroundSettings: { color1: '#667eea', color2: '#764ba2', angle: 135 } }
    };
  }
}

async function saveSidepanelSettings(settings) {
  await saveStorageData(STORAGE_KEYS.SIDEPANEL_SETTINGS, settings);
}

// Cross-extension communication helpers
async function getSharedStorageKey(key) {
  return await loadStorageData(`${STORAGE_KEYS.SHARED_SETTINGS}_${key}`);
}

async function setSharedStorageKey(key, value) {
  await saveStorageData(`${STORAGE_KEYS.SHARED_SETTINGS}_${key}`, value);
}

// Utility functions
function normalizeColor(color) {
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }
  return color;
}

// Export for use in extensions
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    STORAGE_KEYS,
    loadStorageData,
    saveStorageData,
    loadNewtabSettings,
    saveNewtabSettings,
    loadSidepanelSettings,
    saveSidepanelSettings,
    getSharedStorageKey,
    setSharedStorageKey,
    normalizeColor
  };
} else {
  // Browser environment - attach to window
  window.StorageManager = {
    STORAGE_KEYS,
    loadStorageData,
    saveStorageData,
    loadNewtabSettings,
    saveNewtabSettings,
    loadSidepanelSettings,
    saveSidepanelSettings,
    getSharedStorageKey,
    setSharedStorageKey,
    normalizeColor
  };
}