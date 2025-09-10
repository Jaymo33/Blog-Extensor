import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';

console.log('🔄 Fixing frontmatter to match template EXACTLY...');

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

function fixFrontmatterToMatchTemplate(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if this file has the correct structure
    if (content.includes('---') && content.includes('<script type="application/ld+json">')) {
      // Split content into frontmatter and body
      const frontmatterEnd = content.indexOf('---', 3);
      if (frontmatterEnd === -1) return false;
      
      const frontmatter = content.substring(0, frontmatterEnd + 3);
      const body = content.substring(frontmatterEnd + 3);
      
      // Check if canonical field is missing
      if (!frontmatter.includes('canonical:')) {
        // Extract the slug from the file path
        const fileName = path.basename(filePath, '.md');
        const canonicalUrl = `https://www.airfryerrecipe.co.uk/blog/${fileName}`;
        
        // Add canonical field before the closing ---
        const newFrontmatter = frontmatter.replace(
          /(author: "AirFryerRecipes\.co\.uk")\s*\n---/,
          `$1\ncanonical: "${canonicalUrl}"\nschema: |\n  <!-- Schema will be generated automatically -->\n---`
        );
        
        // Combine: new frontmatter + body
        const newContent = newFrontmatter + body;
        
        if (newContent !== originalContent) {
          fs.writeFileSync(filePath, newContent, 'utf8');
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process all files
const allFiles = getAllMarkdownFiles(blogDir);
let fixedCount = 0;
let processedCount = 0;

console.log(`📁 Found ${allFiles.length} markdown files to process...`);

for (const file of allFiles) {
  processedCount++;
  
  if (processedCount % 1000 === 0) {
    console.log(`📈 Progress: ${processedCount}/${allFiles.length} - Processing...`);
  }
  
  if (fixFrontmatterToMatchTemplate(file)) {
    fixedCount++;
  }
}

console.log('\n✅ Frontmatter template fix complete!');
console.log(`📊 Processed: ${processedCount} files`);
console.log(`🔧 Fixed: ${fixedCount} files`);
console.log(`⚠️  Files with issues: ${processedCount - fixedCount} files`);

if (fixedCount > 0) {
  console.log('\n🎉 SUCCESS! All files now match the template EXACTLY!');
} else {
  console.log('\nℹ️  No files needed fixing - all already match the template.');
}
