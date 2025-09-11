import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';
const backupDir = 'backup-pre-migration-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

console.log('🔄 Creating comprehensive backup before full migration...');
console.log(`📁 Backup directory: ${backupDir}`);

function getAllMarkdownFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function createBackup() {
  try {
    // Create backup directory
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Get all markdown files
    const allFiles = getAllMarkdownFiles(blogDir);
    console.log(`📁 Found ${allFiles.length} markdown files to backup...`);
    
    let backedUpCount = 0;
    let processedCount = 0;
    
    for (const file of allFiles) {
      processedCount++;
      
      if (processedCount % 1000 === 0) {
        console.log(`📈 Progress: ${processedCount}/${allFiles.length} - Backing up...`);
      }
      
      try {
        // Read the file
        const content = fs.readFileSync(file, 'utf8');
        
        // Create relative path for backup
        const relativePath = path.relative(blogDir, file);
        const backupPath = path.join(backupDir, relativePath);
        
        // Create backup directory structure
        const backupDirPath = path.dirname(backupPath);
        if (!fs.existsSync(backupDirPath)) {
          fs.mkdirSync(backupDirPath, { recursive: true });
        }
        
        // Write backup file
        fs.writeFileSync(backupPath, content, 'utf8');
        backedUpCount++;
        
      } catch (error) {
        console.error(`❌ Error backing up ${file}:`, error.message);
      }
    }
    
    // Create backup manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      totalFiles: allFiles.length,
      backedUpFiles: backedUpCount,
      backupDirectory: backupDir,
      sourceDirectory: blogDir,
      description: "Complete backup of all markdown files before full URL migration"
    };
    
    fs.writeFileSync(
      path.join(backupDir, 'backup-manifest.json'), 
      JSON.stringify(manifest, null, 2), 
      'utf8'
    );
    
    console.log('\n✅ Comprehensive backup complete!');
    console.log(`📊 Total files: ${allFiles.length}`);
    console.log(`💾 Backed up: ${backedUpCount} files`);
    console.log(`📁 Backup location: ${backupDir}/`);
    console.log(`📋 Manifest: ${backupDir}/backup-manifest.json`);
    
    if (backedUpCount === allFiles.length) {
      console.log('\n🎉 SUCCESS! All files backed up successfully!');
      return true;
    } else {
      console.log(`\n⚠️  Warning: ${allFiles.length - backedUpCount} files failed to backup`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    return false;
  }
}

// Run backup
const success = createBackup();

if (success) {
  console.log('\n✅ Ready to proceed with migration!');
  process.exit(0);
} else {
  console.log('\n❌ Backup failed - migration aborted for safety');
  process.exit(1);
}
