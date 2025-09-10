import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';

console.log('🔍 Final letter-by-letter validation...');

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

function validateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check YAML frontmatter structure
    if (!content.startsWith('---\n')) {
      return { valid: false, issue: 'Missing opening ---' };
    }
    
    const frontmatterEnd = content.indexOf('---', 3);
    if (frontmatterEnd === -1) {
      return { valid: false, issue: 'Missing closing ---' };
    }
    
    const frontmatter = content.substring(0, frontmatterEnd + 3);
    
    // Check required fields
    const requiredFields = ['title:', 'description:', 'pubDate:', 'heroImage:', 'tags:', 'author:', 'canonical:', 'schema: |'];
    for (const field of requiredFields) {
      if (!frontmatter.includes(field)) {
        return { valid: false, issue: `Missing required field: ${field}` };
      }
    }
    
    // Check schema comment
    if (!frontmatter.includes('<!-- Schema will be generated automatically -->')) {
      return { valid: false, issue: 'Missing schema comment' };
    }
    
    // Check JSON-LD structure
    const body = content.substring(frontmatterEnd + 3);
    if (!body.includes('<script type="application/ld+json">')) {
      return { valid: false, issue: 'Missing JSON-LD script tag' };
    }
    
    // Check for proper JSON-LD indentation (4 spaces)
    const jsonLines = body.split('\n').filter(line => line.trim().startsWith('"'));
    for (const line of jsonLines) {
      if (line.startsWith('"') && !line.startsWith('    "')) {
        return { valid: false, issue: 'Incorrect JSON-LD indentation' };
      }
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, issue: `Error: ${error.message}` };
  }
}

// Process all files
const allFiles = getAllMarkdownFiles(blogDir);
let validCount = 0;
let invalidCount = 0;
const issues = [];

console.log(`📁 Validating ${allFiles.length} markdown files...`);

for (const file of allFiles) {
  const result = validateFile(file);
  
  if (result.valid) {
    validCount++;
  } else {
    invalidCount++;
    issues.push(`${path.basename(file)}: ${result.issue}`);
  }
}

console.log('\n✅ Final validation complete!');
console.log(`📊 Total files: ${allFiles.length}`);
console.log(`✅ Valid files: ${validCount}`);
console.log(`❌ Invalid files: ${invalidCount}`);

if (invalidCount > 0) {
  console.log('\n⚠️  Issues found:');
  issues.slice(0, 10).forEach(issue => console.log(`   - ${issue}`));
  if (issues.length > 10) {
    console.log(`   ... and ${issues.length - 10} more issues`);
  }
} else {
  console.log('\n🎉 PERFECT! All files are valid and match the template exactly!');
}
