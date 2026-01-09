(function initBrowserPolyfill(global) {
  'use strict';

  if (global.browser && global.browser.runtime) {
    return;
  }

  const chromeApi = global.chrome;
  if (!chromeApi || !chromeApi.runtime) {
    global.browser = global.browser || {};
    return;
  }

  function promisifyChromeApi(fn, context) {
    return function promisifiedFunction(...args) {
      return new Promise((resolve, reject) => {
        function callback(result) {
          const error = chromeApi.runtime && chromeApi.runtime.lastError;
          if (error) {
            reject(new Error(error.message));
          } else {
            resolve(result);
          }
        }

        try {
          const maybePromise = fn.apply(context, [...args, callback]);
          if (maybePromise && typeof maybePromise.then === 'function') {
            maybePromise.then(resolve, reject);
          }
        } catch (error) {
          reject(error);
        }
      });
    };
  }

  const browser = {};

  browser.runtime = {
    sendMessage: promisifyChromeApi(chromeApi.runtime.sendMessage, chromeApi.runtime),
    getURL: chromeApi.runtime.getURL ? chromeApi.runtime.getURL.bind(chromeApi.runtime) : (path) => path,
    onMessage: chromeApi.runtime.onMessage,
    onInstalled: chromeApi.runtime.onInstalled,
    lastError: chromeApi.runtime.lastError
  };

  if (chromeApi.runtime.getBrowserInfo) {
    browser.runtime.getBrowserInfo = promisifyChromeApi(chromeApi.runtime.getBrowserInfo, chromeApi.runtime);
  }

  if (chromeApi.storage && chromeApi.storage.local) {
    browser.storage = {
      local: {
        get: promisifyChromeApi(chromeApi.storage.local.get, chromeApi.storage.local),
        set: promisifyChromeApi(chromeApi.storage.local.set, chromeApi.storage.local),
        remove: promisifyChromeApi(chromeApi.storage.local.remove, chromeApi.storage.local),
        clear: promisifyChromeApi(chromeApi.storage.local.clear, chromeApi.storage.local)
      }
    };
  }

  if (chromeApi.tabs) {
    browser.tabs = {
      create: promisifyChromeApi(chromeApi.tabs.create, chromeApi.tabs),
      sendMessage: promisifyChromeApi(chromeApi.tabs.sendMessage, chromeApi.tabs),
      executeScript: promisifyChromeApi(chromeApi.tabs.executeScript, chromeApi.tabs),
      onRemoved: chromeApi.tabs.onRemoved
    };
  }

  if (chromeApi.windows) {
    browser.windows = {
      create: promisifyChromeApi(chromeApi.windows.create, chromeApi.windows)
    };
  }

  if (chromeApi.browserAction) {
    browser.browserAction = chromeApi.browserAction;
  }

  if (chromeApi.webRequest) {
    browser.webRequest = chromeApi.webRequest;
  }

  global.browser = browser;
})(typeof globalThis !== 'undefined' ? globalThis : this);
