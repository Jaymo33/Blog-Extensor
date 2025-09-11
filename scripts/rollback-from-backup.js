import fs from 'fs';
import path from 'path';

console.log('🔄 Rollback script - Restore from backup if needed...');

function findLatestBackup() {
  const items = fs.readdirSync('.');
  const backupDirs = items.filter(item => 
    item.startsWith('backup-pre-migration-') && 
    fs.statSync(item).isDirectory()
  );
  
  if (backupDirs.length === 0) {
    console.log('❌ No backup directories found');
    return null;
  }
  
  // Sort by timestamp (newest first)
  backupDirs.sort().reverse();
  return backupDirs[0];
}

function rollbackFromBackup(backupDir) {
  try {
    console.log(`📁 Restoring from backup: ${backupDir}`);
    
    // Read manifest
    const manifestPath = path.join(backupDir, 'backup-manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.log('❌ Backup manifest not found');
      return false;
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`📋 Backup created: ${manifest.timestamp}`);
    console.log(`📊 Files in backup: ${manifest.backedUpFiles}`);
    
    // Get all files in backup
    function getAllFiles(dir) {
      const files = [];
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...getAllFiles(fullPath));
        } else if (item.endsWith('.md')) {
          files.push(fullPath);
        }
      }
      
      return files;
    }
    
    const backupFiles = getAllFiles(backupDir);
    console.log(`📁 Found ${backupFiles.length} files in backup`);
    
    let restoredCount = 0;
    let processedCount = 0;
    
    for (const backupFile of backupFiles) {
      processedCount++;
      
      if (processedCount % 1000 === 0) {
        console.log(`📈 Progress: ${processedCount}/${backupFiles.length} - Restoring...`);
      }
      
      try {
        // Calculate target path
        const relativePath = path.relative(backupDir, backupFile);
        const targetPath = path.join('src/content/blog', relativePath);
        
        // Create target directory if needed
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // Copy file
        const content = fs.readFileSync(backupFile, 'utf8');
        fs.writeFileSync(targetPath, content, 'utf8');
        restoredCount++;
        
      } catch (error) {
        console.error(`❌ Error restoring ${backupFile}:`, error.message);
      }
    }
    
    console.log('\n✅ Rollback complete!');
    console.log(`📊 Files restored: ${restoredCount}/${backupFiles.length}`);
    
    if (restoredCount === backupFiles.length) {
      console.log('\n🎉 SUCCESS! All files restored successfully!');
      return true;
    } else {
      console.log(`\n⚠️  Warning: ${backupFiles.length - restoredCount} files failed to restore`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    return false;
  }
}

// Main execution
const latestBackup = findLatestBackup();

if (!latestBackup) {
  console.log('❌ No backup found to rollback from');
  process.exit(1);
}

console.log(`📁 Latest backup: ${latestBackup}`);

// Ask for confirmation
console.log('\n⚠️  WARNING: This will overwrite all current markdown files!');
console.log('   Make sure you want to rollback before proceeding.');
console.log('\n   To proceed, run: node scripts/rollback-from-backup.js --confirm');
console.log('   To cancel, just close this script.');

// Check for confirmation flag
if (process.argv.includes('--confirm')) {
  const success = rollbackFromBackup(latestBackup);
  process.exit(success ? 0 : 1);
} else {
  console.log('\n⏸️  Rollback paused - waiting for confirmation');
  process.exit(0);
}
