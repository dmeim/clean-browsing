#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const extensionsDir = path.join(rootDir, 'extensions');

async function main() {
  console.log('🔍 Validating Clean Browsing Extensions...\n');

  let allValid = true;

  // Validate CB-NewTab
  console.log('📊 Validating CB-NewTab...');
  const newtabValid = await validateExtension('cb-newtab', {
    requiredFiles: ['manifest.json', 'newtab.html', 'widgets.js', 'settings.js', 'styles.css'],
    requiredPermissions: ['storage'],
    requiredKeys: ['chrome_url_overrides']
  });

  // Validate CB-Sidepanel
  console.log('🌐 Validating CB-Sidepanel...');
  const sidepanelValid = await validateExtension('cb-sidepanel', {
    requiredFiles: ['manifest.json', 'sidepanel.html', 'sidepanel.js', 'background.js', 'frame-rules.json'],
    requiredPermissions: ['sidePanel', 'storage', 'declarativeNetRequest'],
    requiredKeys: ['side_panel', 'background', 'declarative_net_request']
  });

  allValid = newtabValid && sidepanelValid;

  if (allValid) {
    console.log('\n✅ All extensions validated successfully!');
    console.log('🚀 Extensions are ready for development and distribution.');
  } else {
    console.log('\n❌ Validation failed!');
    console.log('🔧 Please fix the issues above before proceeding.');
    process.exit(1);
  }
}

async function validateExtension(extensionName, requirements) {
  const extensionDir = path.join(extensionsDir, extensionName);
  let valid = true;

  try {
    // Check if extension directory exists
    if (!await fs.pathExists(extensionDir)) {
      console.error(`   ❌ Extension directory not found: ${extensionDir}`);
      return false;
    }

    // Validate manifest.json
    const manifestPath = path.join(extensionDir, 'manifest.json');
    if (!await fs.pathExists(manifestPath)) {
      console.error(`   ❌ manifest.json not found`);
      return false;
    }

    const manifest = await fs.readJson(manifestPath);
    
    // Basic manifest validation
    if (!manifest.name || !manifest.version || !manifest.manifest_version) {
      console.error(`   ❌ Invalid manifest.json structure`);
      valid = false;
    } else {
      console.log(`   📋 ${manifest.name} v${manifest.version}`);
    }

    // Check required files
    for (const file of requirements.requiredFiles) {
      const filePath = path.join(extensionDir, file);
      if (await fs.pathExists(filePath)) {
        console.log(`   ✅ ${file}`);
      } else {
        console.error(`   ❌ Missing required file: ${file}`);
        valid = false;
      }
    }

    // Check required permissions
    const permissions = manifest.permissions || [];
    for (const permission of requirements.requiredPermissions) {
      if (permissions.includes(permission)) {
        console.log(`   ✅ Permission: ${permission}`);
      } else {
        console.error(`   ❌ Missing required permission: ${permission}`);
        valid = false;
      }
    }

    // Check required manifest keys
    for (const key of requirements.requiredKeys) {
      if (manifest[key]) {
        console.log(`   ✅ Manifest key: ${key}`);
      } else {
        console.error(`   ❌ Missing required manifest key: ${key}`);
        valid = false;
      }
    }

    // Check shared components
    const sharedDir = path.join(extensionDir, 'shared');
    if (await fs.pathExists(sharedDir)) {
      console.log(`   ✅ Shared components directory`);
      
      // Check for key shared files
      const storageDir = path.join(sharedDir, 'storage');
      const stylesDir = path.join(sharedDir, 'styles');
      
      if (await fs.pathExists(storageDir)) {
        console.log(`   ✅ Shared storage components`);
      } else {
        console.error(`   ❌ Shared storage components missing`);
        valid = false;
      }
      
      if (await fs.pathExists(stylesDir)) {
        console.log(`   ✅ Shared style components`);
      } else {
        console.error(`   ❌ Shared style components missing`);
        valid = false;
      }
    } else {
      console.error(`   ❌ Shared components not found - run 'npm run build' first`);
      valid = false;
    }

    console.log();
    return valid;

  } catch (error) {
    console.error(`   ❌ Validation error: ${error.message}`);
    return false;
  }
}

// Run validation
main();