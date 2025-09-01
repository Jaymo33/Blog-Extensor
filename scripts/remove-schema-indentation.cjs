const fs = require('fs');
const path = require('path');

/**
 * JavaScript script to remove indentation from <script type="application/ld+json"> lines
 * that come directly after "schema: |" in markdown files
 * This reverts the changes made by add-schema-indentation.cjs
 */

// Configuration
const BLOG_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');
const INDENTATION_PATTERNS = [
    '    ', // 4 spaces
    '      ', // 6 spaces
    '        ', // 8 spaces
    '\t' // tab
];

// Statistics
let stats = {
    totalFiles: 0,
    processedFiles: 0,
    modifiedFiles: 0,
    errors: 0
};

/**
 * Process a single markdown file to remove indentation
 * @param {string} filePath - Full path to the file
 * @returns {boolean} - True if file was modified
 */
function processFile(filePath) {
    try {
        stats.totalFiles++;
        
        // Read file content
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        let modified = false;
        let foundSchema = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check if this line contains "schema: |"
            if (line.trim().startsWith('schema: |')) {
                foundSchema = true;
                continue;
            }
            
            // If we found schema and this line contains <script type="application/ld+json">
            if (foundSchema && line.trim() === '<script type="application/ld+json">') {
                // Remove indentation if it has any
                const trimmedLine = line.trim();
                if (line !== trimmedLine) {
                    lines[i] = trimmedLine;
                    modified = true;
                }
                foundSchema = false; // Reset flag after processing
            } else if (foundSchema && line.trim() !== '') {
                // If we encounter any other non-empty line after schema, reset the flag
                foundSchema = false;
            }
        }
        
        if (modified) {
            // Write back to file
            const newContent = lines.join('\n');
            fs.writeFileSync(filePath, newContent, 'utf8');
            
            stats.modifiedFiles++;
            console.log(`✓ Reverted: ${path.basename(filePath)}`);
            return true;
        }
        
        return false;
        
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
    console.log('🔄 Removing indentation from schema script tags...\n');
    console.log(`Source directory: ${BLOG_DIR}`);
    console.log(`Removing all leading whitespace from <script type="application/ld+json"> lines\n`);
    
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
    console.log('\n📊 REVERT SUMMARY');
    console.log('═'.repeat(50));
    console.log(`Total files found:     ${stats.totalFiles}`);
    console.log(`Markdown files:        ${stats.processedFiles}`);
    console.log(`Files reverted:        ${stats.modifiedFiles}`);
    console.log(`Errors encountered:    ${stats.errors}`);
    console.log(`Processing time:       ${duration}s`);
    
    if (stats.modifiedFiles > 0) {
        console.log(`\n✅ Successfully removed indentation from <script> tags in ${stats.modifiedFiles} files!`);
        console.log(`💡 To re-apply indentation, run: node scripts/add-schema-indentation.cjs`);
    } else {
        console.log('\n ℹ️  No files needed reverting.');
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