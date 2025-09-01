const fs = require('fs');
const path = require('path');

/**
 * Script to revert YAML indentation fixes by restoring from backups
 * This undoes changes made by fix-yaml-indentation.cjs
 */

// Configuration
const BLOG_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'yaml-fixes');

// Statistics
let stats = {
    totalBackups: 0,
    restoredFiles: 0,
    errors: 0
};

/**
 * Restore a single file from backup
 * @param {string} backupPath - Path to backup file
 * @param {string} originalPath - Path to original file
 * @returns {boolean} - True if file was restored
 */
function restoreFile(backupPath, originalPath) {
    try {
        // Read backup content
        const backupContent = fs.readFileSync(backupPath, 'utf8');
        
        // Write back to original location
        fs.writeFileSync(originalPath, backupContent, 'utf8');
        
        stats.restoredFiles++;
        console.log(`✓ Restored: ${path.basename(originalPath)}`);
        return true;
        
    } catch (error) {
        stats.errors++;
        console.error(`✗ Error restoring ${path.basename(originalPath)}:`, error.message);
        return false;
    }
}

/**
 * Process all backup files and restore them
 */
function restoreFromBackups() {
    try {
        // Check if backup directory exists
        if (!fs.existsSync(BACKUP_DIR)) {
            console.error(`❌ Backup directory not found: ${BACKUP_DIR}`);
            console.log('No backups available to restore from.');
            return;
        }
        
        const backupFiles = fs.readdirSync(BACKUP_DIR);
        
        for (const backupFile of backupFiles) {
            if (backupFile.endsWith('.md')) {
                stats.totalBackups++;
                
                const backupPath = path.join(BACKUP_DIR, backupFile);
                const originalPath = path.join(BLOG_DIR, backupFile);
                
                // Check if original file exists
                if (fs.existsSync(originalPath)) {
                    restoreFile(backupPath, originalPath);
                } else {
                    console.warn(`⚠️  Original file not found: ${backupFile}`);
                }
            }
        }
        
    } catch (error) {
        console.error(`Error reading backup directory: ${error.message}`);
        stats.errors++;
    }
}

/**
 * Clean up backup files after successful restore
 */
function cleanupBackups() {
    try {
        const backupFiles = fs.readdirSync(BACKUP_DIR);
        
        for (const backupFile of backupFiles) {
            if (backupFile.endsWith('.md')) {
                const backupPath = path.join(BACKUP_DIR, backupFile);
                fs.unlinkSync(backupPath);
            }
        }
        
        // Remove backup directory if empty
        const remainingFiles = fs.readdirSync(BACKUP_DIR);
        if (remainingFiles.length === 0) {
            fs.rmdirSync(BACKUP_DIR);
            console.log(`🗑️  Cleaned up backup directory`);
        }
        
    } catch (error) {
        console.warn(`Warning: Could not clean up backups: ${error.message}`);
    }
}

/**
 * Main execution function
 */
function main() {
    console.log('🔄 Reverting YAML indentation fixes...\n');
    console.log(`Blog directory: ${BLOG_DIR}`);
    console.log(`Backup directory: ${BACKUP_DIR}\n`);
    
    // Check if blog directory exists
    if (!fs.existsSync(BLOG_DIR)) {
        console.error(`❌ Blog directory not found: ${BLOG_DIR}`);
        process.exit(1);
    }
    
    const startTime = Date.now();
    
    // Restore files from backups
    restoreFromBackups();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Print summary
    console.log('\n📊 REVERT SUMMARY');
    console.log('═'.repeat(50));
    console.log(`Total backups found:    ${stats.totalBackups}`);
    console.log(`Files restored:         ${stats.restoredFiles}`);
    console.log(`Errors encountered:     ${stats.errors}`);
    console.log(`Processing time:        ${duration}s`);
    
    if (stats.restoredFiles > 0) {
        console.log(`\n✅ Successfully reverted ${stats.restoredFiles} files!`);
        
        // Ask user if they want to clean up backups
        console.log(`\n🧹 Clean up backup files? (They won't be needed anymore)`);
        console.log(`💡 To clean up manually, delete the directory: ${BACKUP_DIR}`);
        
        // For now, we'll keep backups for safety
        // In a future version, we could add interactive cleanup
        
    } else {
        console.log('\n ℹ️  No files were restored.');
    }
    
    if (stats.errors > 0) {
        console.log(`\n⚠️  ${stats.errors} errors occurred during restoration.`);
        process.exit(1);
    }
}

// Execute the script
if (require.main === module) {
    main();
}

module.exports = {
    restoreFile,
    restoreFromBackups,
    main,
    stats
};