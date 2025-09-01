const fs = require('fs');
const path = require('path');

/**
 * Diagnostic script to check for YAML indentation issues in markdown files
 * This script only reports issues without making any changes
 */

// Configuration
const BLOG_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');

// Statistics
let stats = {
    totalFiles: 0,
    processedFiles: 0,
    filesWithIssues: 0,
    errors: 0,
    issues: {
        inconsistentIndentation: 0,
        missingScriptTags: 0,
        malformedYaml: 0,
        mixedIndentation: 0
    }
};

// Store detailed issues for reporting
let detailedIssues = [];

/**
 * Check for indentation issues in a file
 * @param {string} filePath - Full path to the file
 * @param {string[]} lines - Lines of the file
 * @returns {Object[]} - Array of issues found
 */
function checkIndentationIssues(filePath, lines) {
    const issues = [];
    let inSchemaBlock = false;
    let schemaBlockStart = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
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
        
        // Check indentation within schema block
        if (inSchemaBlock && line.trim() !== '') {
            const leadingSpaces = line.match(/^ */)[0].length;
            const expectedSpaces = 4; // 4-space indentation
            
            // Check for inconsistent indentation
            if (leadingSpaces !== expectedSpaces && leadingSpaces !== 0) {
                issues.push({
                    type: 'inconsistent_indentation',
                    line: i + 1,
                    content: line.trim(),
                    expected: expectedSpaces,
                    actual: leadingSpaces,
                    severity: 'high'
                });
                stats.issues.inconsistentIndentation++;
            }
            
            // Check for mixed tabs and spaces
            if (line.includes('\t') && line.includes(' ')) {
                issues.push({
                    type: 'mixed_indentation',
                    line: i + 1,
                    content: line.trim(),
                    severity: 'medium'
                });
                stats.issues.mixedIndentation++;
            }
        }
    }
    
    return issues;
}

/**
 * Check for missing script tags around JSON-LD blocks
 * @param {string} filePath - Full path to the file
 * @param {string[]} lines - Lines of the file
 * @returns {Object[]} - Array of issues found
 */
function checkScriptTagIssues(filePath, lines) {
    const issues = [];
    let inSchemaBlock = false;
    let schemaBlockStart = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
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
        
        // Check for JSON-LD blocks without proper script tags
        if (inSchemaBlock && line.trim().startsWith('{')) {
            // Look backwards for script tag
            let hasScriptTag = false;
            for (let j = i - 1; j >= schemaBlockStart; j--) {
                if (lines[j].includes('<script type="application/ld+json">')) {
                    hasScriptTag = true;
                    break;
                }
                if (lines[j].includes('</script>')) {
                    break;
                }
            }
            
            if (!hasScriptTag) {
                issues.push({
                    type: 'missing_script_tag',
                    line: i + 1,
                    content: line.trim().substring(0, 50) + '...',
                    severity: 'high'
                });
                stats.issues.missingScriptTags++;
            }
        }
    }
    
    return issues;
}

/**
 * Check for YAML parsing issues
 * @param {string} filePath - Full path to the file
 * @param {string} content - File content
 * @returns {Object[]} - Array of issues found
 */
function checkYamlIssues(filePath, content) {
    const issues = [];
    
    try {
        // Extract frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            
            // Simple checks for common YAML issues
            const lines = frontmatter.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // Check for trailing spaces
                if (line.endsWith(' ') && line.trim() !== '') {
                    issues.push({
                        type: 'trailing_spaces',
                        line: i + 2, // +2 because of frontmatter delimiter
                        content: line,
                        severity: 'low'
                    });
                }
                
                // Check for inconsistent spacing around colons
                if (line.includes(':') && !line.includes('http') && line.trim() !== '') {
                    const colonMatch = line.match(/(\S):(\S)/);
                    if (colonMatch) {
                        issues.push({
                            type: 'colon_spacing',
                            line: i + 2,
                            content: line.trim(),
                            severity: 'low'
                        });
                    }
                }
            }
        }
    } catch (error) {
        issues.push({
            type: 'malformed_yaml',
            line: 0,
            content: error.message,
            severity: 'critical'
        });
        stats.issues.malformedYaml++;
    }
    
    return issues;
}

