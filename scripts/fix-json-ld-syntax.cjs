const fs = require('fs');
const path = require('path');

/**
 * Script to fix JSON-LD syntax errors in markdown files
 * Specifically fixes the issue where schema blocks end with triple quotes instead of proper YAML closure
 */

// Configuration
const BLOG_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'json-ld-fixes');

// Statistics
let stats = {
    totalFiles: 0,
    processedFiles: 0,
    modifiedFiles: 0,
    errors: 0,
    issues: {
        tripleQuoteClosures: 0,
        malformedJson: 0,
        missingClosingTags: 0
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
 * Fix triple quote closure issues in schema blocks
 * @param {string} content - File content
 * @returns {Object} - {content: string, modified: boolean}
 */
function fixTripleQuoteClosures(content) {
    let modified = false;
    
    // Pattern: schema block ending with "</script>\n    \"\"\""
    const tripleQuotePattern = /(<\/script>)\s*\n\s*"""/g;
    
    if (tripleQuotePattern.test(content)) {
        content = content.replace(tripleQuotePattern, '$1');
        stats.issues.tripleQuoteClosures++;
        modified = true;
    }
    
    return { content, modified };
}

/**
 * Validate JSON-LD blocks for syntax errors
 * @param {string} content - File content
 * @returns {Object[]} - Array of JSON syntax issues found
 */
function validateJsonLD(content) {
    const issues = [];
    const scriptBlocks = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    
    if (scriptBlocks) {
        scriptBlocks.forEach((block, index) => {
            try {
                // Extract JSON content between script tags
                const jsonMatch = block.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
                if (jsonMatch && jsonMatch[1]) {
                    const jsonContent = jsonMatch[1].trim();
                    
                    // Try to parse JSON
                    JSON.parse(jsonContent);
                }
            } catch (error) {
                issues.push({
                    type: 'malformed_json',
                    blockIndex: index + 1,
                    error: error.message,
                    block: block.substring(0, 100) + '...'
                });
                stats.issues.malformedJson++;
            }
        });
    }
    
    return issues;
}

/**
 * Fix missing closing script tags
 * @param {string} content - File content
 * @returns {Object} - {content: string, modified: boolean}
 */
function fixMissingClosingTags(content) {
    let modified = false;
    
    // Pattern: <script type="application/ld+json"> without proper closing
    const lines = content.split('\n');
    const fixedLines = [];
    let inJsonLdBlock = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for opening script tag
        if (line.includes('<script type="application/ld+json">')) {
            inJsonLdBlock = true;
            braceCount = 0;
            fixedLines.push(line);
            continue;
        }
        
        // If we're in a JSON-LD block
        if (inJsonLdBlock) {
            // Count braces to track JSON structure
            for (const char of line) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
            }
            
            fixedLines.push(line);
            
            // Check if this line closes the JSON-LD block
            if (line.includes('</script>')) {
                inJsonLdBlock = false;
            } else if (braceCount === 0 && line.trim().endsWith('}')) {
                // JSON seems complete but no closing tag - check next lines
                let hasClosingTag = false;
                for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
                    if (lines[j].includes('</script>')) {
                        hasClosingTag = true;
                        break;
                    }
                }
                
                if (!hasClosingTag) {
                    // Add missing closing tag
                    const indent = line.match(/^\s*/)[0];
                    fixedLines.push(indent + '</script>');
                    stats.issues.missingClosingTags++;
                    modified = true;
                    inJsonLdBlock = false;
                }
            }
        } else {
            fixedLines.push(line);
        }
    }
    
    return { content: fixedLines.join('\n'), modified };
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
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Create backup before modification
        createBackup(filePath);
        
        // Apply fixes
        let result = fixTripleQuoteClosures(content);
        content = result.content;
        let wasModified = result.modified;
        
        result = fixMissingClosingTags(content);
        content = result.content;
        wasModified = wasModified || result.modified;
        
        // Validate JSON-LD after fixes
        const jsonIssues = validateJsonLD(content);
        
        if (jsonIssues.length > 0) {
            console.log(`⚠️  JSON validation issues in ${path.basename(filePath)}:`);
            jsonIssues.forEach(issue => {
                console.log(`   - Block ${issue.blockIndex}: ${issue.error}`);
            });
        }
        
        // Write back if modified
        if (wasModified) {
            fs.writeFileSync(filePath, content, 'utf8');
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
    console.log('🔧 Fixing JSON-LD syntax errors in markdown files...\n');
    console.log(`Source directory: ${BLOG_DIR}`);
    console.log(`Backup directory: ${BACKUP_DIR}\n`);
    
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
    console.log(`Triple quote closures:       ${stats.issues.tripleQuoteClosures}`);
    console.log(`Missing closing tags:        ${stats.issues.missingClosingTags}`);
    console.log(`JSON validation warnings:    ${stats.issues.malformedJson}`);
    
    if (stats.modifiedFiles > 0) {
        console.log(`\n✅ Successfully fixed JSON-LD syntax in ${stats.modifiedFiles} files!`);
        console.log(`💾 Backups created in: ${BACKUP_DIR}`);
        console.log(`🔄 To revert changes, run: node scripts/revert-json-ld-fixes.cjs`);
        console.log(`\n💡 Test your schema markup at: https://validator.schema.org/`);
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