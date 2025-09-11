#!/usr/bin/env node

/**
 * Create nested folder structure for all categories and hubs
 * Creates all folders upfront before moving any files
 */

import fs from 'fs';
import path from 'path';

const inputFile = 'out/classified-posts.csv';
const blogDir = 'src/content/blog';

console.log('🔄 Creating folder structure...');

try {
  // Read classified posts
  const csvContent = fs.readFileSync(inputFile, 'utf8');
  const lines = csvContent.split('\n');
  
  const folders = new Set();
  
  // Collect all unique category/hub combinations
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(v => v.replace(/"/g, ''));
    const category = values[4];
    const hub = values[5];
    
    if (category && hub) {
      const folderPath = path.join(blogDir, category, hub);
      folders.add(folderPath);
    }
  }
  
  // Create all folders
  let createdCount = 0;
  for (const folderPath of folders) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      createdCount++;
      console.log(`   📁 Created: ${folderPath}`);
    }
  }
  
  console.log(`✅ Folder creation complete:`);
  console.log(`   📊 Total folders: ${folders.size}`);
  console.log(`   🆕 Newly created: ${createdCount}`);
  console.log(`   ✅ Already existed: ${folders.size - createdCount}`);
  
  // Show folder structure
  console.log(`\n📁 Folder structure:`);
  const sortedFolders = Array.from(folders).sort();
  sortedFolders.forEach(folder => {
    const relativePath = path.relative(blogDir, folder);
    console.log(`   ${relativePath}`);
  });
  
} catch (error) {
  console.error('❌ Folder creation failed:', error.message);
  process.exit(1);
}
