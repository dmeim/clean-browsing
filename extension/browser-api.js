(function initExtensionAPI(global) {
  'use strict';

  // Normalise the extension API – the polyfill ensures `browser` exists.
  const _api = (typeof browser !== 'undefined') ? browser : undefined;

  if (!_api) {
    throw new Error('Clean-Browsing: browser API unavailable');
  }

  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent.toLowerCase() : '';
  const isFirefox = /(firefox|waterfox|iceweasel|seamonkey|zen|librewolf)/i.test(ua);
  const browserName = isFirefox ? 'Firefox-family' : 'Unknown';

  const ExtensionAPI = {
    // Browser detection
    browser: {
      isFirefox,
      name: browserName
    },

    // Storage API
    storage: {
      async get(keys) {
        if (!_api?.storage?.local?.get) {
          return {};
        }
        return await _api.storage.local.get(keys);
      },

      async set(obj) {
        if (!_api?.storage?.local?.set) {
          return;
        }
        return await _api.storage.local.set(obj);
      },

      async remove(keys) {
        if (!_api?.storage?.local?.remove) {
          return;
        }
        return await _api.storage.local.remove(keys);
      },

      async clear() {
        if (!_api?.storage?.local?.clear) {
          return;
        }
        return await _api.storage.local.clear();
      }
    },

    // Runtime API
    runtime: {
      async sendMessage(message) {
        if (!_api?.runtime?.sendMessage) {
          return {};
        }
        return await _api.runtime.sendMessage(message);
      },

      onMessage: {
        addListener(handler) {
          if (_api?.runtime?.onMessage?.addListener) {
            _api.runtime.onMessage.addListener(handler);
          }
        }
      },

      getURL(path) {
        return _api?.runtime?.getURL ? _api.runtime.getURL(path) : path;
      }
    },

    // Tabs API
    tabs: {
      async create(createProperties) {
        if (!_api?.tabs?.create) {
          return;
        }
        return await _api.tabs.create(createProperties);
      },

      async sendMessage(tabId, message) {
        if (!_api?.tabs?.sendMessage) {
          return;
        }
        return await _api.tabs.sendMessage(tabId, message);
      },

      onRemoved: {
        addListener(handler) {
          if (_api?.tabs?.onRemoved?.addListener) {
            _api.tabs.onRemoved.addListener(handler);
          }
        }
      },

      async executeScript(tabId, details) {
        if (!_api?.tabs?.executeScript) {
          throw new Error('Script execution not available');
        }
        return await _api.tabs.executeScript(tabId, details);
      }
    },

    // Script execution helper for inline functions
    async executeScript({ tabId }, func) {
      if (!_api?.tabs?.executeScript) {
        throw new Error('No script execution API available');
      }

      const code = '(' + func.toString() + ')()';
      return await _api.tabs.executeScript(tabId, { code });
    },

    // Windows API
    windows: {
      async create(createData) {
        if (!_api?.windows?.create) {
          return;
        }
        return await _api.windows.create(createData);
      }
    },

    // BrowserAction API
    action: {
      onClicked: {
        addListener(handler) {
          if (_api?.browserAction?.onClicked?.addListener) {
            _api.browserAction.onClicked.addListener(handler);
          }
        }
      }
    },

    sidebarAction: {
      get isSupported() {
        return !!_api?.sidebarAction;
      },

      async open(windowId) {
        if (!_api?.sidebarAction?.open) {
          throw new Error('Sidebar action not available');
        }
        const args = typeof windowId === 'number' ? { windowId } : undefined;
        if (args) {
          await _api.sidebarAction.open(args);
        } else {
          await _api.sidebarAction.open();
        }
      },

      async close(windowId) {
        if (!_api?.sidebarAction?.close) {
          throw new Error('Sidebar action not available');
        }
        const args = typeof windowId === 'number' ? { windowId } : undefined;
        if (args) {
          await _api.sidebarAction.close(args);
        } else {
          await _api.sidebarAction.close();
        }
      },

      async isOpen(windowId) {
        if (!_api?.sidebarAction?.isOpen) {
          return false;
        }
        const args = typeof windowId === 'number' ? { windowId } : {};
        return await _api.sidebarAction.isOpen(args);
      },

      async toggle(windowId) {
        if (!this.isSupported) {
          throw new Error('Sidebar action not available');
        }
        const open = await this.isOpen(windowId);
        if (open) {
          await this.close(windowId);
          return false;
        }
        await this.open(windowId);
        return true;
      }
    },

    // WebRequest API
    webRequest: {
      onHeadersReceived: {
        addListener(listener, filter, extraInfoSpec) {
          if (_api?.webRequest?.onHeadersReceived?.addListener) {
            _api.webRequest.onHeadersReceived.addListener(listener, filter, extraInfoSpec);
          }
        }
      },

      onBeforeRedirect: {
        addListener(listener, filter) {
          if (_api?.webRequest?.onBeforeRedirect?.addListener) {
            _api.webRequest.onBeforeRedirect.addListener(listener, filter);
          }
        }
      }
    }
  };

  // Export API
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = ExtensionAPI;
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(function() { return ExtensionAPI; });
  } else {
    // Browser global
    global.ExtensionAPI = ExtensionAPI;
  }

})(this);
