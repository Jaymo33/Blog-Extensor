#!/usr/bin/env node

/**
 * Simple script to replace 'schema: """' with 'schema: |' in markdown files
 * Usage: node replace-schema-simple.js
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function replaceSchemaPattern() {
    const blogDir = path.join(__dirname, '..', 'src', 'content', 'blog');
    const pattern = path.join(blogDir, '**/*.md').replace(/\\/g, '/');
    
    console.log('🔍 Finding markdown files...');
    
    try {
        // Find all markdown files
        const files = await glob(pattern, { windowsPathsNoEscape: true });
        
        console.log(`📁 Found ${files.length} markdown files`);
        
        let modifiedCount = 0;
        
        for (const file of files) {
            try {
                // Read file
                let content = fs.readFileSync(file, 'utf8');
                
                // Replace pattern
                const originalContent = content;
                content = content.replace(/^(\s*)schema:\s*"""/gm, '$1schema: |');
                
                // Write back if changed
                if (content !== originalContent) {
                    fs.writeFileSync(file, content, 'utf8');
                    modifiedCount++;
                    console.log(`✅ ${path.basename(file)}`);
                }
                
            } catch (error) {
                console.error(`❌ Error processing ${file}:`, error.message);
            }
        }
        
        console.log(`\n🎉 Completed! Modified ${modifiedCount} files.`);
        
    } catch (error) {
        console.error('Error:', error.message);
        
        // Fallback to synchronous processing without glob
        console.log('Falling back to synchronous processing...');
        fallbackProcessing(blogDir);
    }
}

function fallbackProcessing(blogDir) {
    let modifiedCount = 0;
    
    function processDir(dir) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                processDir(fullPath);
            } else if (file.endsWith('.md')) {
                try {
                    let content = fs.readFileSync(fullPath, 'utf8');
                    const originalContent = content;
                    
                    content = content.replace(/^(\s*)schema:\s*"""/gm, '$1schema: |');
                    
                    if (content !== originalContent) {
                        fs.writeFileSync(fullPath, content, 'utf8');
                        modifiedCount++;
                        console.log(`✅ ${path.basename(file)}`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Error processing ${file}:`, error.message);
                }
            }
        }
    }
    
    processDir(blogDir);
    console.log(`\n🎉 Completed! Modified ${modifiedCount} files.`);
}

// Run the script
replaceSchemaPattern();