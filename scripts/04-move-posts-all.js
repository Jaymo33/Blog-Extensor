#!/usr/bin/env node

/**
 * Move ALL blog posts to their new nested folder locations
 * Processes ALL remaining posts (not just 10)
 */

import fs from 'fs';
import path from 'path';

const inputFile = 'out/classified-posts.csv';
const blogDir = 'src/content/blog';
const migrationStateFile = 'out/migration-state.json';

console.log('🔄 Moving ALL blog posts to nested folders...');

try {
  // Read classified posts
  const csvContent = fs.readFileSync(inputFile, 'utf8');
  const lines = csvContent.split('\n');
  
  const posts = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(v => v.replace(/"/g, ''));
    const newPath = `src/content/blog/${values[4]}/${values[5]}/${values[0]}.md`;
    posts.push({
      slug: values[0],
      oldUrl: values[1],
      newSlug: values[2],
      newUrl: values[3],
      category: values[4],
      hub: values[5],
      filePath: values[6],
      newPath: newPath,
      contentLength: values[7]
    });
  }
  
  // Load migration state
  let migrationState = { moved: [], failed: [], currentBatch: 0 };
  if (fs.existsSync(migrationStateFile)) {
    migrationState = JSON.parse(fs.readFileSync(migrationStateFile, 'utf8'));
  }
  
  // Get already moved posts
  const movedSlugs = new Set(migrationState.moved.map(p => p.slug));
  
  // Filter out already moved posts
  const remainingPosts = posts.filter(post => !movedSlugs.has(post.slug));
  
  console.log(`📊 Total posts: ${posts.length}`);
  console.log(`✅ Already moved: ${migrationState.moved.length}`);
  console.log(`🔄 Remaining to move: ${remainingPosts.length}`);
  
  if (remainingPosts.length === 0) {
    console.log('✅ All posts already moved!');
    process.exit(0);
  }
  
  let movedCount = 0;
  let failedCount = 0;
  const failedPosts = [];
  
  console.log(`\n🔄 Processing ${remainingPosts.length} posts...`);
  
  for (let i = 0; i < remainingPosts.length; i++) {
    const post = remainingPosts[i];
    
    if ((i + 1) % 1000 === 0) {
      console.log(`📈 Progress: ${i + 1}/${remainingPosts.length} - Moving posts...`);
    }
    
    try {
      // Check if source file exists
      if (!fs.existsSync(post.filePath)) {
        console.log(`⚠️  Source file not found: ${post.filePath}`);
        failedPosts.push({ ...post, error: 'Source file not found' });
        failedCount++;
        continue;
      }
      
      // Create new directory if it doesn't exist
      const newDir = path.dirname(post.newPath);
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
      }
      
      // Move the file
      fs.renameSync(post.filePath, post.newPath);
      
      // Add to migration state
      migrationState.moved.push({
        ...post,
        timestamp: new Date().toISOString()
      });
      
      movedCount++;
      
    } catch (error) {
      console.error(`❌ Failed to move ${post.slug}:`, error.message);
      failedPosts.push({ ...post, error: error.message });
      failedCount++;
    }
  }
  
  // Update migration state
  migrationState.failed = [...migrationState.failed, ...failedPosts];
  migrationState.currentBatch++;
  
  // Save migration state
  fs.writeFileSync(migrationStateFile, JSON.stringify(migrationState, null, 2));
  
  console.log('\n✅ Batch processing complete:');
  console.log(`   ✅ Successfully moved: ${movedCount} posts`);
  console.log(`   ❌ Failed: ${failedCount} posts`);
  console.log(`   📁 Migration state saved: ${migrationStateFile}`);
  
  if (failedCount > 0) {
    console.log('\n⚠️  Failed posts:');
    failedPosts.slice(0, 10).forEach(post => {
      console.log(`   - ${post.slug}: ${post.error}`);
    });
    if (failedPosts.length > 10) {
      console.log(`   ... and ${failedPosts.length - 10} more failures`);
    }
  }
  
  console.log(`\n📊 Total migration progress:`);
  console.log(`   ✅ Total moved: ${migrationState.moved.length} posts`);
  console.log(`   ❌ Total failed: ${migrationState.failed.length} posts`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
