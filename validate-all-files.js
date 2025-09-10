import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';

console.log('🔍 Validating all files for consistency...');

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
    const relativePath = path.relative(blogDir, filePath);
    
    const issues = [];
    
    // Check for double quotes issues
    if (content.includes('""@type"') || content.includes('""@id"') || content.includes('""@context"')) {
      issues.push('double quotes');
    }
    
    // Check for 2-space indentation in JSON blocks (should be 4+ spaces)
    const lines = content.split('\n');
    let inJsonBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('<script type="application/ld+json">')) {
        inJsonBlock = true;
        continue;
      }
      
      if (line.includes('</script>')) {
        inJsonBlock = false;
        continue;
      }
      
      if (inJsonBlock && line.trim() && !line.match(/^    /)) {
        // This line should start with 4 spaces but doesn't
        if (line.match(/^  [^ ]/)) {
          issues.push('incorrect indentation');
          break;
        }
      }
    }
    
    return { path: relativePath, issues };
    
  } catch (error) {
    return { path: path.relative(blogDir, filePath), issues: ['read error'] };
  }
}

function main() {
  try {
    let processedCount = 0;
    let errorCount = 0;
    let filesWithIssues = 0;
    
    const files = getAllMarkdownFiles(blogDir);
    const totalFiles = files.length;
    
    console.log(`📊 Found ${totalFiles} markdown files to validate...\n`);
    
    files.forEach((filePath, index) => {
      processedCount++;
      const currentFile = index + 1;
      const progress = `${currentFile}/${totalFiles}`;
      
      // Show progress every 1000 files
      if (currentFile % 1000 === 0 || currentFile === totalFiles) {
        console.log(`📈 Progress: ${progress} - Validating...`);
      }
      
      const validation = validateFile(filePath);
      if (validation.issues.length > 0) {
        filesWithIssues++;
        errorCount += validation.issues.length;
        console.log(`   ⚠️  Issues in ${validation.path}: ${validation.issues.join(', ')}`);
      }
    });
    
    console.log(`\n✅ Validation complete:`);
    console.log(`   📊 Processed: ${processedCount} files`);
    console.log(`   ⚠️  Files with issues: ${filesWithIssues} files`);
    console.log(`   ❌ Total issues: ${errorCount} issues`);
    
    if (filesWithIssues === 0) {
      console.log(`\n🎉 SUCCESS! All files are now consistent and match the template!`);
    } else {
      console.log(`\n⚠️  ${filesWithIssues} files still have issues that need attention.`);
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

main();
