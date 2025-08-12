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
  
  // Function to report navigation state capabilities
  function reportNavigationState() {
    if (!isTrackingEnabled) return;
    
    try {
      window.parent.postMessage({
        type: 'SIDEPANEL_NAVIGATION_STATE',
        canGoBack: window.history.length > 1 && window.history.state !== null,
        canGoForward: false, // Browser doesn't provide reliable forward detection
        url: window.location.href,
        timestamp: Date.now()
      }, '*');
    } catch (e) {
      console.log('Could not post navigation state to parent:', e);
    }
  }
  
  // Function to handle navigation commands
  function handleNavigationCommand(command) {
    try {
      switch (command) {
        case 'back':
          if (window.history.length > 1) {
            window.history.back();
            // Report URL change after navigation
            setTimeout(() => {
              reportUrlChange();
              reportNavigationState();
            }, 100);
            return { success: true };
          } else {
            return { success: false, reason: 'No history to go back' };
          }
        case 'forward':
          window.history.forward();
          // Report URL change after navigation
          setTimeout(() => {
            reportUrlChange();
            reportNavigationState();
          }, 100);
          return { success: true };
        case 'refresh':
          window.location.reload();
          return { success: true };
        default:
          return { success: false, reason: 'Unknown navigation command' };
      }
    } catch (e) {
      console.log('Navigation command failed:', e);
      return { success: false, reason: e.message };
    }
  }

  // Listen for messages from parent to enable/disable tracking and handle navigation
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SIDEPANEL_ENABLE_TRACKING') {
      const wasEnabled = isTrackingEnabled;
      isTrackingEnabled = event.data.enabled || false;
      
      if (isTrackingEnabled) {
        console.log('Sidepanel URL tracking enabled for:', window.location.href);
        // Always report current URL when tracking is enabled or re-enabled
        lastReportedUrl = ''; // Reset to force reporting
        setTimeout(() => {
          reportUrlChange();
          reportNavigationState();
        }, 100);
      } else {
        console.log('Sidepanel URL tracking disabled');
      }
    } else if (event.data && event.data.type === 'SIDEPANEL_NAVIGATE') {
      // Handle navigation commands
      const result = handleNavigationCommand(event.data.command);
      
      // Send result back to parent
      try {
        window.parent.postMessage({
          type: 'SIDEPANEL_NAVIGATION_RESULT',
          command: event.data.command,
          success: result.success,
          reason: result.reason || null,
          requestId: event.data.requestId,
          timestamp: Date.now()
        }, '*');
      } catch (e) {
        console.log('Could not send navigation result to parent:', e);
      }
    } else if (event.data && event.data.type === 'SIDEPANEL_GET_NAVIGATION_STATE') {
      // Report current navigation state
      reportNavigationState();
    }
  });
  
  // Monitor various navigation events
  
  // History API navigation (pushState, replaceState, popstate)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(history, arguments);
    setTimeout(() => {
      reportUrlChange();
      reportNavigationState();
    }, 50);
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    setTimeout(() => {
      reportUrlChange();
      reportNavigationState();
    }, 50);
  };
  
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      reportUrlChange();
      reportNavigationState();
    }, 50);
  });
  
  // Hash changes
  window.addEventListener('hashchange', () => {
    setTimeout(() => {
      reportUrlChange();
      reportNavigationState();
    }, 50);
  });
  
  // DOM content loaded
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      reportUrlChange();
      reportNavigationState();
    }, 100);
  });
  
  // Page load complete
  window.addEventListener('load', () => {
    setTimeout(() => {
      reportUrlChange();
      reportNavigationState();
    }, 100);
  });
  
  // Periodic check as fallback (more frequent for better responsiveness)
  setInterval(() => {
    if (isTrackingEnabled) {
      reportUrlChange();
    }
  }, 1500); // Check every 1.5 seconds for better tracking
  
  console.log('Sidepanel iframe tracker loaded');
})();