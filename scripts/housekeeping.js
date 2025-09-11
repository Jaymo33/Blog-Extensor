#!/usr/bin/env node

/**
 * Housekeeping Script
 * Cleans up unnecessary files, organizes code, and maintains project hygiene
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runHousekeeping() {
  console.log('🧹 Starting housekeeping...\n');
  
  const cleanupTasks = [
    cleanDistDirectory,
    cleanNodeModulesCache,
    cleanBuildArtifacts,
    organizeBackups,
    cleanTempFiles,
    validateStructure,
    generateCleanupReport
  ];
  
  cleanupTasks.forEach(task => {
    try {
      task();
    } catch (error) {
      console.log(`⚠ Error in ${task.name}: ${error.message}`);
    }
  });
  
  console.log('\n✅ Housekeeping completed!');
}

function cleanDistDirectory() {
  console.log('📁 Cleaning dist directory...');
  
  if (fs.existsSync('dist')) {
    const distStats = getDirectoryStats('dist');
    console.log(`   Found ${distStats.files} files, ${distStats.dirs} directories`);
    
    // Keep only essential files, remove build artifacts
    const keepFiles = ['robots.txt', 'search-data.json', 'favicon.svg'];
    const distContents = fs.readdirSync('dist');
    
    distContents.forEach(item => {
      const itemPath = path.join('dist', item);
      if (!keepFiles.includes(item) && !item.startsWith('blog/')) {
        if (fs.statSync(itemPath).isDirectory()) {
          fs.rmSync(itemPath, { recursive: true, force: true });
          console.log(`   🗑️ Removed directory: ${item}`);
        } else {
          fs.unlinkSync(itemPath);
          console.log(`   🗑️ Removed file: ${item}`);
        }
      }
    });
    
    console.log('   ✅ Dist directory cleaned');
  } else {
    console.log('   ℹ️ No dist directory found');
  }
}

function cleanNodeModulesCache() {
  console.log('📦 Checking node_modules cache...');
  
  if (fs.existsSync('node_modules/.cache')) {
    const cacheStats = getDirectoryStats('node_modules/.cache');
    console.log(`   Found ${cacheStats.files} cached files`);
    
    fs.rmSync('node_modules/.cache', { recursive: true, force: true });
    console.log('   🗑️ Cleared node_modules cache');
  } else {
    console.log('   ℹ️ No cache found');
  }
}

function cleanBuildArtifacts() {
  console.log('🔧 Cleaning build artifacts...');
  
  const artifacts = [
    '.astro',
    '.vite',
    'out',
    '*.log',
    '*.tmp'
  ];
  
  artifacts.forEach(artifact => {
    if (fs.existsSync(artifact)) {
      if (fs.statSync(artifact).isDirectory()) {
        fs.rmSync(artifact, { recursive: true, force: true });
        console.log(`   🗑️ Removed directory: ${artifact}`);
      } else {
        fs.unlinkSync(artifact);
        console.log(`   🗑️ Removed file: ${artifact}`);
      }
    }
  });
  
  console.log('   ✅ Build artifacts cleaned');
}

function organizeBackups() {
  console.log('📚 Organizing backups...');
  
  if (!fs.existsSync('backups')) {
    console.log('   ℹ️ No backups directory found');
    return;
  }
  
  const backups = fs.readdirSync('backups')
    .filter(item => item.startsWith('backup-'))
    .sort();
  
  console.log(`   Found ${backups.length} backup directories`);
  
  // Keep only the last 7 backups (clean up old ones)
  if (backups.length > 7) {
    const toRemove = backups.slice(0, backups.length - 7);
    toRemove.forEach(backup => {
      const backupPath = path.join('backups', backup);
      fs.rmSync(backupPath, { recursive: true, force: true });
      console.log(`   🗑️ Removed old backup: ${backup}`);
    });
  }
  
  console.log('   ✅ Backups organized');
}

function cleanTempFiles() {
  console.log('🗂️ Cleaning temporary files...');
  
  const tempPatterns = [
    '*.tmp',
    '*.temp',
    '*.bak',
    '.DS_Store',
    'Thumbs.db'
  ];
  
  // Clean temp files from scripts directory
  if (fs.existsSync('scripts')) {
    const scriptFiles = fs.readdirSync('scripts');
    scriptFiles.forEach(file => {
      if (file.match(/\.(tmp|temp|bak)$/i)) {
        fs.unlinkSync(path.join('scripts', file));
        console.log(`   🗑️ Removed temp file: scripts/${file}`);
      }
    });
  }
  
  console.log('   ✅ Temporary files cleaned');
}

function validateStructure() {
  console.log('🔍 Validating project structure...');
  
  const requiredFiles = [
    'astro.config.mjs',
    'package.json',
    'src/layouts/Layout.astro',
    'src/layouts/blog/BlogPost.astro',
    'public/robots.txt',
    '.env'
  ];
  
  const requiredDirs = [
    'src',
    'src/components',
    'src/layouts',
    'src/pages',
    'public',
    'scripts'
  ];
  
  let issues = [];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      issues.push(`Missing required file: ${file}`);
    }
  });
  
  requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      issues.push(`Missing required directory: ${dir}`);
    }
  });
  
  if (issues.length === 0) {
    console.log('   ✅ Project structure is valid');
  } else {
    console.log('   ⚠️ Project structure issues found:');
    issues.forEach(issue => console.log(`      - ${issue}`));
  }
}

function generateCleanupReport() {
  console.log('📊 Generating cleanup report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    projectStats: {
      srcFiles: countFiles('src'),
      scriptFiles: countFiles('scripts'),
      backupCount: fs.existsSync('backups') ? fs.readdirSync('backups').filter(f => f.startsWith('backup-')).length : 0,
      totalSize: getDirectorySize('.')
    },
    cleanupActions: [
      'Cleaned dist directory',
      'Cleared node_modules cache',
      'Removed build artifacts',
      'Organized backups',
      'Cleaned temporary files',
      'Validated project structure'
    ]
  };
  
  const reportPath = 'housekeeping-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`   📄 Cleanup report saved: ${reportPath}`);
  console.log(`   📈 Project stats: ${report.projectStats.srcFiles} src files, ${report.projectStats.scriptFiles} scripts, ${report.projectStats.backupCount} backups`);
}

function getDirectoryStats(dirPath) {
  if (!fs.existsSync(dirPath)) return { files: 0, dirs: 0 };
  
  let files = 0;
  let dirs = 0;
  
  function countRecursive(currentPath) {
    const items = fs.readdirSync(currentPath);
    items.forEach(item => {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        dirs++;
        countRecursive(itemPath);
      } else {
        files++;
      }
    });
  }
  
  countRecursive(dirPath);
  return { files, dirs };
}

function countFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  
  let count = 0;
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      count += countFiles(itemPath);
    } else {
      count++;
    }
  });
  
  return count;
}

function getDirectorySize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  
  let size = 0;
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory() && !item.startsWith('node_modules') && !item.startsWith('dist')) {
      size += getDirectorySize(itemPath);
    } else if (stat.isFile()) {
      size += stat.size;
    }
  });
  
  return size;
}

// Export for use in other scripts
export { runHousekeeping };

// Run if called directly
runHousekeeping();
