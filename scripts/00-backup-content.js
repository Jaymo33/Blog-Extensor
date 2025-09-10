#!/usr/bin/env node

/**
 * Backup all content before migration
 * Creates timestamped backup of src/content/blog/ folder
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = `backup-blog-content-${timestamp}`;

console.log(`🔄 Creating backup: ${backupDir}`);

try {
  // Create backup directory
  fs.mkdirSync(backupDir, { recursive: true });
  
  // Copy entire blog content folder
  execSync(`xcopy "src\\content\\blog" "${backupDir}\\blog" /E /I /H /Y`, { stdio: 'inherit' });
  
  console.log(`✅ Backup created successfully: ${backupDir}`);
  console.log(`📁 Backup location: ${path.resolve(backupDir)}`);
  
} catch (error) {
  console.error('❌ Backup failed:', error.message);
  process.exit(1);
}

