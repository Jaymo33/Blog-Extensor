#!/usr/bin/env node

/**
 * Comprehensive Backup Script
 * Creates a complete backup including all scripts, documentation, and configuration files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = `backups/backup-${timestamp}`;
  
  console.log(`Creating comprehensive backup: ${backupDir}`);
  
  // Create backup directory
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups');
  }
  fs.mkdirSync(backupDir);
  
  // Files and directories to backup
  const backupItems = [
    // Core configuration
    'astro.config.mjs',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    '.env',
    
    // Source code
    'src/',
    
    // Public assets
    'public/',
    
    // Scripts and utilities
    'scripts/',
    
    // Functions
    'functions/',
    
    // Templates
    'templates/',
    
    // Documentation
    'README.md',
    
    // Cloudflare worker
    'cloudflare-worker.js',
    
    // Additional config files
    'webflow-faq-schemas.json'
  ];
  
  // Copy each item
  backupItems.forEach(item => {
    const sourcePath = item;
    const destPath = path.join(backupDir, item);
    
    if (fs.existsSync(sourcePath)) {
      if (fs.statSync(sourcePath).isDirectory()) {
        copyDirectory(sourcePath, destPath);
        console.log(`✓ Copied directory: ${sourcePath}`);
      } else {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✓ Copied file: ${sourcePath}`);
      }
    } else {
      console.log(`⚠ Skipped (not found): ${sourcePath}`);
    }
  });
  
  // Create backup documentation
  const backupReadme = `# Backup - ${timestamp}

## Backup Contents
This backup contains ALL core components of the Blog-Extensor setup:

### Core Configuration
- astro.config.mjs - Astro configuration
- package.json & package-lock.json - Dependencies
- tsconfig.json - TypeScript configuration
- .env - Environment variables

### Source Code
- src/ - Complete source directory
- public/ - Static assets
- functions/ - Serverless functions
- scripts/ - All utility scripts
- templates/ - Content templates

### Documentation & Config
- README.md - Project documentation
- cloudflare-worker.js - Cloudflare worker
- webflow-faq-schemas.json - FAQ schemas

### Current Features
✅ Complete SEO infrastructure
✅ JSON-LD schemas (BlogPosting, FAQPage, HowTo, Review)
✅ Table of Contents with jump-to-section links
✅ Reading progress bars (top and bottom)
✅ Related posts widget
✅ Newsletter integration (Mailchimp)
✅ Search functionality with keyboard navigation
✅ Pagination for blog listing
✅ Google Analytics 4 integration
✅ Microsoft Clarity heatmap tracking
✅ A/B testing framework
✅ Social sharing tracking
✅ Image optimization and lazy loading
✅ Performance optimizations
✅ International SEO (hreflang tags)
✅ Canonical URL optimization

## Rollback Instructions
1. Copy files from this backup to project root
2. Run: npm install
3. Run: npm run build
4. Deploy as needed

---
Backup created: ${timestamp}
Status: Comprehensive backup with all scripts and documentation
`;
  
  fs.writeFileSync(path.join(backupDir, 'BACKUP-README.md'), backupReadme);
  
  // Update backup index
  updateBackupIndex(backupDir, timestamp);
  
  console.log(`\n✅ Comprehensive backup created: ${backupDir}`);
  console.log('📁 Includes: Core config, source code, scripts, templates, documentation');
  console.log('📋 Backup documentation created');
  console.log('📖 Backup index updated');
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function updateBackupIndex(backupDir, timestamp) {
  const indexPath = 'backups/BACKUP-INDEX.md';
  
  if (!fs.existsSync(indexPath)) {
    console.log('⚠ Backup index not found, skipping update');
    return;
  }
  
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Add new backup entry after the header
  const newEntry = `### Latest: \`${path.basename(backupDir)}\`
**Date:** ${timestamp.replace(/-/g, ' ').replace('T', ' - ')}  
**Status:** ✅ Latest comprehensive backup  
**Features:** Complete implementation with all scripts and documentation
- ✅ All core configuration files
- ✅ Complete source code and components
- ✅ All utility scripts and templates
- ✅ Documentation and README files
- ✅ Cloudflare worker configuration
- ✅ All current features (see BACKUP-README.md for full list)

`;
  
  // Insert after "## Available Backups"
  content = content.replace(
    /(## Available Backups\n)/,
    `$1${newEntry}`
  );
  
  // Update the "Last Updated" timestamp
  content = content.replace(
    /(\*\*Last Updated:\*\* ).*/,
    `$1${timestamp.replace('T', ' ')}`
  );
  
  fs.writeFileSync(indexPath, content);
}

// Run the backup
createBackup();

export { createBackup };
