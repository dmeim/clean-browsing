/**
 * Shared Default Settings Module
 * Contains common default settings used across multiple files
 * Prevents duplication and ensures consistency
 */

(function (global) {
  'use strict';

  // Default sidepanel settings with standardized URLs
  const getDefaultSidebarSettings = () => ({
    sidebarEnabled: true,
    sidebarWebsites: [
      {
        id: 'wikipedia',
        name: 'Wikipedia',
        url: 'https://en.wikipedia.org',
        icon: '📚',
        favicon: 'https://en.wikipedia.org/favicon.ico',
        iconType: 'favicon',
        openMode: 'iframe',
        position: 0,
      },
      {
        id: 'archive',
        name: 'Internet Archive',
        url: 'https://archive.org',
        icon: '📁',
        favicon: 'https://archive.org/favicon.ico',
        iconType: 'favicon',
        openMode: 'iframe',
        position: 1,
      },
      {
        id: 'chatgpt',
        name: 'ChatGPT',
        url: 'https://chatgpt.com',
        icon: '🤖',
        favicon: 'https://chatgpt.com/favicon.ico',
        iconType: 'favicon',
        openMode: 'iframe',
        position: 2,
      },
      {
        id: 'claude',
        name: 'Claude',
        url: 'https://claude.ai',
        icon: '🧠',
        favicon: 'https://claude.ai/favicon.ico',
        iconType: 'favicon',
        openMode: 'iframe',
        position: 3,
      },
      {
        id: 'github',
        name: 'GitHub',
        url: 'https://github.com',
        icon: '💻',
        favicon: 'https://github.com/favicon.ico',
        iconType: 'favicon',
        openMode: 'iframe',
        position: 4,
      },
    ],
    sidebarBehavior: {
      autoClose: false,
      defaultOpenMode: 'iframe',
      showIcons: true,
      compactMode: false,
      useFavicons: false,
      showUrls: false,
    },
  });

  // Export to different module systems
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = { getDefaultSidebarSettings };
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(function () {
      return { getDefaultSidebarSettings };
    });
  } else {
    // Browser global
    global.DefaultSettings = { getDefaultSidebarSettings };
  }
})(this);
