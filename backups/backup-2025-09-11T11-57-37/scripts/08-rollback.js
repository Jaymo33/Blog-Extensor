#!/usr/bin/env node

/**
 * Rollback migration changes
 * Restores files to their original locations and removes redirects
 */

import fs from 'fs';
import path from 'path';

const migrationStateFile = 'out/migration-state.json';
const redirectsFile = 'src/data/redirects.json';

console.log('🔄 Rolling back migration changes...');

try {
  // Load migration state
  if (!fs.existsSync(migrationStateFile)) {
    console.error('❌ Migration state file not found. Nothing to rollback.');
    process.exit(1);
  }
  
  const migrationState = JSON.parse(fs.readFileSync(migrationStateFile, 'utf8'));
  const movedPosts = migrationState.moved;
  
  if (movedPosts.length === 0) {
    console.log('⚠️  No moved posts found. Nothing to rollback.');
    return;
  }
  
  console.log(`📊 Rolling back ${movedPosts.length} posts...`);
  
  let restoredCount = 0;
  let failedCount = 0;
  
  // Restore files to original locations
  for (const post of movedPosts) {
    try {
      const newPath = post.newPath;
      const oldPath = post.filePath;
      
      // Check if new file exists
      if (!fs.existsSync(newPath)) {
        console.log(`   ⚠️  New file not found: ${newPath}`);
        failedCount++;
        continue;
      }
      
      // Check if old location already exists
      if (fs.existsSync(oldPath)) {
        console.log(`   ⚠️  Old location already exists: ${oldPath}`);
        failedCount++;
        continue;
      }
      
      // Move file back
      fs.renameSync(newPath, oldPath);
      restoredCount++;
      console.log(`   ✅ Restored: ${post.slug} → ${path.basename(oldPath)}`);
      
    } catch (error) {
      console.log(`   ❌ Failed to restore ${post.slug}: ${error.message}`);
      failedCount++;
    }
  }
  
  // Remove redirects file
  if (fs.existsSync(redirectsFile)) {
    fs.unlinkSync(redirectsFile);
    console.log(`   🗑️  Removed redirects file: ${redirectsFile}`);
  }
  
  // Remove empty directories
  console.log(`\n🧹 Cleaning up empty directories...`);
  
  const blogDir = 'src/content/blog';
  const categories = fs.readdirSync(blogDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  for (const category of categories) {
    const categoryPath = path.join(blogDir, category);
    const hubs = fs.readdirSync(categoryPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const hub of hubs) {
      const hubPath = path.join(categoryPath, hub);
      const files = fs.readdirSync(hubPath);
      
      if (files.length === 0) {
        fs.rmdirSync(hubPath);
        console.log(`   🗑️  Removed empty directory: ${path.relative(blogDir, hubPath)}`);
      }
    }
    
    // Check if category directory is now empty
    const remainingFiles = fs.readdirSync(categoryPath);
    if (remainingFiles.length === 0) {
      fs.rmdirSync(categoryPath);
      console.log(`   🗑️  Removed empty directory: ${category}`);
    }
  }
  
  // Remove migration state file
  fs.unlinkSync(migrationStateFile);
  console.log(`   🗑️  Removed migration state file: ${migrationStateFile}`);
  
  console.log(`\n✅ Rollback complete:`);
  console.log(`   ✅ Successfully restored: ${restoredCount} posts`);
  console.log(`   ❌ Failed: ${failedCount} posts`);
  console.log(`   🗑️  Removed redirects and migration state`);
  
  if (failedCount > 0) {
    console.log(`\n⚠️  Some posts failed to restore. Check the output above for details.`);
  } else {
    console.log(`\n🎉 Rollback completed successfully! All files restored to original locations.`);
  }
  
} catch (error) {
  console.error('❌ Rollback failed:', error.message);
  process.exit(1);
}
