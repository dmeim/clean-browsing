/**
 * Unified Cross-Browser Extension API Wrapper
 * Provides consistent API across Chrome and Firefox
 * Supports both callback and Promise-based APIs
 */

(function(global) {
  'use strict';

  // Detect browser API
  const _api = (typeof browser !== 'undefined') ? browser : (typeof chrome !== 'undefined' ? chrome : undefined);
  const _isPromise = (v) => v && typeof v.then === 'function';

  // Browser detection
  const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getURL;
  const isChrome = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL;

  /**
   * Unified Extension API
   * All methods return Promises for consistency
   */
  const ExtensionAPI = {
    // Browser detection
    browser: {
      isFirefox: isFirefox,
      isChrome: isChrome,
      name: isFirefox ? 'Firefox' : isChrome ? 'Chrome' : 'Unknown'
    },

    // Storage API
    storage: {
      async get(keys) {
        if (!_api?.storage?.local?.get) return {};
        const result = _api.storage.local.get(keys);
        return _isPromise(result) ? await result : await new Promise((resolve) => _api.storage.local.get(keys, resolve));
      },

      async set(obj) {
        if (!_api?.storage?.local?.set) return;
        const result = _api.storage.local.set(obj);
        return _isPromise(result) ? await result : await new Promise((resolve) => _api.storage.local.set(obj, resolve));
      },

      async remove(keys) {
        if (!_api?.storage?.local?.remove) return;
        const result = _api.storage.local.remove(keys);
        return _isPromise(result) ? await result : await new Promise((resolve) => _api.storage.local.remove(keys, resolve));
      },

      async clear() {
        if (!_api?.storage?.local?.clear) return;
        const result = _api.storage.local.clear();
        return _isPromise(result) ? await result : await new Promise((resolve) => _api.storage.local.clear(resolve));
      }
    },

    // Runtime API
    runtime: {
      async sendMessage(message) {
        if (!_api?.runtime?.sendMessage) return {};
        const result = _api.runtime.sendMessage(message);
        return _isPromise(result) ? await result : await new Promise((resolve, reject) => {
          try { 
            _api.runtime.sendMessage(message, resolve); 
          } catch (e) { 
            reject(e); 
          }
        });
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
        if (!_api?.tabs?.create) return;
        const result = _api.tabs.create(createProperties);
        return _isPromise(result) ? await result : await new Promise((resolve) => _api.tabs.create(createProperties, resolve));
      },

      async sendMessage(tabId, message) {
        if (!_api?.tabs?.sendMessage) return;
        const result = _api.tabs.sendMessage(tabId, message);
        return _isPromise(result) ? await result : await new Promise((resolve, reject) => {
          try { 
            _api.tabs.sendMessage(tabId, message, resolve); 
          } catch (e) { 
            reject(e); 
          }
        });
      },

      onRemoved: {
        addListener(handler) {
          if (_api?.tabs?.onRemoved?.addListener) {
            _api.tabs.onRemoved.addListener(handler);
          }
        }
      },

      async executeScript(tabId, details) {
        if (!_api?.tabs?.executeScript) throw new Error('Script execution not available');
        const result = _api.tabs.executeScript(tabId, details);
        return _isPromise(result) ? await result : await new Promise((resolve, reject) => {
          _api.tabs.executeScript(tabId, details, (result) => {
            if (_api.runtime.lastError) {
              reject(new Error(_api.runtime.lastError.message));
            } else {
              resolve(result);
            }
          });
        });
      }
    },

    // Script execution with fallback between MV2 and MV3 APIs
    async executeScript({ tabId }, func) {
      // Try MV3 scripting API first (Chrome)
      if (_api?.scripting?.executeScript) {
        const result = _api.scripting.executeScript({ target: { tabId }, func });
        return _isPromise(result) ? await result : await new Promise((resolve) => _api.scripting.executeScript({ target: { tabId }, func }, resolve));
      }
      
      // Fallback to MV2 tabs API
      if (_api?.tabs?.executeScript) {
        const code = '(' + func.toString() + ')()';
        return await this.tabs.executeScript(tabId, { code });
      }
      
      throw new Error('No script execution API available');
    },

    // Windows API
    windows: {
      async create(createData) {
        if (!_api?.windows?.create) return;
        const result = _api.windows.create(createData);
        return _isPromise(result) ? await result : await new Promise((resolve) => _api.windows.create(createData, resolve));
      }
    },

    // Action/BrowserAction API (unified)
    action: {
      onClicked: {
        addListener(handler) {
          // Try MV3 action API first
          if (_api?.action?.onClicked?.addListener) {
            _api.action.onClicked.addListener(handler);
          }
          // Fallback to MV2 browserAction API
          else if (_api?.browserAction?.onClicked?.addListener) {
            _api.browserAction.onClicked.addListener(handler);
          }
        }
      }
    },

    // WebRequest API (unified approach for header modification)
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