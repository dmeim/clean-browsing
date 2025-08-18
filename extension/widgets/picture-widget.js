// Picture Widget Implementation
(function() {
  'use strict';

  async function renderPictureWidget(widget, index) {
    const container = createWidgetContainer(widget, index, 'picture-widget');
    
    // Apply appearance styling
    applyWidgetAppearance(container, widget);
    
    // Override container padding for picture widgets to have complete control
    container.style.padding = '0';
    
    // Set up jiggle mode controls
    setupJiggleModeControls(container, widget, index);
    
    // Backward compatibility: convert borderRadius to padding
    if (widget.settings?.borderRadius !== undefined && widget.settings?.padding === undefined) {
      widget.settings.padding = widget.settings.borderRadius;
      delete widget.settings.borderRadius;
    }
    
    // Get user-defined padding (default to 0)
    const userPadding = widget.settings?.padding || 0;
    
    // Create image container with consistent absolute positioning
    const imageContainer = document.createElement('div');
    imageContainer.className = 'picture-widget-container';
    imageContainer.style.cssText = `
      position: absolute;
      top: ${userPadding}px;
      left: ${userPadding}px;
      right: ${userPadding}px;
      bottom: ${userPadding}px;
      overflow: hidden;
      border-radius: inherit;
    `;
    
    // Create image element
    const img = document.createElement('img');
    img.className = 'picture-widget-image';
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: ${widget.settings?.fit || 'cover'};
      object-position: ${widget.settings?.positionX || 50}% ${widget.settings?.positionY || 50}%;
      opacity: ${(widget.settings?.opacity || 100) / 100};
      transition: opacity 0.3s ease;
    `;
    
    // Create placeholder for when no image is set
    const placeholder = document.createElement('div');
    placeholder.className = 'picture-widget-placeholder';
    placeholder.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      border: 2px dashed rgba(255, 255, 255, 0.3);
      border-radius: inherit;
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      text-align: center;
      cursor: pointer;
    `;
    placeholder.innerHTML = `
      <div>
        <div style="font-size: 24px; margin-bottom: 8px;">🖼️</div>
        <div>Click to add image</div>
      </div>
    `;
    
    // Load and display image
    async function loadImage() {
      const imageRef = widget.settings?.imageRef;
      if (!imageRef) {
        img.style.display = 'none';
        placeholder.style.display = 'flex';
        return;
      }
      
      try {
        let imageData;
        if (typeof imageRef === 'string' && imageRef.startsWith('data:')) {
          // Direct data URL
          imageData = imageRef;
        } else {
          // Load from storage manager
          imageData = await window.storageManager.getImage(imageRef);
        }
        
        if (imageData) {
          img.src = imageData;
          img.style.display = 'block';
          placeholder.style.display = 'none';
          
          // Add error handling
          img.onerror = () => {
            console.error('Failed to load image for picture widget');
            img.style.display = 'none';
            placeholder.style.display = 'flex';
            placeholder.innerHTML = `
              <div>
                <div style="font-size: 24px; margin-bottom: 8px;">❌</div>
                <div>Image failed to load</div>
              </div>
            `;
          };
        } else {
          img.style.display = 'none';
          placeholder.style.display = 'flex';
        }
      } catch (error) {
        console.error('Error loading picture widget image:', error);
        img.style.display = 'none';
        placeholder.style.display = 'flex';
      }
    }
    
    // Add click handler for placeholder
    placeholder.addEventListener('click', (e) => {
      e.stopPropagation();
      openPictureConfig(widget, index);
    });
    
    imageContainer.appendChild(img);
    imageContainer.appendChild(placeholder);
    container.appendChild(imageContainer);
    widgetGrid.appendChild(container);
    
    // Load the image
    await loadImage();
    
    // Store reference for potential updates
    container.pictureWidgetUpdate = loadImage;
  }

  function addPictureWidget(options = {}) {
    const widget = {
      type: 'picture',
      x: 0,
      y: 0,
      w: 4,
      h: 4,
      settings: {
        imageRef: options.imageRef || null,
        fit: options.fit || 'cover',
        opacity: options.opacity || 100,
        padding: options.padding || 0,
        positionX: options.positionX || 50,
        positionY: options.positionY || 50
      }
    };
    settings.widgets.push(widget);
    saveAndRender();
  }

  function openPictureConfig(existing, index) {
    const isEdit = !!existing;
    const targetContainer = isEdit ? document.getElementById('widget-settings-tab') : widgetList;
    
    // Backward compatibility: handle existing borderRadius property
    if (existing && existing.settings?.borderRadius !== undefined && existing.settings?.padding === undefined) {
      existing.settings.padding = existing.settings.borderRadius;
      delete existing.settings.borderRadius;
    }
    
    targetContainer.innerHTML = `
      <h3>${isEdit ? 'Edit Picture Widget' : 'Picture Widget'}</h3>
      
      <div class="input-group">
        <label for="picture-upload">Image Upload:</label>
        <input type="file" id="picture-upload" accept="image/*" class="file-input">
        <div id="picture-preview" class="picture-preview" style="
          margin-top: 10px;
          width: 100%;
          height: 150px;
          border: 2px dashed #ccc;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9f9f9;
          color: #666;
          cursor: pointer;
        ">
          <div id="picture-preview-content">
            <div style="font-size: 24px; margin-bottom: 8px;">🖼️</div>
            <div>Click to select image or drag & drop</div>
          </div>
        </div>
      </div>
      
      <div class="input-group">
        <label for="picture-fit">Image Fit:</label>
        <select id="picture-fit" class="settings-select">
          <option value="cover" ${!existing || existing.settings.fit === 'cover' ? 'selected' : ''}>Cover (fill frame)</option>
          <option value="contain" ${existing && existing.settings.fit === 'contain' ? 'selected' : ''}>Contain (fit within frame)</option>
          <option value="fill" ${existing && existing.settings.fit === 'fill' ? 'selected' : ''}>Fill (stretch to fit)</option>
          <option value="none" ${existing && existing.settings.fit === 'none' ? 'selected' : ''}>None (original size)</option>
        </select>
      </div>
      
      <div class="input-group">
        <label for="picture-opacity">Opacity: <span id="picture-opacity-value">${existing?.settings?.opacity || 100}%</span></label>
        <input type="range" id="picture-opacity" min="10" max="100" step="5" value="${existing?.settings?.opacity || 100}" class="settings-range">
      </div>
      
      <div class="input-group">
        <label for="picture-padding">Padding: <span id="picture-padding-value">${existing?.settings?.padding || 0}px</span></label>
        <input type="range" id="picture-padding" min="0" max="30" step="1" value="${existing?.settings?.padding || 0}" class="settings-range">
      </div>
      
      <div class="input-group">
        <label>Image Position</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px;">
          <div>
            <label for="picture-position-x" style="font-size: 13px;">Horizontal: <span id="picture-position-x-value">${existing?.settings?.positionX || 50}%</span></label>
            <input type="range" id="picture-position-x" min="0" max="100" step="5" value="${existing?.settings?.positionX || 50}" class="settings-range">
          </div>
          <div>
            <label for="picture-position-y" style="font-size: 13px;">Vertical: <span id="picture-position-y-value">${existing?.settings?.positionY || 50}%</span></label>
            <input type="range" id="picture-position-y" min="0" max="100" step="5" value="${existing?.settings?.positionY || 50}" class="settings-range">
          </div>
        </div>
        <small style="opacity: 0.7; font-size: 11px; margin-top: 5px; display: block;">Adjust to choose which part of the image shows in the frame</small>
      </div>
      
      <div id="picture-storage-info" class="storage-info" style="
        margin-top: 15px;
        padding: 10px;
        background: #f0f0f0;
        border-radius: 6px;
        font-size: 12px;
        color: #666;
      "></div>
      
      <div class="widget-actions">
        <button id="picture-save" class="primary-button">${isEdit ? 'Update' : 'Add'} Picture Widget</button>
        ${isEdit ? '<button id="picture-delete" class="delete-button">Delete Widget</button>' : ''}
      </div>
    `;

    // Set up event handlers
    setupPictureEventHandlers(existing, index, isEdit);
    
    // Load storage info
    updateStorageInfo();
    
    // Load existing image preview if editing
    if (existing && existing.settings.imageRef) {
      loadImagePreview(existing.settings.imageRef);
    }
  }

  function setupPictureEventHandlers(existing, index, isEdit) {
    const uploadInput = document.getElementById('picture-upload');
    const preview = document.getElementById('picture-preview');
    const fitSelect = document.getElementById('picture-fit');
    const opacityRange = document.getElementById('picture-opacity');
    const opacityValue = document.getElementById('picture-opacity-value');
    const paddingRange = document.getElementById('picture-padding');
    const paddingValue = document.getElementById('picture-padding-value');
    const positionXRange = document.getElementById('picture-position-x');
    const positionXValue = document.getElementById('picture-position-x-value');
    const positionYRange = document.getElementById('picture-position-y');
    const positionYValue = document.getElementById('picture-position-y-value');
    const saveButton = document.getElementById('picture-save');
    const deleteButton = document.getElementById('picture-delete');
    
    let currentImageRef = existing?.settings?.imageRef || null;
    
    // File upload handling
    uploadInput.addEventListener('change', handleImageUpload);
    
    // Drag and drop
    preview.addEventListener('click', () => uploadInput.click());
    preview.addEventListener('dragover', (e) => {
      e.preventDefault();
      preview.style.borderColor = '#007cba';
      preview.style.background = '#f0f8ff';
    });
    preview.addEventListener('dragleave', () => {
      preview.style.borderColor = '#ccc';
      preview.style.background = '#f9f9f9';
    });
    preview.addEventListener('drop', (e) => {
      e.preventDefault();
      preview.style.borderColor = '#ccc';
      preview.style.background = '#f9f9f9';
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleImageFile(files[0]);
      }
    });
    
    // Range inputs
    opacityRange.addEventListener('input', () => {
      opacityValue.textContent = opacityRange.value + '%';
    });
    
    paddingRange.addEventListener('input', () => {
      paddingValue.textContent = paddingRange.value + 'px';
    });
    
    positionXRange.addEventListener('input', () => {
      positionXValue.textContent = positionXRange.value + '%';
    });
    
    positionYRange.addEventListener('input', () => {
      positionYValue.textContent = positionYRange.value + '%';
    });
    
    // Save button
    saveButton.addEventListener('click', async () => {
      try {
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
        
        const widgetData = {
          imageRef: currentImageRef,
          fit: fitSelect.value,
          opacity: parseInt(opacityRange.value),
          padding: parseInt(paddingRange.value),
          positionX: parseInt(positionXRange.value),
          positionY: parseInt(positionYRange.value)
        };
        
        if (isEdit) {
          // Update existing widget
          settings.widgets[index].settings = { ...settings.widgets[index].settings, ...widgetData };
        } else {
          // Add new widget
          addPictureWidget(widgetData);
        }
        
        // Trigger re-render if editing
        if (isEdit) {
          saveAndRender();
        }
        
        // Close config if not editing (adding new widget)
        if (!isEdit) {
          widgetList.innerHTML = '';
        }
        
      } catch (error) {
        console.error('Error saving picture widget:', error);
        alert('Failed to save picture widget: ' + error.message);
      } finally {
        saveButton.disabled = false;
        saveButton.textContent = isEdit ? 'Update Picture Widget' : 'Add Picture Widget';
      }
    });
    
    // Delete button
    if (deleteButton) {
      deleteButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this picture widget?')) {
          // Clean up stored image if it exists
          if (existing.settings.imageRef) {
            try {
              await window.storageManager.deleteImage(existing.settings.imageRef);
            } catch (error) {
              console.warn('Failed to delete image from storage:', error);
            }
          }
          
          // Remove widget
          settings.widgets.splice(index, 1);
          saveAndRender();
        }
      });
    }
    
    async function handleImageUpload(e) {
      const file = e.target.files[0];
      if (file) {
        await handleImageFile(file);
      }
    }
    
    async function handleImageFile(file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      
      // Check file size (reasonable limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('Image file is too large. Please select an image smaller than 5MB.');
        return;
      }
      
      try {
        // Convert to data URL
        const dataUrl = await fileToDataUrl(file);
        
        // Store the image
        const imageRef = await window.storageManager.storeImage(dataUrl);
        currentImageRef = imageRef;
        
        // Update preview
        displayImagePreview(dataUrl);
        
        // Update storage info
        updateStorageInfo();
        
      } catch (error) {
        console.error('Error handling image:', error);
        alert('Failed to process image: ' + error.message);
      }
    }
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function loadImagePreview(imageRef) {
    try {
      const imageData = await window.storageManager.getImage(imageRef);
      if (imageData) {
        displayImagePreview(imageData);
      }
    } catch (error) {
      console.error('Failed to load image preview:', error);
    }
  }

  function displayImagePreview(dataUrl) {
    const preview = document.getElementById('picture-preview');
    preview.innerHTML = `
      <img src="${dataUrl}" style="
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 6px;
      ">
    `;
    preview.style.border = '2px solid #007cba';
  }

  async function updateStorageInfo() {
    try {
      const info = await window.storageManager.getStorageInfo();
      const infoElement = document.getElementById('picture-storage-info');
      if (infoElement) {
        infoElement.innerHTML = `
          <strong>Storage Usage:</strong> ${info.totalSizeMB}MB / ${info.maxSizeMB}MB (${info.percentageUsed}%)<br>
          <strong>Images stored:</strong> ${info.imageCount}
        `;
        
        // Color code based on usage
        if (info.percentageUsed > 80) {
          infoElement.style.background = '#ffebee';
          infoElement.style.color = '#c62828';
        } else if (info.percentageUsed > 60) {
          infoElement.style.background = '#fff8e1';
          infoElement.style.color = '#f57c00';
        }
      }
    } catch (error) {
      console.warn('Failed to update storage info:', error);
    }
  }

  // Register the widget
  registerWidget('picture', {
    render: renderPictureWidget,
    add: addPictureWidget,
    openConfig: openPictureConfig,
    name: 'Picture',
    defaultSize: { w: 4, h: 4 }
  });

  console.log('Picture widget registered successfully');

})();