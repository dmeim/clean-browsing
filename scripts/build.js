#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const sharedDir = path.join(rootDir, 'shared');
const extensionsDir = path.join(rootDir, 'extensions');
const distDir = path.join(rootDir, 'dist');

async function main() {
  console.log('🏗️  Building Clean Browsing Extensions...\n');

  try {
    // Ensure dist directory exists
    await fs.ensureDir(distDir);

    // Build CB-NewTab
    console.log('📊 Building CB-NewTab...');
    await buildExtension('cb-newtab');
    
    // Build CB-Sidepanel
    console.log('🌐 Building CB-Sidepanel...');
    await buildExtension('cb-sidepanel');

    console.log('\n✅ Build completed successfully!\n');
    console.log('📦 Extensions ready for installation:');
    console.log('   - CB-NewTab: extensions/cb-newtab/');
    console.log('   - CB-Sidepanel: extensions/cb-sidepanel/');
    console.log('\n💡 To load in Chrome:');
    console.log('   1. Go to chrome://extensions');
    console.log('   2. Enable Developer mode');
    console.log('   3. Click "Load unpacked" and select each extension folder');

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

async function buildExtension(extensionName) {
  const extensionDir = path.join(extensionsDir, extensionName);
  
  // Verify extension directory exists
  if (!await fs.pathExists(extensionDir)) {
    throw new Error(`Extension directory not found: ${extensionDir}`);
  }

  // Copy shared resources (overwrite any existing)
  console.log(`   📁 Copying shared resources...`);
  await fs.copy(path.join(sharedDir, 'resources'), path.join(extensionDir, 'resources'), {
    overwrite: true
  });

  // Create shared directory structure in extension
  const extensionSharedDir = path.join(extensionDir, 'shared');
  await fs.ensureDir(extensionSharedDir);

  // Copy shared storage and styles
  console.log(`   🗄️  Copying shared storage components...`);
  await fs.copy(path.join(sharedDir, 'storage'), path.join(extensionSharedDir, 'storage'), {
    overwrite: true
  });

  console.log(`   🎨 Copying shared styles...`);
  await fs.copy(path.join(sharedDir, 'styles'), path.join(extensionSharedDir, 'styles'), {
    overwrite: true
  });

  // Copy shared utils if they exist
  if (await fs.pathExists(path.join(sharedDir, 'utils'))) {
    console.log(`   🔧 Copying shared utilities...`);
    await fs.copy(path.join(sharedDir, 'utils'), path.join(extensionSharedDir, 'utils'), {
      overwrite: true
    });
  }

  // Validate manifest.json
  const manifestPath = path.join(extensionDir, 'manifest.json');
  if (!await fs.pathExists(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  const manifest = await fs.readJson(manifestPath);
  console.log(`   ✅ ${manifest.name} v${manifest.version} ready`);
}

// Run the build
main();