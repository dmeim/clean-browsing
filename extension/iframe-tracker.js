// Content script to track navigation within iframes for sidepanel
// This script runs in the context of iframe content to detect URL changes

(function() {
  'use strict';
  
  // Only run in iframe contexts (not main pages)
  if (window.top === window.self) {
    return;
  }
  
  let lastReportedUrl = window.location.href;
  let isTrackingEnabled = false;
  
  // Function to report URL changes to the sidepanel
  function reportUrlChange() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastReportedUrl && isTrackingEnabled && currentUrl !== 'about:blank') {
      lastReportedUrl = currentUrl;
      
      // Post message to parent frame (sidepanel)
      try {
        window.parent.postMessage({
          type: 'SIDEPANEL_URL_CHANGE',
          url: currentUrl,
          title: document.title,
          timestamp: Date.now()
        }, '*');
        
        console.log('Iframe navigation detected and reported:', currentUrl);
      } catch (e) {
        console.log('Could not post message to parent:', e);
      }
    }
  }
  
  // Listen for messages from parent to enable/disable tracking
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SIDEPANEL_ENABLE_TRACKING') {
      const wasEnabled = isTrackingEnabled;
      isTrackingEnabled = event.data.enabled || false;
      
      if (isTrackingEnabled) {
        console.log('Sidepanel URL tracking enabled for:', window.location.href);
        // Always report current URL when tracking is enabled or re-enabled
        lastReportedUrl = ''; // Reset to force reporting
        setTimeout(reportUrlChange, 100);
      } else {
        console.log('Sidepanel URL tracking disabled');
      }
    }
  });
  
  // Monitor various navigation events
  
  // History API navigation (pushState, replaceState, popstate)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(history, arguments);
    setTimeout(reportUrlChange, 50);
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    setTimeout(reportUrlChange, 50);
  };
  
  window.addEventListener('popstate', () => {
    setTimeout(reportUrlChange, 50);
  });
  
  // Hash changes
  window.addEventListener('hashchange', () => {
    setTimeout(reportUrlChange, 50);
  });
  
  // DOM content loaded
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(reportUrlChange, 100);
  });
  
  // Page load complete
  window.addEventListener('load', () => {
    setTimeout(reportUrlChange, 100);
  });
  
  // Periodic check as fallback (more frequent for better responsiveness)
  setInterval(() => {
    if (isTrackingEnabled) {
      reportUrlChange();
    }
  }, 1500); // Check every 1.5 seconds for better tracking
  
  console.log('Sidepanel iframe tracker loaded');
})();