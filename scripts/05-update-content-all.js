#!/usr/bin/env node

/**
 * Update content for ALL migrated blog posts
 * Updates URLs in frontmatter, JSON-LD, and fixes typos
 */

import fs from 'fs';
import path from 'path';

const migrationStateFile = 'out/migration-state.json';

console.log('🔄 Updating blog post content...');

try {
  // Load migration state
  if (!fs.existsSync(migrationStateFile)) {
    console.error('❌ Migration state file not found');
    process.exit(1);
  }
  
  const migrationState = JSON.parse(fs.readFileSync(migrationStateFile, 'utf8'));
  const posts = migrationState.moved;
  
  console.log(`📊 Updating content for ${posts.length} posts...`);
  
  let updatedCount = 0;
  let noChangesCount = 0;
  let failedCount = 0;
  const failedPosts = [];
  
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    
    if ((i + 1) % 1000 === 0) {
      console.log(`📈 Progress: ${i + 1}/${posts.length} - Updating content...`);
    }
    
    try {
      // Check if file exists at new location
      if (!fs.existsSync(post.newPath)) {
        console.log(`⚠️  File not found: ${post.newPath}`);
        failedPosts.push({ ...post, error: 'File not found' });
        failedCount++;
        continue;
      }
      
      // Read file content
      let content = fs.readFileSync(post.newPath, 'utf8');
      const originalContent = content;
      
      // Update JSON-LD URLs
      const oldUrlEscaped = post.oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const newUrlEscaped = post.newUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Replace URLs in JSON-LD
      content = content.replace(
        new RegExp(`"url":\\s*"${oldUrlEscaped}"`, 'g'),
        `"url": "${post.newUrl}"`
      );
      
      // Replace @id URLs in JSON-LD
      content = content.replace(
        new RegExp(`"@id":\\s*"${oldUrlEscaped}"`, 'g'),
        `"@id": "${post.newUrl}"`
      );
      
      // Replace @id URLs with #breadcrumbs pattern
      content = content.replace(
        new RegExp(`"@id":\\s*"${oldUrlEscaped}#breadcrumbs"`, 'g'),
        `"@id": "${post.newUrl}#breadcrumbs"`
      );
      
      // Update canonical URL in frontmatter
      content = content.replace(
        new RegExp(`canonical:\\s*"${oldUrlEscaped}"`, 'g'),
        `canonical: "${post.newUrl}"`
      );
      
      // Fix AirFryerRecipes.co.uk typo to AirFryerRecipe.co.uk
      content = content.replace(/AirFryerRecipes\.co\.uk/g, 'AirFryerRecipe.co.uk');
      
      // Check if any changes were made
      if (content !== originalContent) {
        // Write updated content
        fs.writeFileSync(post.newPath, content, 'utf8');
        updatedCount++;
      } else {
        noChangesCount++;
      }
      
    } catch (error) {
      console.error(`❌ Failed to update ${post.slug}:`, error.message);
      failedPosts.push({ ...post, error: error.message });
      failedCount++;
    }
  }
  
  console.log('\n✅ Content update complete:');
  console.log(`   ✅ Successfully updated: ${updatedCount} posts`);
  console.log(`   ⏭️  No changes needed: ${noChangesCount} posts`);
  console.log(`   ❌ Failed: ${failedCount} posts`);
  
  if (failedCount > 0) {
    console.log('\n⚠️  Failed posts:');
    failedPosts.slice(0, 10).forEach(post => {
      console.log(`   - ${post.slug}: ${post.error}`);
    });
    if (failedPosts.length > 10) {
      console.log(`   ... and ${failedPosts.length - 10} more failures`);
    }
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
