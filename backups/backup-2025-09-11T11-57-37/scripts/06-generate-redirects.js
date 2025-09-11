#!/usr/bin/env node

/**
 * Generate redirects.json for Astro's native redirect system
 * Creates redirect mappings for all moved posts
 */

import fs from 'fs';
import path from 'path';

const migrationStateFile = 'out/migration-state.json';
const redirectsFile = 'src/data/redirects.json';

console.log('🔄 Generating redirects...');

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
  
  // Create redirect mappings
  const redirects = {};
  
  for (const post of movedPosts) {
    const oldSlug = post.slug;
    const newSlug = post.newSlug;
    
    // Remove the old URL prefix to get just the slug
    const oldUrlPath = post.oldUrl.replace('https://www.airfryerrecipe.co.uk/blog/', '');
    const newUrlPath = post.newUrl.replace('https://www.airfryerrecipe.co.uk/blog/', '');
    
    redirects[oldUrlPath] = newUrlPath;
  }
  
  // Ensure src/data directory exists
  const dataDir = path.dirname(redirectsFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Write redirects file
  fs.writeFileSync(redirectsFile, JSON.stringify(redirects, null, 2));
  
  console.log(`✅ Redirects generated:`);
  console.log(`   📊 Total redirects: ${Object.keys(redirects).length}`);
  console.log(`   📁 Output file: ${redirectsFile}`);
  
  // Show sample redirects
  console.log(`\n📋 Sample redirects:`);
  const sampleRedirects = Object.entries(redirects).slice(0, 5);
  sampleRedirects.forEach(([oldPath, newPath]) => {
    console.log(`   /blog/${oldPath} → /blog/${newPath}`);
  });
  
  if (Object.keys(redirects).length > 5) {
    console.log(`   ... and ${Object.keys(redirects).length - 5} more`);
  }
  
  console.log(`\n🔧 Next steps:`);
  console.log(`   1. Verify astro.config.mjs imports this redirects file`);
  console.log(`   2. Test redirects in development mode`);
  console.log(`   3. Deploy and verify redirects work in production`);
  
} catch (error) {
  console.error('❌ Redirect generation failed:', error.message);
  process.exit(1);
}
