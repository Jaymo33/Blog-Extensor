const fs = require('fs');
const path = require('path');

/**
 * JavaScript script to replace 'schema: """' with 'schema: |' in markdown files
 * This converts YAML triple-quoted string syntax to literal block scalar syntax
 */

// Configuration
const BLOG_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');
const SEARCH_PATTERN = /^(\s*)schema:\s*"""/gm;
const REPLACE_PATTERN = '$1schema: |';

// Statistics
let stats = {
    totalFiles: 0,
    processedFiles: 0,
    modifiedFiles: 0,
    errors: 0
};

/**
 * Process a single markdown file
 * @param {string} filePath - Full path to the file
 * @returns {boolean} - True if file was modified
 */
function processFile(filePath) {
    try {
        stats.totalFiles++;
        
        // Read file content
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if the pattern exists
        const hasPattern = SEARCH_PATTERN.test(content);
        
        if (!hasPattern) {
            return false; // No changes needed
        }
        
        // Reset regex for replacement (global regex maintains state)
        SEARCH_PATTERN.lastIndex = 0;
        
        // Replace the pattern
        const newContent = content.replace(SEARCH_PATTERN, REPLACE_PATTERN);
        
        // Write back to file
        fs.writeFileSync(filePath, newContent, 'utf8');
        
        stats.modifiedFiles++;
        console.log(`✓ Modified: ${path.basename(filePath)}`);
        
        return true;
        
    } catch (error) {
        stats.errors++;
        console.error(`✗ Error processing ${path.basename(filePath)}:`, error.message);
        return false;
    }
}

/**
 * Recursively process all markdown files in a directory
 * @param {string} dirPath - Directory path to process
 */
function processDirectory(dirPath) {
    try {
        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Recursively process subdirectories
                processDirectory(fullPath);
            } else if (stat.isFile() && file.endsWith('.md')) {
                // Process markdown files
                stats.processedFiles++;
                processFile(fullPath);
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error.message);
        stats.errors++;
    }
}

/**
 * Main execution function
 */
function main() {
    console.log('🚀 Starting schema syntax replacement...\n');
    console.log(`Source directory: ${BLOG_DIR}`);
    console.log(`Search pattern: schema: """`);
    console.log(`Replace with: schema: |\n`);
    
    // Check if blog directory exists
    if (!fs.existsSync(BLOG_DIR)) {
        console.error(`❌ Blog directory not found: ${BLOG_DIR}`);
        process.exit(1);
    }
    
    const startTime = Date.now();
    
    // Process all files
    processDirectory(BLOG_DIR);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Print summary
    console.log('\n📊 PROCESSING SUMMARY');
    console.log('═'.repeat(50));
    console.log(`Total files found:     ${stats.totalFiles}`);
    console.log(`Markdown files:        ${stats.processedFiles}`);
    console.log(`Files modified:        ${stats.modifiedFiles}`);
    console.log(`Errors encountered:    ${stats.errors}`);
    console.log(`Processing time:       ${duration}s`);
    
    if (stats.modifiedFiles > 0) {
        console.log(`\n✅ Successfully replaced 'schema: """' with 'schema: |' in ${stats.modifiedFiles} files!`);
    } else {
        console.log('\n ℹ️  No files needed modification.');
    }
    
    if (stats.errors > 0) {
        console.log(`\n⚠️  ${stats.errors} errors occurred during processing.`);
        process.exit(1);
    }
}

// Execute the script
if (require.main === module) {
    main();
}

module.exports = {
    processFile,
    processDirectory,
    main,
    stats
};