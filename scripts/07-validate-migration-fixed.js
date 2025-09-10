#!/usr/bin/env node

/**
 * Validate the migration results
 * Checks file locations, URLs, and redirects
 */

import fs from 'fs';
import path from 'path';

const migrationStateFile = 'out/migration-state.json';
const redirectsFile = 'src/data/redirects.json';

console.log('🔄 Validating migration results...');

try {
  // Load migration state
  if (!fs.existsSync(migrationStateFile)) {
    console.error('❌ Migration state file not found.');
    process.exit(1);
  }
  
  const migrationState = JSON.parse(fs.readFileSync(migrationStateFile, 'utf8'));
  const movedPosts = migrationState.moved;
  const failedPosts = migrationState.failed;
  
  console.log(`📊 Migration Summary:`);
  console.log(`   ✅ Successfully moved: ${movedPosts.length} posts`);
  console.log(`   ❌ Failed: ${failedPosts.length} posts`);
  
  // Validate moved posts
  let validCount = 0;
  let invalidCount = 0;
  
  console.log(`\n🔍 Validating moved posts...`);
  
  for (const post of movedPosts) {
    const filePath = post.newPath;
    let isValid = true;
    const issues = [];
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      issues.push('File not found');
      isValid = false;
    } else {
      // Check file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if JSON-LD URL is correct (frontmatter doesn't have url field)
      const jsonLdUrlRegex = /"url":\s*"([^"]+)"/;
      const jsonLdMatch = content.match(jsonLdUrlRegex);
      if (jsonLdMatch) {
        const url = jsonLdMatch[1];
        if (url !== post.newUrl) {
          issues.push(`JSON-LD URL mismatch: ${url} vs ${post.newUrl}`);
          isValid = false;
        }
      } else {
        issues.push('No JSON-LD URL found');
        isValid = false;
      }
      
      // Check if typo was fixed
      if (content.includes('AirFryerRecipes.co.uk')) {
        issues.push('Typo not fixed: AirFryerRecipes.co.uk');
        isValid = false;
      }
    }
    
    if (isValid) {
      validCount++;
      console.log(`   ✅ ${post.slug}`);
    } else {
      invalidCount++;
      console.log(`   ❌ ${post.slug}: ${issues.join(', ')}`);
    }
  }
  
  // Validate redirects file
  console.log(`\n🔍 Validating redirects file...`);
  
  if (fs.existsSync(redirectsFile)) {
    const redirects = JSON.parse(fs.readFileSync(redirectsFile, 'utf8'));
    console.log(`   ✅ Redirects file exists with ${Object.keys(redirects).length} entries`);
    
    // Check if all moved posts have redirects
    let missingRedirects = 0;
    for (const post of movedPosts) {
      const oldSlug = post.slug;
      if (!redirects[oldSlug]) {
        missingRedirects++;
        console.log(`   ⚠️  Missing redirect for: ${oldSlug}`);
      }
    }
    
    if (missingRedirects === 0) {
      console.log(`   ✅ All moved posts have redirects`);
    } else {
      console.log(`   ❌ ${missingRedirects} posts missing redirects`);
    }
  } else {
    console.log(`   ❌ Redirects file not found: ${redirectsFile}`);
  }
  
  // Final validation summary
  console.log(`\n📊 Validation Summary:`);
  console.log(`   ✅ Valid posts: ${validCount}`);
  console.log(`   ❌ Invalid posts: ${invalidCount}`);
  console.log(`   📁 Total moved: ${movedPosts.length}`);
  
  if (invalidCount > 0) {
    console.log(`\n⚠️  Some posts have validation issues. Review the output above.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All validations passed! Migration is ready for deployment.`);
  }
  
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}
