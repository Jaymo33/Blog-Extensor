#!/usr/bin/env node

/**
 * Fix remaining @id fields and update breadcrumb paths to show new nested structure
 * Example: Home > Blog > Conversions > kg-to-pounds > Blog_Name
 */

import fs from 'fs';
import path from 'path';

const migrationStateFile = 'out/migration-state.json';
const blogDir = 'src/content/blog';

console.log('🔄 Fixing @id fields and updating breadcrumb paths...');

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

console.log(`📊 Found ${movedPosts.length} migrated posts to process...`);

/**
 * Generate breadcrumb path from new URL structure
 */
function generateBreadcrumbPath(newUrl) {
  // Extract path from URL: /blog/conversions/kg-to-pounds/0-1-kg-to-pounds
  const urlPath = newUrl.replace('https://www.airfryerrecipe.co.uk', '');
  const pathParts = urlPath.split('/').filter(part => part && part !== 'blog');
  
  const breadcrumbs = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.airfryerrecipe.co.uk"
    },
    {
      "@type": "ListItem", 
      "position": 2,
      "name": "Blog",
      "item": "https://www.airfryerrecipe.co.uk/blog"
    }
  ];
  
  let currentPath = "https://www.airfryerrecipe.co.uk/blog";
  let position = 3;
  
  // Add category and hub levels
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    currentPath += `/${part}`;
    
    // Convert slug to readable name
    const readableName = part
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      "@type": "ListItem",
      "position": position++,
      "name": readableName,
      "item": currentPath
    });
  }
  
  return breadcrumbs;
}

/**
 * Generate breadcrumb schema
 */
function generateBreadcrumbSchema(newUrl, postTitle) {
  const breadcrumbs = generateBreadcrumbPath(newUrl);
  
  // Add the final post
  breadcrumbs.push({
    "@type": "ListItem",
    "position": breadcrumbs.length + 1,
    "name": postTitle,
    "item": newUrl
  });
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs
  };
}

let updatedCount = 0;
let noChangesCount = 0;
let errorCount = 0;

for (const post of movedPosts) {
  const oldFilePath = path.join(blogDir, post.slug + '.md');
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
    
    // Fix remaining @id fields with old URLs
    const oldSlug = post.slug;
    const newUrl = post.newUrl;
    
    // Pattern to match any @id field with the old URL
    const oldUrlPattern = `https://www\\.airfryerrecipe\\.co\\.uk/blog/${oldSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
    const idRegex = new RegExp(`"@id":\\s*"${oldUrlPattern}(#breadcrumbs)?"`, 'g');
    
    if (idRegex.test(content)) {
      content = content.replace(idRegex, (match, breadcrumbSuffix) => {
        return `"@id": "${newUrl}${breadcrumbSuffix || ''}"`;
      });
      hasChanges = true;
      console.log(`   🔄 Updated @id fields: ${oldSlug} → ${newUrl}`);
    }
    
    // Update breadcrumb schema with new nested path
    const breadcrumbRegex = /<script\s+type="application\/ld\+json">\s*{\s*"@context":\s*"https:\/\/schema\.org",\s*"@type":\s*"BreadcrumbList"[^}]*}<\/script>/gs;
    
    if (breadcrumbRegex.test(content)) {
      // Extract post title from the content
      const titleMatch = content.match(/^title:\s*(.+)$/m);
      const postTitle = titleMatch ? titleMatch[1].trim() : post.slug;
      
      // Generate new breadcrumb schema
      const newBreadcrumbSchema = generateBreadcrumbSchema(newUrl, postTitle);
      const newBreadcrumbScript = `<script type="application/ld+json">\n${JSON.stringify(newBreadcrumbSchema, null, 2)}\n</script>`;
      
      content = content.replace(breadcrumbRegex, newBreadcrumbScript);
      hasChanges = true;
      console.log(`   🔄 Updated breadcrumb path: ${post.slug}`);
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePathToUpdate, content);
      updatedCount++;
      console.log(`   ✅ Fixed: ${post.slug}`);
    } else {
      console.log(`   ⏭️  No changes needed: ${post.slug}`);
      noChangesCount++;
    }
    
  } catch (error) {
    console.error(`   ❌ Error processing ${post.slug}: ${error.message}`);
    errorCount++;
  }
}

console.log(`\n✅ Breadcrumb and @id fix complete:`);
console.log(`   🔧 Updated: ${updatedCount} files`);
console.log(`   ⏭️  No changes: ${noChangesCount} files`);
console.log(`   ❌ Errors: ${errorCount} files`);
