#!/usr/bin/env node

/**
 * Fix YAML Indentation Issues
 * Reverts the 2-space indentation back to 4-space for schema blocks
 */

import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';

console.log('🔄 Fixing YAML indentation issues...');

/**
 * Fix indentation in a single file
 */
function fixFileIndentation(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Fix the schema block indentation
    // Look for schema: | followed by 2-space indented content
    const schemaRegex = /(schema: \|\n)(  <script type="application\/ld\+json">\n)(  \{)/g;
    if (schemaRegex.test(content)) {
      content = content.replace(schemaRegex, '$1    <script type="application/ld+json">\n    {');
      hasChanges = true;
    }
    
    // Fix the rest of the JSON content indentation
    // Replace 2-space indentation with 4-space for lines that start with 2 spaces after schema: |
    const lines = content.split('\n');
    let inSchemaBlock = false;
    let fixedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim() === 'schema: |') {
        inSchemaBlock = true;
        fixedLines.push(line);
        continue;
      }
      
      if (inSchemaBlock) {
        if (line.trim() === '---' && i > 0) {
          // End of frontmatter
          inSchemaBlock = false;
          fixedLines.push(line);
          continue;
        }
        
        if (line.startsWith('  ') && !line.startsWith('    ')) {
          // Convert 2-space indentation to 4-space
          fixedLines.push('  ' + line);
          hasChanges = true;
        } else {
          fixedLines.push(line);
        }
      } else {
        fixedLines.push(line);
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, fixedLines.join('\n'));
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.log(`   ❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Get all markdown files recursively
 */
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

/**
 * Main function
 */
function main() {
  try {
    let processedCount = 0;
    let fixedCount = 0;
    let errorCount = 0;
    
    // Get all markdown files
    const files = getAllMarkdownFiles(blogDir);
    
    console.log(`📊 Found ${files.length} markdown files to process...`);
    
    files.forEach(filePath => {
      processedCount++;
      const relativePath = path.relative(blogDir, filePath);
      
      try {
        const wasFixed = fixFileIndentation(filePath);
        if (wasFixed) {
          fixedCount++;
          console.log(`   ✅ Fixed: ${relativePath}`);
        } else {
          console.log(`   ⏭️  No issues: ${relativePath}`);
        }
      } catch (error) {
        errorCount++;
        console.log(`   ❌ Error: ${relativePath} - ${error.message}`);
      }
    });
    
    console.log(`\n✅ YAML indentation fix complete:`);
    console.log(`   📊 Processed: ${processedCount} files`);
    console.log(`   🔧 Fixed: ${fixedCount} files`);
    console.log(`   ❌ Errors: ${errorCount} files`);
    console.log(`   ⏭️  No issues: ${processedCount - fixedCount - errorCount} files`);
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

main();
