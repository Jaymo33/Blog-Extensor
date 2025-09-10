import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';

console.log('🔧 Fixing malformed JSON structure in all files...');

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

function fixMalformedJson(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if this file has malformed JSON structure
    if (content.includes('schema: |') && content.includes('<script type="application/ld+json">')) {
      const relativePath = path.relative(blogDir, filePath);
      
      // Fix common malformed JSON patterns
      let fixedContent = content;
      
      // Fix missing closing braces and incorrect indentation
      // Pattern 1: Fix "  }," to "        },"
      fixedContent = fixedContent.replace(/^  \},$/gm, '        },');
      
      // Pattern 2: Fix "  }" to "        }"
      fixedContent = fixedContent.replace(/^  \}$/gm, '        }');
      
      // Pattern 3: Fix "    }" to "        }"
      fixedContent = fixedContent.replace(/^    \}$/gm, '        }');
      
      // Pattern 4: Fix "      }" to "        }"
      fixedContent = fixedContent.replace(/^      \}$/gm, '        }');
      
      // Pattern 5: Fix "    }," to "        },"
      fixedContent = fixedContent.replace(/^    \},$/gm, '        },');
      
      // Pattern 6: Fix "      }," to "        },"
      fixedContent = fixedContent.replace(/^      \},$/gm, '        },');
      
      // Pattern 7: Fix "  }," to "        },"
      fixedContent = fixedContent.replace(/^  \},$/gm, '        },');
      
      // Fix nested object indentation
      // Pattern 8: Fix "      \"@type\":" to "            \"@type\":"
      fixedContent = fixedContent.replace(/^      "@type":/gm, '            "@type":');
      fixedContent = fixedContent.replace(/^      "@id":/gm, '            "@id":');
      fixedContent = fixedContent.replace(/^      "name":/gm, '            "name":');
      fixedContent = fixedContent.replace(/^      "url":/gm, '            "url":');
      fixedContent = fixedContent.replace(/^      "image":/gm, '            "image":');
      
      // Pattern 9: Fix "    \"@type\":" to "            \"@type\":"
      fixedContent = fixedContent.replace(/^    "@type":/gm, '            "@type":');
      fixedContent = fixedContent.replace(/^    "@id":/gm, '            "@id":');
      fixedContent = fixedContent.replace(/^    "name":/gm, '            "name":');
      fixedContent = fixedContent.replace(/^    "url":/gm, '            "url":');
      fixedContent = fixedContent.replace(/^    "image":/gm, '            "image":');
      
      // Pattern 10: Fix "  \"@type\":" to "            \"@type\":"
      fixedContent = fixedContent.replace(/^  "@type":/gm, '            "@type":');
      fixedContent = fixedContent.replace(/^  "@id":/gm, '            "@id":');
      fixedContent = fixedContent.replace(/^  "name":/gm, '            "name":');
      fixedContent = fixedContent.replace(/^  "url":/gm, '            "url":');
      fixedContent = fixedContent.replace(/^  "image":/gm, '            "image":');
      
      if (fixedContent !== originalContent) {
        fs.writeFileSync(filePath, fixedContent);
        console.log(`   🔧 Fixed malformed JSON: ${relativePath}`);
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
        const wasFixed = fixMalformedJson(filePath);
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
    
    console.log(`\n✅ Malformed JSON fix complete:`);
    console.log(`   📊 Processed: ${processedCount} files`);
    console.log(`   🔧 Fixed: ${fixedCount} files`);
    console.log(`   ❌ Errors: ${errorCount} files`);
    
    if (fixedCount > 0) {
      console.log(`\n🚀 Ready to commit and push changes!`);
    } else {
      console.log(`\n✨ No malformed JSON issues found!`);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

main();
