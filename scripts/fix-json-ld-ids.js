#!/usr/bin/env node

/**
 * Fix @id fields in JSON-LD schema that weren't updated
 * Updates all @id references to use the new URLs
 */

import fs from 'fs';
import path from 'path';

const migrationStateFile = 'out/migration-state.json';

console.log('🔄 Fixing JSON-LD @id fields...');

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
  
  console.log(`📊 Fixing @id fields for ${movedPosts.length} posts...`);
  
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
      
      // Update all @id fields that reference the old URL
      const jsonLdIdRegex = /"@id":\s*"([^"]+)"/g;
      content = content.replace(jsonLdIdRegex, (match, url) => {
        if (url === post.oldUrl) {
          hasChanges = true;
          console.log(`   🔄 Updated @id: ${url} → ${post.newUrl}`);
          return `"@id": "${post.newUrl}"`;
        }
        return match;
      });
      
      // Write updated content
      if (hasChanges) {
        fs.writeFileSync(filePath, content);
        updatedCount++;
        console.log(`   ✅ Fixed @id fields: ${post.slug}`);
      } else {
        console.log(`   ⏭️  No @id changes needed: ${post.slug}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Failed to fix ${post.slug}: ${error.message}`);
      failedCount++;
    }
  }
  
  console.log(`\n✅ @id field fix complete:`);
  console.log(`   ✅ Successfully updated: ${updatedCount} posts`);
  console.log(`   ❌ Failed: ${failedCount} posts`);
  console.log(`   ⏭️  No changes needed: ${movedPosts.length - updatedCount - failedCount} posts`);
  
  if (failedCount > 0) {
    console.log(`\n⚠️  Some posts failed to update. Check the output above for details.`);
  }
  
} catch (error) {
  console.error('❌ @id field fix failed:', error.message);
  process.exit(1);
}
