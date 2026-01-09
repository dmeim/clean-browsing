class StorageManager {
  constructor() {
    this.dbName = 'CleanBrowsingDB';
    this.dbVersion = 1;
    this.storeName = 'images';
    this.db = null;
    this.sizeThreshold = 100 * 1024; // 100KB threshold for IndexedDB vs localStorage
    this.maxTotalSize = 10 * 1024 * 1024; // 10MB total limit
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('size', 'size', { unique: false });
          store.createIndex('created', 'created', { unique: false });
        }
      };
    });
  }

  async shouldUseIndexedDB(imageData) {
    // Check if image is large enough to warrant IndexedDB storage
    const sizeInBytes = this.estimateDataUrlSize(imageData);
    return sizeInBytes > this.sizeThreshold;
  }

  estimateDataUrlSize(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith('data:')) return 0;
    const base64Data = dataUrl.split(',')[1];
    return Math.round((base64Data.length * 3) / 4);
  }

  generateImageId() {
    return `picture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async storeImage(imageData) {
    if (!imageData) throw new Error('No image data provided');

    if (!this.db) await this.init();

    // Try to compress the image if it's too large
    let processedImageData = imageData;
    const originalSize = this.estimateDataUrlSize(imageData);

    if (originalSize > 1024 * 1024) {
      // If larger than 1MB, try compression
      try {
        processedImageData = await this.compressImage(imageData);
        console.log(
          `Compressed image from ${Math.round(originalSize / 1024)}KB to ${Math.round(this.estimateDataUrlSize(processedImageData) / 1024)}KB`
        );
      } catch (error) {
        console.warn('Image compression failed, using original:', error);
        processedImageData = imageData;
      }
    }

    const shouldUseDB = await this.shouldUseIndexedDB(processedImageData);

    if (!shouldUseDB) {
      // Small image, return data URL for localStorage storage
      return { type: 'dataurl', data: processedImageData };
    }

    // Check storage limits before storing
    const currentSize = await this.getTotalStorageSize();
    const imageSize = this.estimateDataUrlSize(processedImageData);

    if (currentSize + imageSize > this.maxTotalSize) {
      throw new Error(
        `Storage limit exceeded. Current: ${Math.round(currentSize / 1024)}KB, Adding: ${Math.round(imageSize / 1024)}KB, Limit: ${Math.round(this.maxTotalSize / 1024)}KB`
      );
    }

    // Store in IndexedDB
    const id = this.generateImageId();
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    const imageRecord = {
      id: id,
      data: processedImageData,
      size: imageSize,
      created: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const request = store.add(imageRecord);
      request.onsuccess = () => resolve({ type: 'indexeddb', id: id });
      request.onerror = () => reject(request.error);
    });
  }

  async compressImage(dataUrl, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Get the compressed data URL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // If compression made it larger, use original
        if (compressedDataUrl.length >= dataUrl.length) {
          resolve(dataUrl);
        } else {
          resolve(compressedDataUrl);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = dataUrl;
    });
  }

  async getImage(imageRef) {
    if (!imageRef) return null;

    // If it's a data URL, return directly
    if (typeof imageRef === 'string' && imageRef.startsWith('data:')) {
      return imageRef;
    }

    // If it's an IndexedDB reference
    if (typeof imageRef === 'object' && imageRef.type === 'indexeddb') {
      if (!this.db) await this.init();

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.get(imageRef.id);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : null);
        };
        request.onerror = () => reject(request.error);
      });
    }

    return null;
  }

  async deleteImage(imageRef) {
    if (!imageRef || typeof imageRef !== 'object' || imageRef.type !== 'indexeddb') {
      return; // Nothing to delete for data URLs
    }

    if (!this.db) await this.init();

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(imageRef.id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getTotalStorageSize() {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const totalSize = request.result.reduce((sum, record) => sum + (record.size || 0), 0);
        resolve(totalSize);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllImages() {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getStorageInfo() {
    const totalSize = await this.getTotalStorageSize();
    const allImages = await this.getAllImages();

    return {
      totalSize: totalSize,
      totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
      imageCount: allImages.length,
      maxSizeMB: Math.round((this.maxTotalSize / (1024 * 1024)) * 100) / 100,
      percentageUsed: Math.round((totalSize / this.maxTotalSize) * 100),
    };
  }

  async cleanupOrphanedImages(activeImageRefs) {
    const allImages = await this.getAllImages();
    const activeIds = new Set(
      activeImageRefs.filter((ref) => ref && ref.type === 'indexeddb').map((ref) => ref.id)
    );

    const orphanedImages = allImages.filter((image) => !activeIds.has(image.id));

    for (const orphan of orphanedImages) {
      await this.deleteImage({ type: 'indexeddb', id: orphan.id });
    }

    return orphanedImages.length;
  }

  async exportAllImages() {
    const allImages = await this.getAllImages();
    const exportData = {};

    for (const image of allImages) {
      exportData[image.id] = {
        data: image.data,
        size: image.size,
        created: image.created,
      };
    }

    return exportData;
  }

  async importImages(importData) {
    if (!importData || typeof importData !== 'object') return 0;

    let importedCount = 0;
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    for (const [id, imageData] of Object.entries(importData)) {
      try {
        const imageRecord = {
          id: id,
          data: imageData.data,
          size: imageData.size || this.estimateDataUrlSize(imageData.data),
          created: imageData.created || Date.now(),
        };

        await new Promise((resolve, reject) => {
          const request = store.put(imageRecord); // Use put to allow overwriting
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });

        importedCount++;
      } catch (error) {
        console.warn(`Failed to import image ${id}:`, error);
      }
    }

    return importedCount;
  }

  // Advanced cleanup and optimization features
  async optimizeStorage() {
    const results = {
      orphanedCleaned: 0,
      totalSizeBefore: 0,
      totalSizeAfter: 0,
      errors: [],
    };

    try {
      results.totalSizeBefore = await this.getTotalStorageSize();

      // Get all active image references from settings
      const activeImageRefs = this.getActiveImageReferences();

      // Clean up orphaned images
      results.orphanedCleaned = await this.cleanupOrphanedImages(activeImageRefs);

      results.totalSizeAfter = await this.getTotalStorageSize();
    } catch (error) {
      results.errors.push('Failed to optimize storage: ' + error.message);
    }

    return results;
  }

  getActiveImageReferences() {
    const activeRefs = [];

    // Get references from settings if available
    if (window.settings && window.settings.widgets) {
      for (const widget of window.settings.widgets) {
        if (widget.type === 'picture' && widget.settings?.imageRef) {
          activeRefs.push(widget.settings.imageRef);
        }
      }
    }

    return activeRefs;
  }

  async clearAllImages() {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getOldestImages(count = 5) {
    const allImages = await this.getAllImages();
    return allImages.sort((a, b) => a.created - b.created).slice(0, count);
  }

  async getLargestImages(count = 5) {
    const allImages = await this.getAllImages();
    return allImages.sort((a, b) => (b.size || 0) - (a.size || 0)).slice(0, count);
  }

  async getStorageStats() {
    const info = await this.getStorageInfo();
    const allImages = await this.getAllImages();

    const stats = {
      ...info,
      averageImageSize: allImages.length > 0 ? Math.round(info.totalSize / allImages.length) : 0,
      oldestImage: allImages.length > 0 ? Math.min(...allImages.map((img) => img.created)) : null,
      newestImage: allImages.length > 0 ? Math.max(...allImages.map((img) => img.created)) : null,
      largestImage: allImages.length > 0 ? Math.max(...allImages.map((img) => img.size || 0)) : 0,
      smallestImage: allImages.length > 0 ? Math.min(...allImages.map((img) => img.size || 0)) : 0,
    };

    if (stats.oldestImage) {
      stats.oldestImageDate = new Date(stats.oldestImage).toLocaleDateString();
    }
    if (stats.newestImage) {
      stats.newestImageDate = new Date(stats.newestImage).toLocaleDateString();
    }

    return stats;
  }
}

// Create global instance
window.storageManager = new StorageManager();

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.storageManager
      .init()
      .then(() => {
        console.log('StorageManager initialized successfully');
      })
      .catch(console.error);
  });
} else {
  window.storageManager
    .init()
    .then(() => {
      console.log('StorageManager initialized successfully');
    })
    .catch(console.error);
}
