#!/usr/bin/env node

/**
 * Fix breadcrumb indentation to match the schema template exactly
 * Uses the template structure and adds the nested category/hub levels
 */

import fs from 'fs';
import path from 'path';

const migrationStateFile = 'out/migration-state.json';
const blogDir = 'src/content/blog';

console.log('🔄 Fixing breadcrumb indentation to match template...');

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
 * Generate breadcrumb path matching the template structure exactly
 */
function generateBreadcrumbSchema(newUrl, postTitle) {
  // Extract path from URL: /blog/conversions/kg-to-pounds/0-1-kg-to-pounds
  const urlPath = newUrl.replace('https://www.airfryerrecipe.co.uk', '');
  const pathParts = urlPath.split('/').filter(part => part && part !== 'blog');
  
  // Start with Home and Blog (matching template)
  const breadcrumbs = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": {
        "@type": "WebPage",
        "@id": "https://www.airfryerrecipe.co.uk"
      }
    },
    {
      "@type": "ListItem", 
      "position": 2,
      "name": "blogs",
      "item": {
        "@type": "WebPage",
        "@id": "https://www.airfryerrecipe.co.uk/blog"
      }
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
      "item": {
        "@type": "WebPage",
        "@id": currentPath
      }
    });
  }
  
  // Add the final post (matching template structure)
  breadcrumbs.push({
    "@type": "ListItem",
    "position": position,
    "name": postTitle,
    "item": {
      "@type": "WebPage",
      "@id": newUrl
    }
  });
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "name": "Breadcrumbs",
    "@id": `${newUrl}#breadcrumbs`,
    "itemListElement": breadcrumbs
  };
}

let updatedCount = 0;
let noChangesCount = 0;
let errorCount = 0;

for (const post of movedPosts) {
  const newFilePath = path.join(blogDir, post.newSlug + '.md');
  
  if (!fs.existsSync(newFilePath)) {
    console.error(`❌ File not found: ${newFilePath}`);
    errorCount++;
    continue;
  }
  
  try {
    let content = fs.readFileSync(newFilePath, 'utf8');
    let hasChanges = false;
    
    // Extract post title from the content
    const titleMatch = content.match(/^title:\s*(.+)$/m);
    const postTitle = titleMatch ? titleMatch[1].trim() : post.slug;
    
    // Find and replace the breadcrumb schema with exact template formatting
    const breadcrumbStartRegex = /<script\s+type="application\/ld\+json">\s*{\s*"@context":\s*"https:\/\/schema\.org",\s*"@type":\s*"BreadcrumbList"/;
    
    if (breadcrumbStartRegex.test(content)) {
      // Find the start and end of the breadcrumb script
      const startMatch = content.match(breadcrumbStartRegex);
      if (startMatch) {
        const startIndex = content.indexOf(startMatch[0]);
        const remainingContent = content.substring(startIndex);
        const endMatch = remainingContent.match(/}\s*<\/script>/);
        
        if (endMatch) {
          const endIndex = startIndex + remainingContent.indexOf(endMatch[0]) + endMatch[0].length;
          const oldBreadcrumbScript = content.substring(startIndex, endIndex);
          
          // Generate new breadcrumb schema with exact template formatting
          const newBreadcrumbSchema = generateBreadcrumbSchema(post.newUrl, postTitle);
          const newBreadcrumbScript = `<script type="application/ld+json">\n${JSON.stringify(newBreadcrumbSchema, null, 4)}\n</script>`;
          
          content = content.replace(oldBreadcrumbScript, newBreadcrumbScript);
          hasChanges = true;
          console.log(`   🔄 Fixed breadcrumb indentation: ${post.slug}`);
        }
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(newFilePath, content);
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

console.log(`\n✅ Breadcrumb indentation fix complete:`);
console.log(`   🔧 Updated: ${updatedCount} files`);
console.log(`   ⏭️  No changes: ${noChangesCount} files`);
console.log(`   ❌ Errors: ${errorCount} files`);
