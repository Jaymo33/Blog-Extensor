#!/usr/bin/env node

/**
 * Move blog posts to their new nested folder locations
 * Processes posts in batches and updates file paths
 */

import fs from 'fs';
import path from 'path';

const inputFile = 'out/classified-posts.csv';
const blogDir = 'src/content/blog';
const batchSize = 10; // Process 10 posts at a time
const migrationStateFile = 'out/migration-state.json';

console.log('🔄 Moving blog posts to nested folders...');

try {
  // Read classified posts
  const csvContent = fs.readFileSync(inputFile, 'utf8');
  const lines = csvContent.split('\n');
  
  const posts = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(v => v.replace(/"/g, ''));
    posts.push({
      slug: values[0],
      oldUrl: values[1],
      newSlug: values[2],
      newUrl: values[3],
      category: values[4],
      hub: values[5],
      filePath: values[6],
      contentLength: values[7]
    });
  }
  
  // Load migration state
  let migrationState = { moved: [], failed: [], currentBatch: 0 };
  if (fs.existsSync(migrationStateFile)) {
    migrationState = JSON.parse(fs.readFileSync(migrationStateFile, 'utf8'));
  }
  
  // Select first 10 posts representing different categories
  const categoryCount = {};
  const selectedPosts = [];
  
  for (const post of posts) {
    if (selectedPosts.length >= batchSize) break;
    
    const category = post.category;
    if (!categoryCount[category]) {
      categoryCount[category] = 0;
    }
    
    // Prefer posts from categories we haven't seen yet
    if (categoryCount[category] < 2) {
      selectedPosts.push(post);
      categoryCount[category]++;
    }
  }
  
  console.log(`📊 Processing ${selectedPosts.length} posts (first batch):`);
  selectedPosts.forEach((post, index) => {
    console.log(`   ${index + 1}. ${post.slug} → ${post.category}/${post.hub}/`);
  });
  
  // Move posts
  let movedCount = 0;
  let failedCount = 0;
  
  for (const post of selectedPosts) {
    try {
      const oldPath = post.filePath;
      const newPath = path.join(blogDir, post.category, post.hub, `${post.slug}.md`);
      
      // Check if source file exists
      if (!fs.existsSync(oldPath)) {
        console.log(`   ⚠️  Source file not found: ${oldPath}`);
        migrationState.failed.push({
          ...post,
          error: 'Source file not found',
          timestamp: new Date().toISOString()
        });
        failedCount++;
        continue;
      }
      
      // Check if destination already exists
      if (fs.existsSync(newPath)) {
        console.log(`   ⚠️  Destination already exists: ${newPath}`);
        migrationState.failed.push({
          ...post,
          error: 'Destination already exists',
          timestamp: new Date().toISOString()
        });
        failedCount++;
        continue;
      }
      
      // Move the file
      fs.renameSync(oldPath, newPath);
      
      migrationState.moved.push({
        ...post,
        newPath: newPath,
        timestamp: new Date().toISOString()
      });
      
      console.log(`   ✅ Moved: ${post.slug} → ${post.category}/${post.hub}/`);
      movedCount++;
      
    } catch (error) {
      console.log(`   ❌ Failed to move ${post.slug}: ${error.message}`);
      migrationState.failed.push({
        ...post,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      failedCount++;
    }
  }
  
  // Save migration state
  migrationState.currentBatch = 1;
  fs.writeFileSync(migrationStateFile, JSON.stringify(migrationState, null, 2));
  
  console.log(`\n✅ Batch processing complete:`);
  console.log(`   ✅ Successfully moved: ${movedCount} posts`);
  console.log(`   ❌ Failed: ${failedCount} posts`);
  console.log(`   📁 Migration state saved: ${migrationStateFile}`);
  
  if (failedCount > 0) {
    console.log(`\n⚠️  Some posts failed to move. Check migration state for details.`);
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Move operation failed:', error.message);
  process.exit(1);
}
