#!/usr/bin/env node

/**
 * Main migration script - orchestrates the entire migration process
 * Runs all migration steps in sequence with proper error handling
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting blog migration process...');
console.log('📋 This will:');
console.log('   1. Export all blog URLs');
console.log('   2. Classify posts into categories');
console.log('   3. Create nested folder structure');
console.log('   4. Move first 10 posts (representing different categories)');
console.log('   5. Update content with new URLs');
console.log('   6. Generate redirects');
console.log('   7. Validate results');
console.log('');

// Check if we're in the right directory
if (!fs.existsSync('src/content/blog')) {
  console.error('❌ Error: src/content/blog directory not found. Run this script from the project root.');
  process.exit(1);
}

// Check if migration state already exists
if (fs.existsSync('out/migration-state.json')) {
  console.log('⚠️  Migration state file already exists. This suggests a previous migration attempt.');
  console.log('   Options:');
  console.log('   1. Continue with existing state (if migration was interrupted)');
  console.log('   2. Rollback and start fresh');
  console.log('   3. Exit and handle manually');
  console.log('');
  
  // For now, we'll exit and let the user decide
  console.log('❌ Please handle the existing migration state manually before running this script.');
  console.log('   Use scripts/08-rollback.js to rollback, or delete out/migration-state.json to start fresh.');
  process.exit(1);
}

const steps = [
  { name: 'Export URLs', script: '01-export-urls.js' },
  { name: 'Classify Posts', script: '02-classify-posts.js' },
  { name: 'Create Folders', script: '03-create-folders.js' },
  { name: 'Move Posts', script: '04-move-posts.js' },
  { name: 'Update Content', script: '05-update-content.js' },
  { name: 'Generate Redirects', script: '06-generate-redirects.js' },
  { name: 'Validate Migration', script: '07-validate-migration.js' }
];

let currentStep = 0;

try {
  for (const step of steps) {
    currentStep++;
    console.log(`\n🔄 Step ${currentStep}/${steps.length}: ${step.name}`);
    console.log(`   Running: node scripts/${step.script}`);
    
    try {
      execSync(`node scripts/${step.script}`, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log(`   ✅ ${step.name} completed successfully`);
    } catch (error) {
      console.error(`   ❌ ${step.name} failed:`, error.message);
      console.error(`\n🛑 Migration stopped at step ${currentStep}: ${step.name}`);
      console.error(`   You can:`);
      console.error(`   1. Fix the issue and run: node scripts/${step.script}`);
      console.error(`   2. Rollback all changes: node scripts/08-rollback.js`);
      console.error(`   3. Check migration state: cat out/migration-state.json`);
      process.exit(1);
    }
  }
  
  console.log(`\n🎉 Migration completed successfully!`);
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ All ${steps.length} steps completed`);
  console.log(`   📁 Posts moved to nested folders`);
  console.log(`   🔄 Redirects generated`);
  console.log(`   ✅ Content updated with new URLs`);
  
  console.log(`\n🔧 Next steps:`);
  console.log(`   1. Test the site locally: npm run dev`);
  console.log(`   2. Verify redirects work in development`);
  console.log(`   3. Commit changes to git`);
  console.log(`   4. Deploy to production`);
  console.log(`   5. Monitor for any issues`);
  
  console.log(`\n📁 Files created:`);
  console.log(`   - out/exported-urls.csv (all blog URLs)`);
  console.log(`   - out/classified-posts.csv (classified posts)`);
  console.log(`   - out/unmatched-posts.csv (posts that couldn't be classified)`);
  console.log(`   - out/migration-state.json (migration progress)`);
  console.log(`   - src/data/redirects.json (Astro redirects)`);
  
} catch (error) {
  console.error(`\n❌ Migration failed:`, error.message);
  console.error(`\n🛑 Migration stopped at step ${currentStep}`);
  console.error(`   Check the output above for details.`);
  process.exit(1);
}