/**
 * Process a single markdown file for diagnostics
 * @param {string} filePath - Full path to the file
 * @returns {boolean} - True if issues were found
 */
function processFile(filePath) {
    try {
        stats.totalFiles++;
        
        // Read file content
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Check for various issues
        const indentationIssues = checkIndentationIssues(filePath, lines);
        const scriptTagIssues = checkScriptTagIssues(filePath, lines);
        const yamlIssues = checkYamlIssues(filePath, content);
        
        const allIssues = [...indentationIssues, ...scriptTagIssues, ...yamlIssues];
        
        if (allIssues.length > 0) {
            stats.filesWithIssues++;
            
            detailedIssues.push({
                file: path.basename(filePath),
                path: filePath,
                issues: allIssues
            });
            
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
 * Display detailed issue report
 */
function displayDetailedReport() {
    if (detailedIssues.length === 0) {
        console.log('\n🎉 No issues found in any files!');
        return;
    }
    
    console.log('\n📋 DETAILED ISSUE REPORT');
    console.log('═'.repeat(80));
    
    // Group issues by severity
    const criticalFiles = detailedIssues.filter(f => 
        f.issues.some(i => i.severity === 'critical'));
    const highFiles = detailedIssues.filter(f => 
        f.issues.some(i => i.severity === 'high'));
    const mediumFiles = detailedIssues.filter(f => 
        f.issues.some(i => i.severity === 'medium'));
    const lowFiles = detailedIssues.filter(f => 
        f.issues.some(i => i.severity === 'low'));
    
    // Display critical issues first
    if (criticalFiles.length > 0) {
        console.log('\n🚨 CRITICAL ISSUES (Prevent parsing):');
        criticalFiles.slice(0, 10).forEach(fileIssue => {
            console.log(`\n  📁 ${fileIssue.file}`);
            fileIssue.issues
                .filter(i => i.severity === 'critical')
                .forEach(issue => {
                    console.log(`     ❌ Line ${issue.line}: ${issue.type} - ${issue.content}`);
                });
        });
        if (criticalFiles.length > 10) {
            console.log(`     ... and ${criticalFiles.length - 10} more files with critical issues`);
        }
    }
    
    // Display high priority issues
    if (highFiles.length > 0) {
        console.log('\n⚠️  HIGH PRIORITY ISSUES:');
        highFiles.slice(0, 10).forEach(fileIssue => {
            console.log(`\n  📁 ${fileIssue.file}`);
            fileIssue.issues
                .filter(i => i.severity === 'high')
                .slice(0, 3)
                .forEach(issue => {
                    console.log(`     🔸 Line ${issue.line}: ${issue.type}`);
                });
        });
        if (highFiles.length > 10) {
            console.log(`     ... and ${highFiles.length - 10} more files with high priority issues`);
        }
    }
}

/**
 * Main execution function
 */
function main() {
    console.log('🔍 Diagnosing YAML indentation issues in markdown files...\n');
    console.log(`Source directory: ${BLOG_DIR}\n`);
    
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
    console.log('\n📊 DIAGNOSTIC SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total files scanned:         ${stats.totalFiles}`);
    console.log(`Markdown files processed:    ${stats.processedFiles}`);
    console.log(`Files with issues:           ${stats.filesWithIssues}`);
    console.log(`Errors encountered:          ${stats.errors}`);
    console.log(`Processing time:             ${duration}s`);
    
    console.log('\n🔍 ISSUE BREAKDOWN');
    console.log('─'.repeat(60));
    console.log(`Inconsistent indentation:    ${stats.issues.inconsistentIndentation}`);
    console.log(`Missing script tags:         ${stats.issues.missingScriptTags}`);
    console.log(`Malformed YAML:              ${stats.issues.malformedYaml}`);
    console.log(`Mixed indentation:           ${stats.issues.mixedIndentation}`);
    
    // Display detailed report
    displayDetailedReport();
    
    if (stats.filesWithIssues > 0) {
        console.log(`\n💡 To fix these issues automatically, run:`);
        console.log(`   node scripts/fix-yaml-indentation.cjs`);
    } else {
        console.log('\n✅ All files look good! No issues detected.');
    }
    
    if (stats.errors > 0) {
        console.log(`\n⚠️  ${stats.errors} errors occurred during scanning.`);
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