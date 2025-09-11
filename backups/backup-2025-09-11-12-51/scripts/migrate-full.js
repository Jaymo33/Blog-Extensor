#!/usr/bin/env node

/**
 * Full migration script - migrates ALL remaining blog posts
 * Uses safe validation that doesn't break schema
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting FULL blog migration process...');
console.log('📋 This will:');
console.log('   1. Export all remaining blog URLs (9,273 posts)');
console.log('   2. Classify posts into categories');
console.log('   3. Create nested folder structure');
console.log('   4. Move ALL posts to new locations');
console.log('   5. Update content with new URLs');
console.log('   6. Generate redirects');
console.log('   7. Validate results (safe version)');
console.log('');

// Check if we're in the right directory
if (!fs.existsSync('src/content/blog')) {
  console.error('❌ Error: src/content/blog directory not found. Run this script from the project root.');
  process.exit(1);
}

// Check if backup exists
const backupDirs = fs.readdirSync('.').filter(item => 
  item.startsWith('backup-pre-migration-') && 
  fs.statSync(item).isDirectory()
);

if (backupDirs.length === 0) {
  console.error('❌ No backup found! Please run scripts/00-comprehensive-backup.js first.');
  process.exit(1);
}

console.log(`✅ Backup found: ${backupDirs[0]}`);
console.log('   You can rollback with: node scripts/rollback-from-backup.js --confirm');
console.log('');

// Check if migration state already exists
if (fs.existsSync('out/migration-state.json')) {
  console.log('⚠️  Migration state file already exists.');
  console.log('   This will continue from where we left off (10 test posts already migrated).');
  console.log('');
}

const steps = [
  { name: 'Export URLs', script: '01-export-urls.js' },
  { name: 'Classify Posts', script: '02-classify-posts.js' },
  { name: 'Create Folders', script: '03-create-folders.js' },
  { name: 'Move Posts (ALL)', script: '04-move-posts.js' },
  { name: 'Update Content', script: '05-update-content.js' },
  { name: 'Generate Redirects', script: '06-generate-redirects.js' },
  { name: 'Validate Migration (Safe)', script: '07-validate-migration-safe.js' }
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
      console.error(`   2. Rollback all changes: node scripts/rollback-from-backup.js --confirm`);
      console.error(`   3. Check migration state: cat out/migration-state.json`);
      process.exit(1);
    }
  }
  
  console.log(`\n🎉 FULL MIGRATION completed successfully!`);
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ All ${steps.length} steps completed`);
  console.log(`   📁 ALL posts moved to nested folders`);
  console.log(`   🔄 Redirects generated for all posts`);
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
  
  console.log(`\n🛡️  Safety:`);
  console.log(`   - Full backup available: ${backupDirs[0]}`);
  console.log(`   - Rollback command: node scripts/rollback-from-backup.js --confirm`);
  
} catch (error) {
  console.error(`\n❌ Migration failed:`, error.message);
  console.error(`\n🛑 Migration stopped at step ${currentStep}`);
  console.error(`   Check the output above for details.`);
  process.exit(1);
}
