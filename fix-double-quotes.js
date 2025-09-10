import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';

console.log('🔧 Fixing double quotes issue...');

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

function fixFileQuotes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix double quotes issue
    if (content.includes('""@context"')) {
      const relativePath = path.relative(blogDir, filePath);
      console.log(`   🔧 Fixing quotes: ${relativePath}`);
      
      // Fix the double quotes
      content = content.replace(/""@context"/g, '"@context"');
      content = content.replace(/""@type"/g, '"@type"');
      content = content.replace(/""url"/g, '"url"');
      content = content.replace(/""mainEntityOfPage"/g, '"mainEntityOfPage"');
      content = content.replace(/""headline"/g, '"headline"');
      content = content.replace(/""description"/g, '"description"');
      content = content.replace(/""author"/g, '"author"');
      content = content.replace(/""publisher"/g, '"publisher"');
      content = content.replace(/""datePublished"/g, '"datePublished"');
      content = content.replace(/""dateModified"/g, '"dateModified"');
      content = content.replace(/""image"/g, '"image"');
      content = content.replace(/""about"/g, '"about"');
      content = content.replace(/""articleSection"/g, '"articleSection"');
      content = content.replace(/""inLanguage"/g, '"inLanguage"');
      content = content.replace(/""name"/g, '"name"');
      content = content.replace(/""logo"/g, '"logo"');
      content = content.replace(/""@id"/g, '"@id"');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
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
    
    files.forEach((filePath, index) => {
      processedCount++;
      const currentFile = index + 1;
      const progress = `${currentFile}/${totalFiles}`;
      
      // Show progress every 1000 files
      if (currentFile % 1000 === 0 || currentFile === totalFiles) {
        process.stdout.write(`\r📈 Progress: ${progress} - Processing...`);
      }
      
      try {
        const wasFixed = fixFileQuotes(filePath);
        if (wasFixed) {
          fixedCount++;
        }
      } catch (error) {
        errorCount++;
        const relativePath = path.relative(blogDir, filePath);
        console.log(`\n   ❌ Error: ${relativePath} - ${error.message}`);
      }
    });
    
    // Clear the progress line and show final results
    process.stdout.write('\r' + ' '.repeat(80) + '\r');
    
    console.log(`\n✅ Double quotes fix complete:`);
    console.log(`   📊 Processed: ${processedCount} files`);
    console.log(`   🔧 Fixed: ${fixedCount} files`);
    console.log(`   ❌ Errors: ${errorCount} files`);
    
    if (fixedCount > 0) {
      console.log(`\n🚀 Ready to commit and push changes!`);
    } else {
      console.log(`\n✨ No double quotes issues found!`);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

main();
