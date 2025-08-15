// Default settings for Clean Browsing extensions
// Shared between cb-newtab and cb-sidepanel

// Default settings for CB-NewTab extension
function getDefaultNewtabSettings() {
  return {
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
}

// Default settings for CB-Sidepanel extension
function getDefaultSidepanelSettings() {
  return {
    sidebarEnabled: true,
    sidebarWebsites: [
      {
        id: 'wikipedia',
        name: 'Wikipedia',
        url: 'https://en.wikipedia.org',
        icon: '📚',
        iconType: 'emoji',
        favicon: 'https://en.wikipedia.org/favicon.ico',
        openMode: 'iframe',
        position: 0
      },
      {
        id: 'archive',
        name: 'Internet Archive',
        url: 'https://archive.org',
        icon: '📁',
        iconType: 'emoji',
        favicon: 'https://archive.org/favicon.ico',
        openMode: 'iframe',
        position: 1
      },
      {
        id: 'chatgpt',
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        icon: '🤖',
        iconType: 'emoji',
        favicon: 'https://chat.openai.com/favicon.ico',
        openMode: 'iframe',
        position: 2
      },
      {
        id: 'claude',
        name: 'Claude',
        url: 'https://claude.ai',
        icon: '🧠',
        iconType: 'emoji',
        favicon: 'https://claude.ai/favicon.ico',
        openMode: 'iframe',
        position: 3
      },
      {
        id: 'github',
        name: 'GitHub',
        url: 'https://github.com',
        icon: '💻',
        iconType: 'emoji',
        favicon: 'https://github.com/favicon.ico',
        openMode: 'iframe',
        position: 4
      }
    ],
    sidebarBehavior: {
      autoClose: false,
      defaultOpenMode: 'iframe',
      showIcons: true,
      compactMode: false,
      useFavicons: false,
      showUrls: false
    },
    appearance: {
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
      }
    }
  };
}

// Export for use in extensions
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    getDefaultNewtabSettings,
    getDefaultSidepanelSettings
  };
} else {
  // Browser environment - attach to window
  window.DefaultSettings = {
    getDefaultNewtabSettings,
    getDefaultSidepanelSettings
  };
}