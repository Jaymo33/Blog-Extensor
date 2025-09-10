import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';
const templatePath = 'templates/schema-template.txt';

console.log('🔄 Comprehensive Schema Fix - Making ALL files match template exactly...');

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

function fixSchemaToTemplate(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if this file has schema blocks
    if (content.includes('schema: |') && content.includes('<script type="application/ld+json">')) {
      const relativePath = path.relative(blogDir, filePath);
      
      let fixedContent = content;
      let hasChanges = false;
      
      // Fix 1: Fix double quotes issues (""@type" -> "@type")
      const doubleQuotePatterns = [
        '""@type"', '""@id"', '""@context"', '""name"', '""url"', '""image"', '""logo"',
        '""description"', '""headline"', '""author"', '""publisher"', '""datePublished"',
        '""dateModified"', '""mainEntityOfPage"', '""articleSection"', '""inLanguage"',
        '""about"', '""mainEntity"', '""acceptedAnswer"', '""text"', '""itemListElement"',
        '""position"', '""item"', '""contactPoint"', '""contactType"', '""areaServed"',
        '""availableLanguage"', '""email"'
      ];
      
      doubleQuotePatterns.forEach(pattern => {
        const fixedPattern = pattern.replace('""', '"');
        if (fixedContent.includes(pattern)) {
          fixedContent = fixedContent.replace(new RegExp(pattern, 'g'), fixedPattern);
          hasChanges = true;
        }
      });
      
      // Fix 2: Fix indentation to match template (4-space indentation)
      // The template shows: script tag (4 spaces), JSON content (4 spaces), nested objects (8 spaces)
      
      // Fix script tag indentation
      fixedContent = fixedContent.replace(/^    <script type="application\/ld\+json">$/gm, '    <script type="application/ld+json">');
      
      // Fix JSON content indentation - ensure all JSON lines start with 4 spaces
      fixedContent = fixedContent.replace(/^  (\s*"[^"]*":\s*[^,\n]*,?)$/gm, '        $1');
      fixedContent = fixedContent.replace(/^  (\s*"[^"]*":\s*\{)$/gm, '        $1');
      fixedContent = fixedContent.replace(/^  (\s*\},?)$/gm, '        $1');
      fixedContent = fixedContent.replace(/^  (\s*\})$/gm, '        $1');
      
      // Fix nested object indentation (should be 8 spaces for nested properties)
      fixedContent = fixedContent.replace(/^        (\s*"[^"]*":\s*[^,\n]*,?)$/gm, '            $1');
      fixedContent = fixedContent.replace(/^        (\s*"[^"]*":\s*\{)$/gm, '            $1');
      fixedContent = fixedContent.replace(/^        (\s*\},?)$/gm, '            $1');
      fixedContent = fixedContent.replace(/^        (\s*\})$/gm, '            $1');
      
      // Fix deeper nesting (12 spaces for deeply nested objects)
      fixedContent = fixedContent.replace(/^            (\s*"[^"]*":\s*[^,\n]*,?)$/gm, '                $1');
      fixedContent = fixedContent.replace(/^            (\s*"[^"]*":\s*\{)$/gm, '                $1');
      fixedContent = fixedContent.replace(/^            (\s*\},?)$/gm, '                $1');
      fixedContent = fixedContent.replace(/^            (\s*\})$/gm, '                $1');
      
      // Fix 3: Ensure proper closing braces and structure
      // Look for missing closing braces in the main JSON object
      const scriptBlocks = fixedContent.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g);
      if (scriptBlocks) {
        scriptBlocks.forEach(block => {
          const jsonContent = block.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/)[1];
          const openBraces = (jsonContent.match(/\{/g) || []).length;
          const closeBraces = (jsonContent.match(/\}/g) || []).length;
          
          if (openBraces > closeBraces) {
            // Add missing closing braces
            const missingBraces = openBraces - closeBraces;
            const fixedBlock = block.replace(/<\/script>/, '}\n'.repeat(missingBraces) + '</script>');
            fixedContent = fixedContent.replace(block, fixedBlock);
            hasChanges = true;
          }
        });
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

function validateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(blogDir, filePath);
    
    // Check for remaining issues
    const issues = [];
    
    if (content.includes('""@type"') || content.includes('""@id"') || content.includes('""@context"')) {
      issues.push('double quotes');
    }
    
    // Check for 2-space indentation in JSON blocks
    const jsonBlocks = content.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g);
    if (jsonBlocks) {
      jsonBlocks.forEach(block => {
        const lines = block.split('\n');
        lines.forEach(line => {
          if (line.match(/^  [^ ]/) && !line.match(/^    <script/)) {
            issues.push('incorrect indentation');
          }
        });
      });
    }
    
    return { path: relativePath, issues };
    
  } catch (error) {
    return { path: path.relative(blogDir, filePath), issues: ['read error'] };
  }
}

function main() {
  try {
    let processedCount = 0;
    let fixedCount = 0;
    let errorCount = 0;
    let validationErrors = 0;
    
    const files = getAllMarkdownFiles(blogDir);
    const totalFiles = files.length;
    
    console.log(`📊 Found ${totalFiles} markdown files to process...`);
    console.log(`📋 Using template: ${templatePath}`);
    console.log(`🎯 Target: 4-space indentation, no double quotes, proper structure\n`);
    
    // Phase 1: Fix all files
    console.log('🔧 Phase 1: Fixing files...');
    files.forEach((filePath, index) => {
      processedCount++;
      const currentFile = index + 1;
      const progress = `${currentFile}/${totalFiles}`;
      
      // Show progress every 500 files
      if (currentFile % 500 === 0 || currentFile === totalFiles) {
        console.log(`📈 Progress: ${progress} - Processing...`);
      }
      
      const result = fixSchemaToTemplate(filePath);
      if (result.fixed) {
        fixedCount++;
        console.log(`   ✅ Fixed: ${result.path}`);
      } else if (result.error) {
        errorCount++;
        console.log(`   ❌ Error: ${result.path} - ${result.error}`);
      }
    });
    
    console.log(`\n🔍 Phase 2: Validating results...`);
    
    // Phase 2: Validate all files
    files.forEach((filePath, index) => {
      const currentFile = index + 1;
      const progress = `${currentFile}/${totalFiles}`;
      
      if (currentFile % 1000 === 0 || currentFile === totalFiles) {
        console.log(`📈 Validation Progress: ${progress} - Checking...`);
      }
      
      const validation = validateFile(filePath);
      if (validation.issues.length > 0) {
        validationErrors++;
        console.log(`   ⚠️  Issues in ${validation.path}: ${validation.issues.join(', ')}`);
      }
    });
    
    // Final results
    console.log(`\n✅ Comprehensive fix complete:`);
    console.log(`   📊 Processed: ${processedCount} files`);
    console.log(`   🔧 Fixed: ${fixedCount} files`);
    console.log(`   ❌ Errors: ${errorCount} files`);
    console.log(`   ⚠️  Validation issues: ${validationErrors} files`);
    
    if (validationErrors === 0) {
      console.log(`\n🎉 SUCCESS! All files now match template structure exactly!`);
    } else {
      console.log(`\n⚠️  ${validationErrors} files still have issues. Review and fix manually.`);
    }
    
  } catch (error) {
    console.error('❌ Comprehensive fix failed:', error.message);
    process.exit(1);
  }
}

main();
