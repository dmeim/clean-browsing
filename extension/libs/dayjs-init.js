// Day.js initialization script to avoid CSP violations
// This file initializes Day.js plugins after the library loads

(function() {
  'use strict';
  
  // Extend Day.js plugins immediately after loading
  if (typeof dayjs !== 'undefined') {
    if (window.dayjs_plugin_advancedFormat) {
      dayjs.extend(window.dayjs_plugin_advancedFormat);
    }
    if (window.dayjs_plugin_localizedFormat) {
      dayjs.extend(window.dayjs_plugin_localizedFormat);
    }
    // Verify Day.js is working
    console.log('Day.js loaded locally, version:', dayjs.version);
  } else {
    console.error('Day.js failed to load from local files');
  }
})();