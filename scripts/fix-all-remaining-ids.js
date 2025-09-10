#!/usr/bin/env node

/**
 * Fix all remaining @id fields that still contain old URLs
 * This includes breadcrumb schemas and any other missed @id references
 */

import fs from 'fs';
import path from 'path';

const migrationStateFile = 'out/migration-state.json';
const blogDir = 'src/content/blog';

console.log('🔄 Fixing all remaining @id fields...');

// Load migration state
if (!fs.existsSync(migrationStateFile)) {
  console.error('❌ Migration state file not found. Run migration first.');
  process.exit(1);
}

const migrationState = JSON.parse(fs.readFileSync(migrationStateFile, 'utf8'));
const movedPosts = migrationState.moved || [];

if (movedPosts.length === 0) {
  console.log('ℹ️  No migrated posts found in migration state.');
  process.exit(0);
}

console.log(`📊 Found ${movedPosts.length} migrated posts to check...`);

let updatedCount = 0;
let noChangesCount = 0;
let errorCount = 0;

for (const post of movedPosts) {
  const oldFilePath = path.join(blogDir, post.oldSlug + '.md');
  const newFilePath = path.join(blogDir, post.newSlug + '.md');
  
  // Use new path if exists, otherwise old path
  const filePathToUpdate = fs.existsSync(newFilePath) ? newFilePath : oldFilePath;
  
  if (!fs.existsSync(filePathToUpdate)) {
    console.error(`❌ File not found: ${filePathToUpdate}`);
    errorCount++;
    continue;
  }
  
  try {
    let content = fs.readFileSync(filePathToUpdate, 'utf8');
    let hasChanges = false;
    
    // Fix all @id fields that contain the old URL
    const oldUrlPattern = (post.oldUrl || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const newUrlPattern = (post.newUrl || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Pattern to match @id fields with the old URL
    const idRegex = new RegExp(`"@id":\\s*"${oldUrlPattern}"`, 'g');
    
    if (idRegex.test(content)) {
      content = content.replace(idRegex, `"@id": "${post.newUrl}"`);
      hasChanges = true;
      console.log(`   🔄 Updated @id: ${post.oldUrl} → ${post.newUrl}`);
    }
    
    // Also check for breadcrumb-specific @id fields
    const breadcrumbIdRegex = new RegExp(`"@id":\\s*"${oldUrlPattern}#breadcrumbs"`, 'g');
    if (breadcrumbIdRegex.test(content)) {
      content = content.replace(breadcrumbIdRegex, `"@id": "${post.newUrl}#breadcrumbs"`);
      hasChanges = true;
      console.log(`   🔄 Updated breadcrumb @id: ${post.oldUrl}#breadcrumbs → ${post.newUrl}#breadcrumbs`);
    }
    
    // Check for any remaining old URL patterns in @id fields
    const anyOldIdRegex = new RegExp(`"@id":\\s*"https://www\\.airfryerrecipe\\.co\\.uk/blog/${post.oldSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
    if (anyOldIdRegex.test(content)) {
      content = content.replace(anyOldIdRegex, `"@id": "${post.newUrl}"`);
      hasChanges = true;
      console.log(`   🔄 Updated remaining @id: ${post.oldSlug} → ${post.newUrl}`);
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePathToUpdate, content);
      updatedCount++;
      console.log(`   ✅ Fixed @id fields: ${post.slug}`);
    } else {
      console.log(`   ⏭️  No @id changes needed: ${post.slug}`);
      noChangesCount++;
    }
    
  } catch (error) {
    console.error(`   ❌ Error processing ${post.slug}: ${error.message}`);
    errorCount++;
  }
}

console.log(`\n✅ @id field fix complete:`);
console.log(`   🔧 Updated: ${updatedCount} files`);
console.log(`   ⏭️  No changes: ${noChangesCount} files`);
console.log(`   ❌ Errors: ${errorCount} files`);
