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
    
    // Check if this file has 2-space indented JSON in schema blocks
    if (content.includes('  "@context": "https://schema.org"')) {
      const relativePath = path.relative(blogDir, filePath);
      
      // Simple regex-based fix: replace 2-space indented JSON with 4-space
      let fixedContent = content;
      
      // Fix the main JSON properties
      fixedContent = fixedContent.replace(/^  ("@context":)/gm, '        "$1');
      fixedContent = fixedContent.replace(/^  ("@type":)/gm, '        "$1');
      fixedContent = fixedContent.replace(/^  ("url":)/gm, '        "$1');
      fixedContent = fixedContent.replace(/^  ("mainEntityOfPage":)/gm, '        "$1');
      fixedContent = fixedContent.replace(/^  ("headline":)/gm, '        "$1');
      fixedContent = fixedContent.replace(/^  ("description":)/gm, '        "$1');
      fixedContent = fixedContent.replace(/^  ("author":)/gm, '        "$1');
      fixedContent = fixedContent.replace(/^  ("publisher":)/gm, '        "$1');
      fixedContent = fixedContent.replace(/^  ("datePublished":)/gm, '        "$1');
      fixedContent = fixedContent.replace(/^  ("dateModified":)/gm, '        "$1');
      fixedContent = fixedContent.replace(/^  ("image":)/gm, '        "$1');
      fixedContent = fixedContent.replace(/^  ("about":)/gm, '        "$1');
      fixedContent = fixedContent.replace(/^  ("articleSection":)/gm, '        "$1');
      fixedContent = fixedContent.replace(/^  ("inLanguage":)/gm, '        "$1');
      fixedContent = fixedContent.replace(/^  ("name":)/gm, '        "$1');
      fixedContent = fixedContent.replace(/^  ("logo":)/gm, '        "$1');
      
      // Fix nested object properties (6-space indentation)
      fixedContent = fixedContent.replace(/^    ("@type":)/gm, '            "$1');
      fixedContent = fixedContent.replace(/^    ("@id":)/gm, '            "$1');
      fixedContent = fixedContent.replace(/^    ("name":)/gm, '            "$1');
      fixedContent = fixedContent.replace(/^    ("url":)/gm, '            "$1');
      fixedContent = fixedContent.replace(/^    ("image":)/gm, '            "$1');
      
      if (fixedContent !== originalContent) {
        fs.writeFileSync(filePath, fixedContent);
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
