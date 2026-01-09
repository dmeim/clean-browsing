/**
 * Sidepanel UI Components
 * Contains HTML and CSS generation for the sidepanel
 * Extracted from sidepanel-injector.js for better maintainability
 */

(function (global) {
  'use strict';

  function getSidepanelHTML() {
    return `
      <div class="sidepanel-resize-handle" title="Drag to resize">
        <div class="resize-indicator"></div>
      </div>
      
      <div class="sidepanel-content">
        <!-- Header -->
        <div class="sidepanel-header">
          <div class="header-title">
            <span>Quick Access</span>
          </div>
          <button id="sidepanel-settings-btn" class="icon-btn" title="Settings">⚙️</button>
          <button id="sidepanel-close-btn" class="icon-btn" title="Close Panel">✕</button>
        </div>

        <!-- Website List -->
        <div id="website-list" class="website-list">
          <!-- Websites will be dynamically added here -->
        </div>

        <!-- Iframe Container -->
        <div id="iframe-container" class="iframe-container hidden">
          <div class="iframe-header">
            <button id="back-to-list" class="icon-btn" title="Back to list">←</button>
            <div class="iframe-info">
              <span id="iframe-title"></span>
              <span id="iframe-current-url">Loading...</span>
            </div>
            <div class="iframe-navigation">
              <button id="nav-back" class="nav-btn" title="Back">⬅</button>
              <button id="nav-refresh" class="nav-btn" title="Refresh">↻</button>
            </div>
            <button id="open-in-tab" class="icon-btn" title="Open in new tab">↗</button>
          </div>
          <iframe id="website-iframe"></iframe>
        </div>
        
        <!-- Settings Modal -->
        <div id="settings-modal" class="settings-modal hidden">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Sidepanel Settings</h2>
              <button id="close-settings" class="icon-btn" title="Close">✕</button>
            </div>
          
          <div class="settings-tabs">
            <button data-tab="add-website" class="tab-btn active">Add Website</button>
            <button data-tab="manage-websites" class="tab-btn">Manage</button>
            <button data-tab="behavior" class="tab-btn">Behavior</button>
            <button data-tab="appearance" class="tab-btn">Appearance</button>
          </div>
          
            <div class="modal-body">
            <div id="add-website-tab" class="tab-content">
              <div class="form-group">
                <label>Name:</label>
                <input type="text" id="website-name" placeholder="e.g., ChatGPT">
              </div>
              <div class="form-group">
                <label>URL:</label>
                <input type="url" id="website-url" placeholder="https://example.com">
              </div>
              <div class="form-group">
                <label>Icon Type:</label>
                <div class="icon-type-selector" style="display:flex; gap:12px;">
                  <label class="icon-type-option" style="display:flex; align-items:center; gap:6px;">
                    <input type="radio" name="icon-type" value="favicon" checked>
                    <span>Favicon</span>
                  </label>
                  <label class="icon-type-option" style="display:flex; align-items:center; gap:6px;">
                    <input type="radio" name="icon-type" value="emoji">
                    <span>Emoji</span>
                  </label>
                  <label class="icon-type-option" style="display:flex; align-items:center; gap:6px;">
                    <input type="radio" name="icon-type" value="none">
                    <span>No Icon</span>
                  </label>
                </div>
              </div>
              <div class="form-group" id="emoji-input-group" style="display: none;">
                <label>Icon (emoji):</label>
                <input type="text" id="website-icon" placeholder="🌐" maxlength="2">
              </div>
              <div class="form-group">
                <label>Open Mode:</label>
                <select id="website-mode">
                  <option value="iframe" selected>Embedded (iframe)</option>
                  <option value="newtab">New Tab</option>
                  <option value="newwindow">New Window</option>
                </select>
              </div>
              <button id="add-website-btn" class="primary-btn">Add Website</button>
            </div>
            
            <div id="manage-websites-tab" class="tab-content hidden">
              <div id="manage-websites-list"></div>
            </div>
            
            <div id="behavior-tab" class="tab-content hidden">
              <div class="form-group checkbox-group" style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="auto-close">
                <label for="auto-close">Auto-close sidepanel after opening link</label>
              </div>
              <div class="form-group checkbox-group" style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="show-urls">
                <label for="show-urls">Show URLs in website list</label>
              </div>
              <div class="form-group checkbox-group" style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="compact-mode">
                <label for="compact-mode">Compact mode</label>
              </div>
            </div>

            <div id="appearance-tab" class="tab-content hidden">
              <div class="form-group">
                <label>Background Type:</label>
                <div class="icon-type-selector" style="display:flex; gap:12px;">
                  <label class="icon-type-option" style="display:flex; align-items:center; gap:6px;">
                    <input type="radio" name="bg-type" value="gradient" checked>
                    <span>Gradient</span>
                  </label>
                  <label class="icon-type-option" style="display:flex; align-items:center; gap:6px;">
                    <input type="radio" name="bg-type" value="solid">
                    <span>Solid Color</span>
                  </label>
                  <label class="icon-type-option" style="display:flex; align-items:center; gap:6px;">
                    <input type="radio" name="bg-type" value="image">
                    <span>Image</span>
                  </label>
                </div>
              </div>
              <div id="gradient-options" class="bg-options">
                <div class="form-group">
                  <label for="gradient-color1">Start Color:</label>
                  <input type="color" id="gradient-color1" value="#667eea" style="margin-right:8px;">
                  <input type="text" id="gradient-color1-text" value="#667eea" placeholder="#667eea">
                </div>
                <div class="form-group">
                  <label for="gradient-color2">End Color:</label>
                  <input type="color" id="gradient-color2" value="#764ba2" style="margin-right:8px;">
                  <input type="text" id="gradient-color2-text" value="#764ba2" placeholder="#764ba2">
                </div>
                <div class="form-group">
                  <label for="gradient-angle">Angle:</label>
                  <input type="range" id="gradient-angle" min="0" max="360" value="135" style="margin:0 8px;">
                  <span id="gradient-angle-value">135°</span>
                </div>
              </div>
              <div id="solid-options" class="bg-options hidden">
                <div class="form-group">
                  <label for="solid-color">Background Color:</label>
                  <input type="color" id="solid-color" value="#667eea" style="margin-right:8px;">
                  <input type="text" id="solid-color-text" value="#667eea" placeholder="#667eea">
                </div>
              </div>
              <div id="image-options" class="bg-options hidden">
                <div class="form-group">
                  <label for="bg-image-upload">Background Image:</label>
                  <input type="file" id="bg-image-upload" accept="image/*" style="margin-left:8px;">
                  <button id="remove-bg-image" class="icon-btn" style="display:none; margin-left:8px;">Remove</button>
                </div>
                <div class="form-group">
                  <label for="bg-image-opacity">Image Opacity:</label>
                  <input type="range" id="bg-image-opacity" min="0" max="100" value="100" style="margin:0 8px;">
                  <span id="bg-image-opacity-value">100%</span>
                </div>
              </div>
            </div>
            <div class="modal-footer" style="padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.1); display:flex; justify-content:flex-end;">
              <button id="save-settings" class="primary-btn">Save Settings</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Website Modal -->
      <div id="edit-website-modal" class="settings-modal hidden">
        <div class="modal-content edit-modal">
          <div class="modal-header">
            <h2>Edit Website</h2>
            <button id="close-edit" class="icon-btn">✕</button>
          </div>
          <div class="modal-body">
            <div class="settings-section">
              <div class="form-group">
                <label for="edit-website-name">Name:</label>
                <input type="text" id="edit-website-name" placeholder="e.g., ChatGPT">
              </div>
              <div class="form-group">
                <label for="edit-website-url">URL:</label>
                <input type="url" id="edit-website-url" placeholder="https://example.com">
              </div>
              <div class="form-group">
                <label>Icon Type:</label>
                <div class="icon-type-selector">
                  <label class="icon-type-option"><input type="radio" name="edit-icon-type" value="favicon"><span>Favicon</span></label>
                  <label class="icon-type-option"><input type="radio" name="edit-icon-type" value="emoji"><span>Emoji</span></label>
                  <label class="icon-type-option"><input type="radio" name="edit-icon-type" value="none"><span>No Icon</span></label>
                </div>
              </div>
              <div class="form-group" id="edit-emoji-input-group" style="display:none;">
                <label for="edit-website-icon">Icon (emoji):</label>
                <input type="text" id="edit-website-icon" placeholder="🌐" maxlength="2">
              </div>
              <div class="form-group">
                <label for="edit-website-mode">Open Mode:</label>
                <select id="edit-website-mode">
                  <option value="iframe">Embedded (iframe)</option>
                  <option value="newtab">New Tab</option>
                  <option value="newwindow">New Window</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button id="save-edit" class="primary-btn">Save</button>
          </div>
        </div>
      </div>
      </div>
    `;
  }

  function getShadowDOMStyles() {
    return `
      /* CSS Reset for Shadow DOM */
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      /* Sidepanel Container */
      .sidepanel-container {
        display: flex;
        flex-direction: row;
        height: 100vh;
        width: 100%;
        background: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        color: #ffffff;
      }
      
      /* Resize Handle */
      .sidepanel-resize-handle {
        width: 6px;
        background: rgba(255, 255, 255, 0.1);
        cursor: ew-resize;
        border-right: 1px solid rgba(255, 255, 255, 0.2);
        transition: background-color 0.2s ease;
        flex-shrink: 0;
        position: relative;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .sidepanel-resize-handle:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .resize-indicator {
        width: 3px;
        height: 30px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
      }
      
      /* Sidepanel Content */
      .sidepanel-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100vh;
        min-width: 280px;
      }
      
      /* Header */
      .sidepanel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.4);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
        gap: 8px;
      }
      
      .header-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        min-width: 0;
        flex: 1;
      }
      
      .header-title span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      /* Buttons */
      .icon-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #ffffff;
        padding: 8px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        min-height: 36px;
        flex-shrink: 0;
        line-height: 1;
      }
      
      .icon-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }
      
      /* Website List */
      .website-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .website-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        min-height: 44px;
        margin-bottom: 6px;
      }
      
      .website-item:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateX(2px);
      }
      
      /* Iframe Container */
      .iframe-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: rgba(0, 0, 0, 0.1);
      }
      
      .iframe-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.4);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        min-height: 40px;
      }
      
      .iframe-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      
      #iframe-title {
        font-weight: 500;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      #iframe-current-url {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.7);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
        transition: color 0.2s ease;
      }
      
      #iframe-current-url:hover {
        color: rgba(255, 255, 255, 0.9);
      }
      
      #website-iframe {
        flex: 1;
        width: 100%;
        border: none;
        background: #ffffff;
      }
      
      /* Settings Modal */
      .settings-modal {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
      }
      
      .modal-content {
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        width: calc(100% - 24px);
        max-width: none;
        max-height: calc(100% - 24px);
        overflow: auto;
        color: #ffffff;
        margin: 12px;
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .modal-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .settings-tabs {
        display: flex;
        background: rgba(0, 0, 0, 0.3);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .tab-btn {
        flex: 1;
        padding: 14px 16px;
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        font-size: 14px;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        line-height: 1.2;
      }
      
      .tab-btn.active {
        color: #ffffff;
        border-bottom: 2px solid #6c63ff;
      }
      
      .tab-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }
      
      .modal-body {
        padding: 20px;
        max-height: 400px;
        overflow-y: auto;
      }
      
      .tab-content {
        display: block;
      }
      
      .form-group {
        margin-bottom: 16px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
      }
      
      input[type="text"], input[type="url"] {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        font-size: 14px;
        box-sizing: border-box;
      }
      
      input[type="text"]:focus, input[type="url"]:focus {
        border-color: #6c63ff;
        outline: none;
        box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.2);
      }
      
      .primary-btn {
        background: #6c63ff;
        color: #ffffff;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        font-size: 14px;
        width: 100%;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        line-height: 1.2;
      }
      
      .primary-btn:hover {
        background: #5a52d5;
        transform: translateY(-1px);
      }
      
      /* Utility classes */
      .hidden {
        display: none !important;
      }
      
      /* Scrollbar */
      .website-list::-webkit-scrollbar {
        width: 6px;
      }
      
      .website-list::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
      }
      
      .website-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
      }
      
      .website-list::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
      }
    `;
  }

  // Export to different module systems
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = { getSidepanelHTML, getShadowDOMStyles };
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(function () {
      return { getSidepanelHTML, getShadowDOMStyles };
    });
  } else {
    // Browser global
    global.SidepanelUI = { getSidepanelHTML, getShadowDOMStyles };
  }
})(this);
