import fs from 'fs';
import path from 'path';

console.log('🔍 Extracting individual FAQ fields from Webflow schemas...');
console.log('📁 Processing all markdown files to add FAQ frontmatter fields...');
console.log('');

// Load the FAQ schemas
let faqSchemas = {};
try {
  const faqData = JSON.parse(fs.readFileSync('webflow-faq-schemas.json', 'utf8'));
  faqSchemas = faqData;
  console.log(`✅ Loaded ${Object.keys(faqSchemas).length} FAQ schemas from Webflow`);
} catch (error) {
  console.error('❌ Could not load FAQ schemas:', error.message);
  process.exit(1);
}

// Get all markdown files
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

const blogDir = 'src/content/blog';
const markdownFiles = getAllMarkdownFiles(blogDir);

console.log(`📊 Found ${markdownFiles.length} markdown files to process`);
console.log('');

let processedCount = 0;
let faqAddedCount = 0;
let noFaqCount = 0;
let errorCount = 0;

console.log('🔄 Processing markdown files...');
console.log('📈 Progress will be shown every 1000 files:');
console.log('');

for (const filePath of markdownFiles) {
  processedCount++;
  
  // Show progress every 1000 files
  if (processedCount % 1000 === 0) {
    console.log(`📈 Progress: ${processedCount}/${markdownFiles.length} - Added FAQ to ${faqAddedCount} files so far`);
  }
  
  try {
    // Get the slug from the file path
    const fileName = path.basename(filePath, '.md');
    const slug = fileName;
    
    // Check if we have FAQ data for this slug
    const faqData = faqSchemas[slug];
    
    if (!faqData) {
      noFaqCount++;
      continue; // Skip files without FAQ data
    }
    
    // Read the current file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find the frontmatter section
    const frontmatterMatch = content.match(/^---\s*([\s\S]*?)^---\s*$/m);
    
    if (!frontmatterMatch) {
      console.log(`⚠️  No frontmatter found in ${filePath}`);
      continue;
    }
    
    const frontmatterContent = frontmatterMatch[1];
    const afterFrontmatter = content.substring(frontmatterMatch[0].length);
    
    // Check if FAQ fields already exist
    if (frontmatterContent.includes('faqQ1:')) {
      continue; // Skip if FAQ fields already exist
    }
    
    // Extract FAQ questions and answers
    const faqFields = [];
    if (Array.isArray(faqData)) {
      faqData.forEach((faq, index) => {
        if (faq['@type'] === 'Question' && faq.name && faq.acceptedAnswer) {
          const question = faq.name;
          const answer = faq.acceptedAnswer.text || faq.acceptedAnswer;
          faqFields.push(`faqQ${index + 1}: "${question.replace(/"/g, '\\"')}"`);
          faqFields.push(`faqA${index + 1}: "${answer.replace(/"/g, '\\"')}"`);
        }
      });
    }
    
    if (faqFields.length === 0) {
      noFaqCount++;
      continue;
    }
    
    // Add FAQ fields to frontmatter
    const newFrontmatterContent = frontmatterContent.trim() + '\n' + faqFields.join('\n') + '\n';
    
    // Reconstruct the file
    const newContent = `---\n${newFrontmatterContent}---${afterFrontmatter}`;
    
    // Write the updated file
    fs.writeFileSync(filePath, newContent, 'utf8');
    faqAddedCount++;
    
  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
    errorCount++;
  }
}

console.log('');
console.log('✅ FAQ field extraction complete!');
console.log(`📊 Final Results:`);
console.log(`   📁 Total files processed: ${processedCount}`);
console.log(`   🔍 FAQ fields added: ${faqAddedCount}`);
console.log(`   📝 Files without FAQ data: ${noFaqCount}`);
console.log(`   ❌ Errors encountered: ${errorCount}`);

if (faqAddedCount > 0) {
  console.log('');
  console.log('🎉 SUCCESS! FAQ fields added to markdown files!');
  console.log('📋 Next steps:');
  console.log('   1. Update BlogPost.astro to use FAQ frontmatter fields');
  console.log('   2. Test the updated schema generation');
  console.log('   3. Verify FAQ schemas appear in validator');
}
