// Split-view container management for embedded sidepanel
// Handles layout, resizing, and basic toggle functionality

class SplitViewManager {
  constructor() {
    this.appContainer = null;
    this.sidepanelContainer = null;
    this.resizeHandle = null;
    this.isOpen = false;
    this.sidepanelWidth = 400; // Default width
    this.minSidepanelWidth = 300;
    this.maxSidepanelWidth = 800;
    this.isResizing = false;

    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupElements());
    } else {
      this.setupElements();
    }
  }

  setupElements() {
    this.appContainer = document.getElementById('app-container');
    this.sidepanelContainer = document.getElementById('sidepanel-container');
    this.resizeHandle = document.querySelector('.sidepanel-resize-handle');

    if (!this.appContainer || !this.sidepanelContainer || !this.resizeHandle) {
      console.error('Split-view elements not found');
      return;
    }

    this.setupEventListeners();
    this.loadState();
    this.updateLayout();
  }

  setupEventListeners() {
    // Close button
    const closeButton = document.getElementById('sidepanel-close-btn');

    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.close();
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        this.toggle();
      }

      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Resize handle
    this.setupResizeHandlers();

    // Window resize
    window.addEventListener('resize', () => {
      this.updateLayout();
    });
  }

  setupResizeHandlers() {
    let startX = 0;
    let startWidth = 0;

    const handleMouseDown = (e) => {
      if (!this.isOpen) return;

      this.isResizing = true;
      startX = e.clientX;
      startWidth = this.sidepanelWidth;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';

      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!this.isResizing) return;

      const deltaX = startX - e.clientX; // Negative because we're dragging from right
      const newWidth = Math.max(
        this.minSidepanelWidth,
        Math.min(this.maxSidepanelWidth, startWidth + deltaX)
      );

      this.sidepanelWidth = newWidth;
      this.updateLayout();
    };

    const handleMouseUp = () => {
      if (!this.isResizing) return;

      this.isResizing = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      this.saveState();
    };

    this.resizeHandle.addEventListener('mousedown', handleMouseDown);

    // Touch support for mobile
    this.resizeHandle.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      handleMouseDown({ clientX: touch.clientX, preventDefault: () => e.preventDefault() });
    });

    document.addEventListener('touchmove', (e) => {
      if (this.isResizing && e.touches.length > 0) {
        const touch = e.touches[0];
        handleMouseMove({ clientX: touch.clientX });
      }
    });

    document.addEventListener('touchend', () => {
      if (this.isResizing) {
        handleMouseUp();
      }
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.updateLayout();
    this.saveState();

    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent('sidepanel-opened', {
        detail: { width: this.sidepanelWidth },
      })
    );
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.updateLayout();
    this.saveState();

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('sidepanel-closed'));
  }

  updateLayout() {
    if (!this.appContainer || !this.sidepanelContainer) return;

    if (this.isOpen) {
      // Open state
      this.appContainer.style.gridTemplateColumns = `1fr ${this.sidepanelWidth}px`;
      this.sidepanelContainer.classList.remove('sidepanel-closed');
      this.sidepanelContainer.classList.add('sidepanel-open');
    } else {
      // Closed state
      this.appContainer.style.gridTemplateColumns = '1fr 0';
      this.sidepanelContainer.classList.remove('sidepanel-open');
      this.sidepanelContainer.classList.add('sidepanel-closed');
    }
  }

  saveState() {
    try {
      const state = {
        isOpen: this.isOpen,
        width: this.sidepanelWidth,
        timestamp: Date.now(),
      };
      localStorage.setItem('splitViewState', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save split-view state:', error);
    }
  }

  loadState() {
    try {
      const savedState = localStorage.getItem('splitViewState');
      if (savedState) {
        const state = JSON.parse(savedState);

        // Validate saved width
        if (state.width >= this.minSidepanelWidth && state.width <= this.maxSidepanelWidth) {
          this.sidepanelWidth = state.width;
        }

        // Don't automatically open on load unless explicitly saved as open
        // this.isOpen = state.isOpen === true;
        this.isOpen = false; // Always start closed
      }
    } catch (error) {
      console.error('Failed to load split-view state:', error);
      this.isOpen = false;
      this.sidepanelWidth = 400;
    }
  }

  // Public API methods
  getSidepanelWidth() {
    return this.sidepanelWidth;
  }

  setSidepanelWidth(width) {
    const clampedWidth = Math.max(this.minSidepanelWidth, Math.min(this.maxSidepanelWidth, width));

    if (clampedWidth !== this.sidepanelWidth) {
      this.sidepanelWidth = clampedWidth;
      if (this.isOpen) {
        this.updateLayout();
        this.saveState();
      }
    }
  }

  isSidepanelOpen() {
    return this.isOpen;
  }

  // Responsive behavior
  handleResponsiveLayout() {
    const viewportWidth = window.innerWidth;

    // Auto-close on small screens
    if (viewportWidth < 768 && this.isOpen) {
      this.close();
    }

    // Adjust max width based on viewport
    this.maxSidepanelWidth = Math.min(800, viewportWidth * 0.6);

    // Adjust current width if it exceeds new max
    if (this.sidepanelWidth > this.maxSidepanelWidth) {
      this.setSidepanelWidth(this.maxSidepanelWidth);
    }
  }
}

// Initialize split-view manager
let splitViewManager;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    splitViewManager = new SplitViewManager();
    window.splitViewManager = splitViewManager; // Export AFTER creation

    // Add responsive listener
    window.addEventListener('resize', () => {
      if (splitViewManager) {
        splitViewManager.handleResponsiveLayout();
      }
    });
  });
} else {
  splitViewManager = new SplitViewManager();
  window.splitViewManager = splitViewManager; // Export AFTER creation

  // Add responsive listener
  window.addEventListener('resize', () => {
    if (splitViewManager) {
      splitViewManager.handleResponsiveLayout();
    }
  });
}
