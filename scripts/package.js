#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

const rootDir = path.join(__dirname, '..');
const extensionsDir = path.join(rootDir, 'extensions');
const distDir = path.join(rootDir, 'dist');

async function main() {
  console.log('📦 Packaging Clean Browsing Extensions...\n');

  try {
    // Ensure dist directory exists
    await fs.ensureDir(distDir);

    // Run build first to ensure everything is up to date
    console.log('🏗️  Running build first...');
    await require('./build.js');
    console.log();

    // Package CB-NewTab
    await packageExtension('cb-newtab');
    
    // Package CB-Sidepanel
    await packageExtension('cb-sidepanel');

    console.log('✅ Packaging completed successfully!\n');
    console.log('📁 Distribution files created:');
    
    const distFiles = await fs.readdir(distDir);
    for (const file of distFiles.filter(f => f.endsWith('.zip'))) {
      const filePath = path.join(distDir, file);
      const stats = await fs.stat(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`   ${file} (${sizeKB}KB)`);
    }

    console.log('\n🌐 Ready for Chrome Web Store submission!');

  } catch (error) {
    console.error('❌ Packaging failed:', error.message);
    process.exit(1);
  }
}

async function packageExtension(extensionName) {
  const extensionDir = path.join(extensionsDir, extensionName);
  const manifestPath = path.join(extensionDir, 'manifest.json');
  
  // Read manifest to get version
  const manifest = await fs.readJson(manifestPath);
  const version = manifest.version;
  const packageName = `${extensionName}-v${version}.zip`;
  const outputPath = path.join(distDir, packageName);

  console.log(`📦 Packaging ${manifest.name} v${version}...`);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    output.on('close', () => {
      const sizeKB = Math.round(archive.pointer() / 1024);
      console.log(`   ✅ Created ${packageName} (${sizeKB}KB)`);
      resolve();
    });

    archive.on('error', reject);
    archive.pipe(output);

    // Add all files from extension directory
    archive.directory(extensionDir, false, (entry) => {
      // Exclude development files
      const excludePatterns = [
        /\.git/,
        /node_modules/,
        /\.DS_Store/,
        /Thumbs\.db/,
        /\.vscode/,
        /\.idea/
      ];

      return !excludePatterns.some(pattern => pattern.test(entry.name));
    });

    archive.finalize();
  });
}

// Check if archiver is available
async function checkDependencies() {
  try {
    require.resolve('archiver');
    return true;
  } catch (error) {
    console.log('📦 Installing archiver for ZIP creation...\n');
    const { exec } = require('child_process');
    
    return new Promise((resolve, reject) => {
      exec('npm install archiver --save-dev', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Failed to install archiver:', error.message);
          console.log('\n💡 Manual setup:');
          console.log('   npm install archiver --save-dev');
          console.log('   npm run package');
          reject(error);
        } else {
          console.log('✅ Archiver installed successfully\n');
          resolve(true);
        }
      });
    });
  }
}

// Main execution
checkDependencies()
  .then(() => main())
  .catch((error) => {
    console.error('❌ Package script failed:', error.message);
    process.exit(1);
  });