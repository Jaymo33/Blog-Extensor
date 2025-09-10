import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';

console.log('🔄 Fixing nested property indentation issues...');

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

function fixNestedIndentation(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if this file has schema blocks
    if (content.includes('schema: |') && content.includes('<script type="application/ld+json">')) {
      const relativePath = path.relative(blogDir, filePath);
      
      let fixedContent = content;
      let hasChanges = false;
      
      // Fix nested property indentation
      // The issue is that some nested properties are using 8 spaces instead of 12 spaces
      // We need to fix lines that start with 8 spaces followed by a property
      
      // Fix nested object properties (should be 12 spaces for deeply nested)
      if (fixedContent.match(/^        (\s*"[^"]*":\s*[^,\n]*,?)$/m)) {
        fixedContent = fixedContent.replace(/^        (\s*"[^"]*":\s*[^,\n]*,?)$/gm, '                $1');
        hasChanges = true;
      }
      if (fixedContent.match(/^        (\s*"[^"]*":\s*\{)$/m)) {
        fixedContent = fixedContent.replace(/^        (\s*"[^"]*":\s*\{)$/gm, '                $1');
        hasChanges = true;
      }
      if (fixedContent.match(/^        (\s*\},?)$/m)) {
        fixedContent = fixedContent.replace(/^        (\s*\},?)$/gm, '                $1');
        hasChanges = true;
      }
      if (fixedContent.match(/^        (\s*\})$/m)) {
        fixedContent = fixedContent.replace(/^        (\s*\})$/gm, '                $1');
        hasChanges = true;
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
    console.log(`🎯 Fixing: nested property indentation (8 spaces -> 12 spaces)\n`);
    
    files.forEach((filePath, index) => {
      processedCount++;
      const currentFile = index + 1;
      const progress = `${currentFile}/${totalFiles}`;
      
      // Show progress every 500 files
      if (currentFile % 500 === 0 || currentFile === totalFiles) {
        console.log(`📈 Progress: ${progress} - Processing...`);
      }
      
      const result = fixNestedIndentation(filePath);
      if (result.fixed) {
        fixedCount++;
        console.log(`   ✅ Fixed: ${result.path}`);
      } else if (result.error) {
        errorCount++;
        console.log(`   ❌ Error: ${result.path} - ${result.error}`);
      }
    });
    
    console.log(`\n✅ Nested indentation fix complete:`);
    console.log(`   📊 Processed: ${processedCount} files`);
    console.log(`   🔧 Fixed: ${fixedCount} files`);
    console.log(`   ❌ Errors: ${errorCount} files`);
    
    if (fixedCount > 0) {
      console.log(`\n🚀 Ready to validate the fixes!`);
    } else {
      console.log(`\n✨ No files needed fixing!`);
    }
    
  } catch (error) {
    console.error('❌ Nested indentation fix failed:', error.message);
    process.exit(1);
  }
}

main();
