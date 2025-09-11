#!/usr/bin/env node

/**
 * Update blog post content with new URLs
 * Updates frontmatter, JSON-LD, and fixes typos
 */

import fs from 'fs';
import path from 'path';

const migrationStateFile = 'out/migration-state.json';

console.log('🔄 Updating blog post content...');

try {
  // Load migration state
  if (!fs.existsSync(migrationStateFile)) {
    console.error('❌ Migration state file not found. Run 04-move-posts.js first.');
    process.exit(1);
  }
  
  const migrationState = JSON.parse(fs.readFileSync(migrationStateFile, 'utf8'));
  const movedPosts = migrationState.moved;
  
  if (movedPosts.length === 0) {
    console.log('⚠️  No moved posts found in migration state.');
    process.exit(0);
  }
  
  console.log(`📊 Updating content for ${movedPosts.length} posts...`);
  
  let updatedCount = 0;
  let failedCount = 0;
  
  for (const post of movedPosts) {
    try {
      const filePath = post.newPath;
      
      if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️  File not found: ${filePath}`);
        failedCount++;
        continue;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      let hasChanges = false;
      
      // Update frontmatter URL
      const frontmatterUrlRegex = /^url:\s*["']?([^"'\n]+)["']?$/m;
      const frontmatterMatch = content.match(frontmatterUrlRegex);
      if (frontmatterMatch) {
        const oldUrl = frontmatterMatch[1];
        if (oldUrl !== post.newUrl) {
          content = content.replace(frontmatterUrlRegex, `url: "${post.newUrl}"`);
          hasChanges = true;
          console.log(`   🔄 Updated frontmatter URL: ${oldUrl} → ${post.newUrl}`);
        }
      }
      
      // Update JSON-LD URL
      const jsonLdUrlRegex = /"url":\s*"([^"]+)"/g;
      const jsonLdMainEntityRegex = /"mainEntityOfPage":\s*{\s*"@id":\s*"([^"]+)"/g;
      
      content = content.replace(jsonLdUrlRegex, (match, url) => {
        if (url === post.oldUrl) {
          hasChanges = true;
          console.log(`   🔄 Updated JSON-LD URL: ${url} → ${post.newUrl}`);
          return `"url": "${post.newUrl}"`;
        }
        return match;
      });
      
      content = content.replace(jsonLdMainEntityRegex, (match, url) => {
        if (url === post.oldUrl) {
          hasChanges = true;
          console.log(`   🔄 Updated JSON-LD mainEntityOfPage: ${url} → ${post.newUrl}`);
          return `"mainEntityOfPage": { "@id": "${post.newUrl}"`;
        }
        return match;
      });
      
      // Fix AirFryerRecipes.co.uk typo to AirFryerRecipe.co.uk
      const typoRegex = /AirFryerRecipes\.co\.uk/g;
      if (typoRegex.test(content)) {
        content = content.replace(typoRegex, 'AirFryerRecipe.co.uk');
        hasChanges = true;
        console.log(`   🔧 Fixed typo: AirFryerRecipes.co.uk → AirFryerRecipe.co.uk`);
      }
      
      // Write updated content
      if (hasChanges) {
        fs.writeFileSync(filePath, content);
        updatedCount++;
        console.log(`   ✅ Updated: ${post.slug}`);
      } else {
        console.log(`   ⏭️  No changes needed: ${post.slug}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Failed to update ${post.slug}: ${error.message}`);
      failedCount++;
    }
  }
  
  console.log(`\n✅ Content update complete:`);
  console.log(`   ✅ Successfully updated: ${updatedCount} posts`);
  console.log(`   ❌ Failed: ${failedCount} posts`);
  console.log(`   ⏭️  No changes needed: ${movedPosts.length - updatedCount - failedCount} posts`);
  
  if (failedCount > 0) {
    console.log(`\n⚠️  Some posts failed to update. Check the output above for details.`);
  }
  
} catch (error) {
  console.error('❌ Content update failed:', error.message);
  process.exit(1);
}
