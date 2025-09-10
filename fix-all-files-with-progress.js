import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';

console.log('🔄 Fixing ALL files with YAML indentation issues...');

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
    const totalFiles = files.length;
    
    console.log(`📊 Found ${totalFiles} markdown files to process...`);
    console.log('🚀 Starting processing...\n');
    
    files.forEach((filePath, index) => {
      processedCount++;
      const currentFile = index + 1;
      const progress = `${currentFile}/${totalFiles}`;
      const percentage = Math.round((currentFile / totalFiles) * 100);
      
      // Show progress every 100 files or for the first few files
      if (currentFile <= 10 || currentFile % 100 === 0 || currentFile === totalFiles) {
        process.stdout.write(`\r📈 Progress: ${progress} (${percentage}%) - Processing...`);
      }
      
      try {
        const wasFixed = fixFileIndentation(filePath);
        if (wasFixed) {
          fixedCount++;
          const relativePath = path.relative(blogDir, filePath);
          console.log(`\n   🔧 Fixed: ${relativePath} [${progress}]`);
        }
      } catch (error) {
        errorCount++;
        const relativePath = path.relative(blogDir, filePath);
        console.log(`\n   ❌ Error: ${relativePath} - ${error.message} [${progress}]`);
      }
    });
    
    // Clear the progress line and show final results
    process.stdout.write('\r' + ' '.repeat(80) + '\r');
    
    console.log(`\n✅ YAML indentation fix complete:`);
    console.log(`   📊 Processed: ${processedCount} files`);
    console.log(`   🔧 Fixed: ${fixedCount} files`);
    console.log(`   ❌ Errors: ${errorCount} files`);
    console.log(`   ⏭️  No issues: ${processedCount - fixedCount - errorCount} files`);
    
    if (fixedCount > 0) {
      console.log(`\n🚀 Ready to commit and push changes!`);
    } else {
      console.log(`\n✨ All files are already properly formatted!`);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

main();
