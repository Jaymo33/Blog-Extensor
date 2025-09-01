const fs = require('fs');
const path = require('path');

/**
 * Script to fix YAML indentation issues in markdown files
 * Specifically targets schema blocks with JSON-LD content
 * Ensures consistent 4-space indentation and proper script tag wrapping
 */

// Configuration
const BLOG_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');
const INDENTATION = '    '; // 4 spaces
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'yaml-fixes');

// Statistics
let stats = {
    totalFiles: 0,
    processedFiles: 0,
    modifiedFiles: 0,
    errors: 0,
    issues: {
        inconsistentIndentation: 0,
        missingScriptTags: 0,
        malformedJson: 0
    }
};

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
}

/**
 * Create backup of a file before modification
 * @param {string} filePath - Original file path
 */
function createBackup(filePath) {
    const fileName = path.basename(filePath);
    const backupPath = path.join(BACKUP_DIR, fileName);
    const content = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(backupPath, content, 'utf8');
}

/**
 * Check if a line is within a schema block
 * @param {string[]} lines - All lines of the file
 * @param {number} index - Current line index
 * @returns {boolean}
 */
function isInSchemaBlock(lines, index) {
    let schemaStart = -1;
    let schemaEnd = -1;
    
    // Find schema block boundaries
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('schema: |')) {
            schemaStart = i;
        } else if (schemaStart !== -1 && lines[i].trim() === '---') {
            schemaEnd = i;
            break;
        }
    }
    
    return index > schemaStart && index < schemaEnd;
}

/**
 * Fix JSON-LD blocks that aren't properly wrapped in script tags
 * @param {string[]} lines - Lines of the file
 * @returns {string[]} - Fixed lines
 */
function fixMissingScriptTags(lines) {
    const fixedLines = [...lines];
    let inSchemaBlock = false;
    let schemaBlockStart = -1;
    
    for (let i = 0; i < fixedLines.length; i++) {
        const line = fixedLines[i];
        
        // Detect start of schema block
        if (line.trim().startsWith('schema: |')) {
            inSchemaBlock = true;
            schemaBlockStart = i;
            continue;
        }
        
        // Detect end of schema block
        if (inSchemaBlock && line.trim() === '---') {
            inSchemaBlock = false;
            continue;
        }
        
        // If we're in a schema block and find JSON-LD without script tags
        if (inSchemaBlock && line.trim().startsWith('{') && 
            (i === 0 || !fixedLines[i-1].includes('<script type="application/ld+json">'))) {
            
            // Check if this is a standalone JSON block (not already in script tags)
            let needsScriptTags = true;
            
            // Look backwards for script tag
            for (let j = i - 1; j >= schemaBlockStart; j--) {
                if (fixedLines[j].includes('<script type="application/ld+json">')) {
                    needsScriptTags = false;
                    break;
                }
                if (fixedLines[j].includes('</script>')) {
                    break;
                }
            }
            
            if (needsScriptTags) {
                // Find the end of this JSON block
                let jsonEnd = i;
                let braceCount = 0;
                let inString = false;
                let escapeNext = false;
                
                for (let j = i; j < fixedLines.length; j++) {
                    const currentLine = fixedLines[j];
                    
                    for (let k = 0; k < currentLine.length; k++) {
                        const char = currentLine[k];
                        
                        if (escapeNext) {
                            escapeNext = false;
                            continue;
                        }
                        
                        if (char === '\\') {
                            escapeNext = true;
                            continue;
                        }
                        
                        if (char === '"' && !escapeNext) {
                            inString = !inString;
                            continue;
                        }
                        
                        if (!inString) {
                            if (char === '{') braceCount++;
                            if (char === '}') braceCount--;
                        }
                    }
                    
                    if (braceCount === 0) {
                        jsonEnd = j;
                        break;
                    }
                }
                
                // Add script tags
                const currentIndent = INDENTATION;
                fixedLines.splice(i, 0, currentIndent + '<script type="application/ld+json">');
                fixedLines.splice(jsonEnd + 2, 0, currentIndent + '</script>');
                
                stats.issues.missingScriptTags++;
                i = jsonEnd + 2; // Skip past the inserted content
            }
        }
    }
    
    return fixedLines;
}

/**
 * Fix indentation issues in the file
 * @param {string[]} lines - Lines of the file
 * @returns {string[]} - Fixed lines
 */
function fixIndentation(lines) {
    const fixedLines = [...lines];
    let inSchemaBlock = false;
    
    for (let i = 0; i < fixedLines.length; i++) {
        const line = fixedLines[i];
        
        // Detect start of schema block
        if (line.trim().startsWith('schema: |')) {
            inSchemaBlock = true;
            continue;
        }
        
        // Detect end of schema block
        if (inSchemaBlock && line.trim() === '---') {
            inSchemaBlock = false;
            continue;
        }
        
        // Fix indentation within schema block
        if (inSchemaBlock && line.trim() !== '') {
            const trimmedLine = line.trim();
            const expectedLine = INDENTATION + trimmedLine;
            
            // Check if indentation is wrong
            if (line !== expectedLine && trimmedLine !== '') {
                fixedLines[i] = expectedLine;
                stats.issues.inconsistentIndentation++;
            }
        }
    }
    
    return fixedLines;
}

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
        const lines = content.split('\n');
        
        // Create backup before modification
        createBackup(filePath);
        
        // Apply fixes
        let fixedLines = fixMissingScriptTags(lines);
        fixedLines = fixIndentation(fixedLines);
        
        // Check if any changes were made
        const newContent = fixedLines.join('\n');
        if (content !== newContent) {
            // Write back to file
            fs.writeFileSync(filePath, newContent, 'utf8');
            
            stats.modifiedFiles++;
            console.log(`✓ Fixed: ${path.basename(filePath)}`);
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
    console.log('🔧 Fixing YAML indentation issues in markdown files...\n');
    console.log(`Source directory: ${BLOG_DIR}`);
    console.log(`Backup directory: ${BACKUP_DIR}`);
    console.log(`Indentation: "${INDENTATION}" (4 spaces)\n`);
    
    // Check if blog directory exists
    if (!fs.existsSync(BLOG_DIR)) {
        console.error(`❌ Blog directory not found: ${BLOG_DIR}`);
        process.exit(1);
    }
    
    // Ensure backup directory exists
    ensureBackupDir();
    
    const startTime = Date.now();
    
    // Process all files
    processDirectory(BLOG_DIR);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Print summary
    console.log('\n📊 PROCESSING SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total files found:           ${stats.totalFiles}`);
    console.log(`Markdown files processed:    ${stats.processedFiles}`);
    console.log(`Files modified:              ${stats.modifiedFiles}`);
    console.log(`Errors encountered:          ${stats.errors}`);
    console.log(`Processing time:             ${duration}s`);
    
    console.log('\n🔍 ISSUES FIXED');
    console.log('─'.repeat(60));
    console.log(`Inconsistent indentation:    ${stats.issues.inconsistentIndentation}`);
    console.log(`Missing script tags:         ${stats.issues.missingScriptTags}`);
    console.log(`Malformed JSON:              ${stats.issues.malformedJson}`);
    
    if (stats.modifiedFiles > 0) {
        console.log(`\n✅ Successfully fixed YAML indentation in ${stats.modifiedFiles} files!`);
        console.log(`💾 Backups created in: ${BACKUP_DIR}`);
        console.log(`🔄 To revert changes, run: node scripts/revert-yaml-fixes.cjs`);
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