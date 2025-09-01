const fs = require('fs');
const path = require('path');

/**
 * JavaScript script to add proper indentation to <script type="application/ld+json"> lines
 * that come directly after "schema: |" in markdown files
 * Adds 4 spaces of indentation for proper YAML formatting
 */

// Configuration
const BLOG_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');
const INDENTATION = '    '; // 4 spaces

// Statistics
let stats = {
    totalFiles: 0,
    processedFiles: 0,
    modifiedFiles: 0,
    errors: 0
};

/**
 * Process a single markdown file to add indentation
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
            
            // If we found schema and this is the next line with <script type="application/ld+json">
            if (foundSchema && line.trim() === '<script type="application/ld+json">') {
                // Add indentation if it doesn't already have it
                if (!line.startsWith(INDENTATION)) {
                    lines[i] = INDENTATION + line.trim();
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
            console.log(`✓ Modified: ${path.basename(filePath)}`);
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
    console.log('🚀 Adding indentation to schema script tags...\n');
    console.log(`Source directory: ${BLOG_DIR}`);
    console.log(`Indentation: "${INDENTATION}" (4 spaces)\n`);
    
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
        console.log(`\n✅ Successfully added indentation to <script> tags in ${stats.modifiedFiles} files!`);
        console.log(`💡 To revert these changes, run: node scripts/remove-schema-indentation.cjs`);
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