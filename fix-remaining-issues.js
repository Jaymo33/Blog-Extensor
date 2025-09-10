import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';

console.log('🔄 Fixing remaining double quotes and indentation issues...');

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

function fixRemainingIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if this file has the problematic patterns
    if (content.includes('""@type"') || content.includes('""@id"') || content.includes('""@context"')) {
      const relativePath = path.relative(blogDir, filePath);
      
      let fixedContent = content;
      
      // Fix all double quotes issues
      fixedContent = fixedContent.replace(/""@type"/g, '"@type"');
      fixedContent = fixedContent.replace(/""@id"/g, '"@id"');
      fixedContent = fixedContent.replace(/""@context"/g, '"@context"');
      fixedContent = fixedContent.replace(/""name"/g, '"name"');
      fixedContent = fixedContent.replace(/""url"/g, '"url"');
      fixedContent = fixedContent.replace(/""image"/g, '"image"');
      fixedContent = fixedContent.replace(/""logo"/g, '"logo"');
      fixedContent = fixedContent.replace(/""description"/g, '"description"');
      fixedContent = fixedContent.replace(/""headline"/g, '"headline"');
      fixedContent = fixedContent.replace(/""author"/g, '"author"');
      fixedContent = fixedContent.replace(/""publisher"/g, '"publisher"');
      fixedContent = fixedContent.replace(/""datePublished"/g, '"datePublished"');
      fixedContent = fixedContent.replace(/""dateModified"/g, '"dateModified"');
      fixedContent = fixedContent.replace(/""mainEntityOfPage"/g, '"mainEntityOfPage"');
      fixedContent = fixedContent.replace(/""articleSection"/g, '"articleSection"');
      fixedContent = fixedContent.replace(/""inLanguage"/g, '"inLanguage"');
      fixedContent = fixedContent.replace(/""about"/g, '"about"');
      fixedContent = fixedContent.replace(/""mainEntity"/g, '"mainEntity"');
      fixedContent = fixedContent.replace(/""acceptedAnswer"/g, '"acceptedAnswer"');
      fixedContent = fixedContent.replace(/""text"/g, '"text"');
      fixedContent = fixedContent.replace(/""itemListElement"/g, '"itemListElement"');
      fixedContent = fixedContent.replace(/""position"/g, '"position"');
      fixedContent = fixedContent.replace(/""item"/g, '"item"');
      fixedContent = fixedContent.replace(/""contactPoint"/g, '"contactPoint"');
      fixedContent = fixedContent.replace(/""contactType"/g, '"contactType"');
      fixedContent = fixedContent.replace(/""areaServed"/g, '"areaServed"');
      fixedContent = fixedContent.replace(/""availableLanguage"/g, '"availableLanguage"');
      fixedContent = fixedContent.replace(/""email"/g, '"email"');
      
      if (fixedContent !== originalContent) {
        fs.writeFileSync(filePath, fixedContent);
        console.log(`   🔧 Fixed double quotes: ${relativePath}`);
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
      
      // Show progress every 100 files so you can see what's happening
      if (currentFile % 100 === 0 || currentFile === totalFiles) {
        console.log(`📈 Progress: ${progress} - Processing...`);
      }
      
      try {
        const wasFixed = fixRemainingIssues(filePath);
        if (wasFixed) {
          fixedCount++;
        }
      } catch (error) {
        errorCount++;
        const relativePath = path.relative(blogDir, filePath);
        console.log(`   ❌ Error: ${relativePath} - ${error.message}`);
      }
    });
    
    console.log(`\n✅ Fix complete:`);
    console.log(`   📊 Processed: ${processedCount} files`);
    console.log(`   🔧 Fixed: ${fixedCount} files`);
    console.log(`   ❌ Errors: ${errorCount} files`);
    
    if (fixedCount > 0) {
      console.log(`\n🚀 Ready to commit and push changes!`);
    } else {
      console.log(`\n✨ No files needed fixing!`);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

main();
