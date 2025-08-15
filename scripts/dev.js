#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');

const rootDir = path.join(__dirname, '..');
const sharedDir = path.join(rootDir, 'shared');
const extensionsDir = path.join(rootDir, 'extensions');

console.log('🚀 Clean Browsing Development Mode\n');

async function setupDevelopment() {
  try {
    // Initial build to ensure shared components are copied
    console.log('📦 Initial build...');
    await require('./build.js');
    
    console.log('\n👀 Watching shared components for changes...\n');
    
    // Watch shared directory for changes
    const watcher = chokidar.watch(sharedDir, {
      persistent: true,
      ignoreInitial: true,
      ignored: /node_modules/
    });

    watcher.on('change', async (filePath) => {
      const relativePath = path.relative(sharedDir, filePath);
      console.log(`📝 Changed: shared/${relativePath}`);
      await copySharedFile(filePath, relativePath);
    });

    watcher.on('add', async (filePath) => {
      const relativePath = path.relative(sharedDir, filePath);
      console.log(`➕ Added: shared/${relativePath}`);
      await copySharedFile(filePath, relativePath);
    });

    watcher.on('unlink', async (filePath) => {
      const relativePath = path.relative(sharedDir, filePath);
      console.log(`🗑️  Removed: shared/${relativePath}`);
      await removeSharedFile(relativePath);
    });

    console.log('🎯 Development server running!');
    console.log('   - Shared files will auto-sync to both extensions');
    console.log('   - Reload extensions in Chrome to see changes');
    console.log('   - Press Ctrl+C to stop\n');

    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping development server...');
      watcher.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Development setup failed:', error.message);
    process.exit(1);
  }
}

async function copySharedFile(sourceFile, relativePath) {
  const extensions = ['cb-newtab', 'cb-sidepanel'];
  
  for (const extension of extensions) {
    const targetPath = path.join(extensionsDir, extension, 'shared', relativePath);
    
    try {
      await fs.ensureDir(path.dirname(targetPath));
      await fs.copy(sourceFile, targetPath);
      console.log(`   ✅ Copied to ${extension}`);
    } catch (error) {
      console.error(`   ❌ Failed to copy to ${extension}:`, error.message);
    }
  }
}

async function removeSharedFile(relativePath) {
  const extensions = ['cb-newtab', 'cb-sidepanel'];
  
  for (const extension of extensions) {
    const targetPath = path.join(extensionsDir, extension, 'shared', relativePath);
    
    try {
      if (await fs.pathExists(targetPath)) {
        await fs.remove(targetPath);
        console.log(`   🗑️  Removed from ${extension}`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to remove from ${extension}:`, error.message);
    }
  }
}

// Check if chokidar is available
try {
  require.resolve('chokidar');
  setupDevelopment();
} catch (error) {
  console.log('📦 Installing chokidar for file watching...\n');
  const { exec } = require('child_process');
  
  exec('npm install chokidar --save-dev', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Failed to install chokidar:', error.message);
      console.log('\n💡 Manual setup:');
      console.log('   npm install chokidar --save-dev');
      console.log('   npm run dev');
      process.exit(1);
    } else {
      console.log('✅ Chokidar installed successfully\n');
      setupDevelopment();
    }
  });
}