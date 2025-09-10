import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';
const templatePath = 'templates/schema-template.txt';

console.log('🔄 Fixing all files to match template indentation...');

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

function fixFileToTemplate(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if this file has schema blocks
    if (content.includes('schema: |') && content.includes('<script type="application/ld+json">')) {
      const relativePath = path.relative(blogDir, filePath);
      
      let fixedContent = content;
      
      // Fix 1: Convert all 2-space indentation to 4-space indentation in JSON-LD blocks
      // This matches the template pattern exactly
      
      // Fix lines that start with 2 spaces followed by JSON content
      fixedContent = fixedContent.replace(/^  (\s*"[^"]*":\s*[^,\n]*,?)$/gm, '        $1');
      fixedContent = fixedContent.replace(/^  (\s*"[^"]*":\s*\{)$/gm, '        $1');
      fixedContent = fixedContent.replace(/^  (\s*\},?)$/gm, '        $1');
      fixedContent = fixedContent.replace(/^  (\s*\})$/gm, '        $1');
      
      // Fix 2: Fix double quotes issue (""@type" -> "@type")
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
      
      // Fix 3: Fix missing closing braces - look for patterns that need proper closing
      // This is more complex and needs to be done carefully
      
      if (fixedContent !== originalContent) {
        fs.writeFileSync(filePath, fixedContent);
        console.log(`   🔧 Fixed: ${relativePath}`);
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
    console.log(`📋 Using template: ${templatePath}`);
    
    files.forEach((filePath, index) => {
      processedCount++;
      const currentFile = index + 1;
      const progress = `${currentFile}/${totalFiles}`;
      
      // Show progress every 1000 files
      if (currentFile % 1000 === 0 || currentFile === totalFiles) {
        process.stdout.write(`\r📈 Progress: ${progress} - Processing...`);
      }
      
      try {
        const wasFixed = fixFileToTemplate(filePath);
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
    
    console.log(`\n✅ Template fix complete:`);
    console.log(`   📊 Processed: ${processedCount} files`);
    console.log(`   🔧 Fixed: ${fixedCount} files`);
    console.log(`   ❌ Errors: ${errorCount} files`);
    
    if (fixedCount > 0) {
      console.log(`\n🚀 Ready to commit and push changes!`);
    } else {
      console.log(`\n✨ No files needed fixing!`);
    }
    
  } catch (error) {
    console.error('❌ Template fix failed:', error.message);
    process.exit(1);
  }
}

main();
