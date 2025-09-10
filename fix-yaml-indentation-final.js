#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';

console.log('🔄 Fixing YAML indentation issues across all files...');

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

function fixFileIndentation(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if this file has the problematic 2-space indentation in schema blocks
    if (content.includes('schema: |\n    <script type="application/ld+json">\n{\n  "@context"')) {
      const relativePath = path.relative(blogDir, filePath);
      console.log(`   🔧 Fixing: ${relativePath}`);
      
      // Fix the indentation by replacing 2-space with 4-space for JSON content
      const lines = content.split('\n');
      const fixedLines = [];
      let inSchemaBlock = false;
      let inJsonContent = false;
      
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
            inJsonContent = false;
            fixedLines.push(line);
            continue;
          }
          
          if (line.trim() === '<script type="application/ld+json">') {
            inJsonContent = true;
            fixedLines.push('    ' + line);
            continue;
          }
          
          if (line.trim() === '</script>') {
            inJsonContent = false;
            fixedLines.push('    ' + line);
            continue;
          }
          
          if (inJsonContent) {
            // This is JSON content - fix indentation
            if (line.startsWith('  ') && !line.startsWith('    ') && line.trim() !== '') {
              // Convert 2-space indentation to 4-space for JSON content
              fixedLines.push('    ' + line);
            } else if (line.startsWith('    ') && line.trim() !== '') {
              // This is already 4-space, but might need more for nested objects
              if (line.includes('{') || line.includes('[')) {
                // Keep as is for opening braces
                fixedLines.push(line);
              } else if (line.includes('}') || line.includes(']')) {
                // Keep as is for closing braces
                fixedLines.push(line);
              } else {
                // This might be a nested property that needs 6-space or 8-space
                const trimmed = line.trim();
                if (trimmed.startsWith('"@type"') || trimmed.startsWith('"@id"') || 
                    trimmed.startsWith('"name"') || trimmed.startsWith('"url"')) {
                  // These are likely nested properties, need 6-space
                  fixedLines.push('      ' + trimmed);
                } else {
                  // Keep as is
                  fixedLines.push(line);
                }
              }
            } else {
              fixedLines.push(line);
            }
          } else {
            fixedLines.push(line);
          }
        } else {
          fixedLines.push(line);
        }
      }
      
      const newContent = fixedLines.join('\n');
      
      if (newContent !== originalContent) {
        fs.writeFileSync(filePath, newContent);
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    console.log(`   ❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

function main() {
  try {
    let processedCount = 0;
    let fixedCount = 0;
    let errorCount = 0;
    
    const files = getAllMarkdownFiles(blogDir);
    console.log(`📊 Found ${files.length} markdown files to process...`);
    
    files.forEach(filePath => {
      processedCount++;
      
      try {
        const wasFixed = fixFileIndentation(filePath);
        if (wasFixed) {
          fixedCount++;
        }
      } catch (error) {
        errorCount++;
        const relativePath = path.relative(blogDir, filePath);
        console.log(`   ❌ Error: ${relativePath} - ${error.message}`);
      }
    });
    
    console.log(`\n✅ YAML indentation fix complete:`);
    console.log(`   📊 Processed: ${processedCount} files`);
    console.log(`   🔧 Fixed: ${fixedCount} files`);
    console.log(`   ❌ Errors: ${errorCount} files`);
    console.log(`   ⏭️  No issues: ${processedCount - fixedCount - errorCount} files`);
    
    if (fixedCount > 0) {
      console.log(`\n🚀 Ready to commit and push changes!`);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

main();
