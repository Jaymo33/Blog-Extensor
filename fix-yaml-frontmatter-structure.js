import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';

console.log('🔄 Fixing YAML frontmatter structure - moving JSON-LD outside frontmatter...');

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

function fixFrontmatterStructure(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if this file has schema inside frontmatter
    if (content.includes('schema: |') && content.includes('<script type="application/ld+json">')) {
      // Split content into frontmatter and body
      const frontmatterEnd = content.indexOf('---', 3);
      if (frontmatterEnd === -1) return false;
      
      const frontmatter = content.substring(0, frontmatterEnd + 3);
      const body = content.substring(frontmatterEnd + 3);
      
      // Extract schema content from frontmatter
      const schemaMatch = frontmatter.match(/schema: \|\s*([\s\S]*?)(?=\n---)/);
      if (!schemaMatch) return false;
      
      const schemaContent = schemaMatch[1].trim();
      
      // Remove schema field from frontmatter
      const cleanFrontmatter = frontmatter.replace(/schema: \|\s*[\s\S]*?(?=\n---)/, '');
      
      // Combine: clean frontmatter + schema content + body
      const newContent = cleanFrontmatter + '\n' + schemaContent + body;
      
      if (newContent !== originalContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        return true;
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
  
  if (fixFrontmatterStructure(file)) {
    fixedCount++;
  }
}

console.log('\n✅ Frontmatter structure fix complete!');
console.log(`📊 Processed: ${processedCount} files`);
console.log(`🔧 Fixed: ${fixedCount} files`);
console.log(`⚠️  Files with issues: ${processedCount - fixedCount} files`);

if (fixedCount > 0) {
  console.log('\n🎉 SUCCESS! All files now have correct YAML frontmatter structure!');
} else {
  console.log('\nℹ️  No files needed fixing - all already have correct structure.');
}
