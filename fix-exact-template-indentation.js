import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';
const templatePath = 'templates/schema-template.txt';

console.log('🔄 Fixing EXACT template indentation...');

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

function fixExactIndentation(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if this file has schema blocks
    if (content.includes('schema: |') && content.includes('<script type="application/ld+json">')) {
      const relativePath = path.relative(blogDir, filePath);
      
      let fixedContent = content;
      let hasChanges = false;
      
      // Extract and fix each script block individually
      const scriptBlocks = fixedContent.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g);
      
      if (scriptBlocks) {
        scriptBlocks.forEach(block => {
          const jsonMatch = block.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
          if (jsonMatch) {
            const jsonContent = jsonMatch[1];
            
            // Parse the JSON to understand the structure
            try {
              const parsed = JSON.parse(jsonContent);
              
              // Rebuild with exact template indentation
              let formattedJson = JSON.stringify(parsed, null, 4);
              
              // Replace the block with properly formatted version
              const newBlock = `<script type="application/ld+json">\n${formattedJson}\n</script>`;
              fixedContent = fixedContent.replace(block, newBlock);
              hasChanges = true;
              
            } catch (parseError) {
              console.log(`   ⚠️  JSON parse error in ${relativePath}: ${parseError.message}`);
            }
          }
        });
      }
      
      if (hasChanges) {
        fs.writeFileSync(filePath, fixedContent);
        return { fixed: true, path: relativePath };
      }
    }
    
    return { fixed: false, path: null };
    
  } catch (error) {
    const relativePath = path.relative(blogDir, filePath);
    return { fixed: false, path: relativePath, error: error.message };
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
    console.log(`🎯 Fixing: EXACT template indentation using JSON.stringify(parsed, null, 4)\n`);
    
    files.forEach((filePath, index) => {
      processedCount++;
      const currentFile = index + 1;
      const progress = `${currentFile}/${totalFiles}`;
      
      // Show progress every 500 files
      if (currentFile % 500 === 0 || currentFile === totalFiles) {
        console.log(`📈 Progress: ${progress} - Processing...`);
      }
      
      const result = fixExactIndentation(filePath);
      if (result.fixed) {
        fixedCount++;
        console.log(`   ✅ Fixed: ${result.path}`);
      } else if (result.error) {
        errorCount++;
        console.log(`   ❌ Error: ${result.path} - ${result.error}`);
      }
    });
    
    console.log(`\n✅ Exact indentation fix complete:`);
    console.log(`   📊 Processed: ${processedCount} files`);
    console.log(`   🔧 Fixed: ${fixedCount} files`);
    console.log(`   ❌ Errors: ${errorCount} files`);
    
    if (fixedCount > 0) {
      console.log(`\n🚀 Ready to validate the fixes!`);
    } else {
      console.log(`\n✨ No files needed fixing!`);
    }
    
  } catch (error) {
    console.error('❌ Exact indentation fix failed:', error.message);
    process.exit(1);
  }
}

main();
