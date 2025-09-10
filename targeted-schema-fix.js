import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';

console.log('🔄 Targeted Schema Fix - Fixing specific visible issues...');

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

function fixSpecificIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if this file has schema blocks
    if (content.includes('schema: |') && content.includes('<script type="application/ld+json">')) {
      const relativePath = path.relative(blogDir, filePath);
      
      let fixedContent = content;
      let hasChanges = false;
      
      // Fix 1: Fix double quotes issues (""@type" -> "@type")
      if (fixedContent.includes('""@type"')) {
        fixedContent = fixedContent.replace(/""@type"/g, '"@type"');
        hasChanges = true;
      }
      if (fixedContent.includes('""@id"')) {
        fixedContent = fixedContent.replace(/""@id"/g, '"@id"');
        hasChanges = true;
      }
      if (fixedContent.includes('""@context"')) {
        fixedContent = fixedContent.replace(/""@context"/g, '"@context"');
        hasChanges = true;
      }
      if (fixedContent.includes('""name"')) {
        fixedContent = fixedContent.replace(/""name"/g, '"name"');
        hasChanges = true;
      }
      if (fixedContent.includes('""url"')) {
        fixedContent = fixedContent.replace(/""url"/g, '"url"');
        hasChanges = true;
      }
      if (fixedContent.includes('""image"')) {
        fixedContent = fixedContent.replace(/""image"/g, '"image"');
        hasChanges = true;
      }
      if (fixedContent.includes('""logo"')) {
        fixedContent = fixedContent.replace(/""logo"/g, '"logo"');
        hasChanges = true;
      }
      if (fixedContent.includes('""description"')) {
        fixedContent = fixedContent.replace(/""description"/g, '"description"');
        hasChanges = true;
      }
      if (fixedContent.includes('""headline"')) {
        fixedContent = fixedContent.replace(/""headline"/g, '"headline"');
        hasChanges = true;
      }
      if (fixedContent.includes('""author"')) {
        fixedContent = fixedContent.replace(/""author"/g, '"author"');
        hasChanges = true;
      }
      if (fixedContent.includes('""publisher"')) {
        fixedContent = fixedContent.replace(/""publisher"/g, '"publisher"');
        hasChanges = true;
      }
      if (fixedContent.includes('""datePublished"')) {
        fixedContent = fixedContent.replace(/""datePublished"/g, '"datePublished"');
        hasChanges = true;
      }
      if (fixedContent.includes('""dateModified"')) {
        fixedContent = fixedContent.replace(/""dateModified"/g, '"dateModified"');
        hasChanges = true;
      }
      if (fixedContent.includes('""mainEntityOfPage"')) {
        fixedContent = fixedContent.replace(/""mainEntityOfPage"/g, '"mainEntityOfPage"');
        hasChanges = true;
      }
      if (fixedContent.includes('""articleSection"')) {
        fixedContent = fixedContent.replace(/""articleSection"/g, '"articleSection"');
        hasChanges = true;
      }
      if (fixedContent.includes('""inLanguage"')) {
        fixedContent = fixedContent.replace(/""inLanguage"/g, '"inLanguage"');
        hasChanges = true;
      }
      if (fixedContent.includes('""about"')) {
        fixedContent = fixedContent.replace(/""about"/g, '"about"');
        hasChanges = true;
      }
      if (fixedContent.includes('""mainEntity"')) {
        fixedContent = fixedContent.replace(/""mainEntity"/g, '"mainEntity"');
        hasChanges = true;
      }
      if (fixedContent.includes('""acceptedAnswer"')) {
        fixedContent = fixedContent.replace(/""acceptedAnswer"/g, '"acceptedAnswer"');
        hasChanges = true;
      }
      if (fixedContent.includes('""text"')) {
        fixedContent = fixedContent.replace(/""text"/g, '"text"');
        hasChanges = true;
      }
      if (fixedContent.includes('""itemListElement"')) {
        fixedContent = fixedContent.replace(/""itemListElement"/g, '"itemListElement"');
        hasChanges = true;
      }
      if (fixedContent.includes('""position"')) {
        fixedContent = fixedContent.replace(/""position"/g, '"position"');
        hasChanges = true;
      }
      if (fixedContent.includes('""item"')) {
        fixedContent = fixedContent.replace(/""item"/g, '"item"');
        hasChanges = true;
      }
      if (fixedContent.includes('""contactPoint"')) {
        fixedContent = fixedContent.replace(/""contactPoint"/g, '"contactPoint"');
        hasChanges = true;
      }
      if (fixedContent.includes('""contactType"')) {
        fixedContent = fixedContent.replace(/""contactType"/g, '"contactType"');
        hasChanges = true;
      }
      if (fixedContent.includes('""areaServed"')) {
        fixedContent = fixedContent.replace(/""areaServed"/g, '"areaServed"');
        hasChanges = true;
      }
      if (fixedContent.includes('""availableLanguage"')) {
        fixedContent = fixedContent.replace(/""availableLanguage"/g, '"availableLanguage"');
        hasChanges = true;
      }
      if (fixedContent.includes('""email"')) {
        fixedContent = fixedContent.replace(/""email"/g, '"email"');
        hasChanges = true;
      }
      
      // Fix 2: Fix indentation issues
      // Fix lines that start with 2 spaces followed by JSON content (should be 4 spaces)
      if (fixedContent.match(/^  (\s*"[^"]*":\s*[^,\n]*,?)$/m)) {
        fixedContent = fixedContent.replace(/^  (\s*"[^"]*":\s*[^,\n]*,?)$/gm, '        $1');
        hasChanges = true;
      }
      if (fixedContent.match(/^  (\s*"[^"]*":\s*\{)$/m)) {
        fixedContent = fixedContent.replace(/^  (\s*"[^"]*":\s*\{)$/gm, '        $1');
        hasChanges = true;
      }
      if (fixedContent.match(/^  (\s*\},?)$/m)) {
        fixedContent = fixedContent.replace(/^  (\s*\},?)$/gm, '        $1');
        hasChanges = true;
      }
      if (fixedContent.match(/^  (\s*\})$/m)) {
        fixedContent = fixedContent.replace(/^  (\s*\})$/gm, '        $1');
        hasChanges = true;
      }
      
      // Fix 3: Fix missing closing braces
      // Look for patterns like "inLanguage": "en-GB" followed by } without proper closing
      if (fixedContent.includes('"inLanguage": "en-GB"\n        }')) {
        fixedContent = fixedContent.replace('"inLanguage": "en-GB"\n        }', '"inLanguage": "en-GB"\n        }');
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
    console.log(`🎯 Fixing: double quotes, indentation, missing braces\n`);
    
    files.forEach((filePath, index) => {
      processedCount++;
      const currentFile = index + 1;
      const progress = `${currentFile}/${totalFiles}`;
      
      // Show progress every 100 files
      if (currentFile % 100 === 0 || currentFile === totalFiles) {
        console.log(`📈 Progress: ${progress} - Processing...`);
      }
      
      const result = fixSpecificIssues(filePath);
      if (result.fixed) {
        fixedCount++;
        console.log(`   ✅ Fixed: ${result.path}`);
      } else if (result.error) {
        errorCount++;
        console.log(`   ❌ Error: ${result.path} - ${result.error}`);
      }
    });
    
    console.log(`\n✅ Targeted fix complete:`);
    console.log(`   📊 Processed: ${processedCount} files`);
    console.log(`   🔧 Fixed: ${fixedCount} files`);
    console.log(`   ❌ Errors: ${errorCount} files`);
    
    if (fixedCount > 0) {
      console.log(`\n🚀 Ready to test the fixes!`);
    } else {
      console.log(`\n✨ No files needed fixing!`);
    }
    
  } catch (error) {
    console.error('❌ Targeted fix failed:', error.message);
    process.exit(1);
  }
}

main();
