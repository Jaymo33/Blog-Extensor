#!/usr/bin/env node

/**
 * JSON-LD Schema Validator and Auto-Fixer
 * Detects and fixes schema issues while preserving structure
 */

import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';

console.log('🔄 Validating and fixing JSON-LD schemas...');

/**
 * Fix common JSON-LD syntax issues
 */
function fixJsonLdSyntax(content) {
  let fixed = content;
  let hasChanges = false;
  
  // Fix malformed script tags (like the Google Search Console errors)
  const malformedScriptRegex = /<script\s+type="application\/ld\+json">\s*"<script\s+type=\\"application\/ld\+json\\">/g;
  if (malformedScriptRegex.test(fixed)) {
    fixed = fixed.replace(malformedScriptRegex, '<script type="application/ld+json">');
    hasChanges = true;
    console.log('   🔧 Fixed malformed script tag');
  }
  
  // Fix escaped JSON within script tags
  const escapedJsonRegex = /<script\s+type="application\/ld\+json">\s*"([^"]*)"\s*<\/script>/gs;
  const escapedMatches = fixed.match(escapedJsonRegex);
  if (escapedMatches) {
    escapedMatches.forEach(match => {
      const unescaped = match.replace(/<script\s+type="application\/ld\+json">\s*"/, '<script type="application/ld+json">')
                            .replace(/"\s*<\/script>/, '</script>')
                            .replace(/\\"/g, '"')
                            .replace(/\\n/g, '\n')
                            .replace(/\\\\/g, '\\');
      fixed = fixed.replace(match, unescaped);
      hasChanges = true;
    });
    console.log('   🔧 Fixed escaped JSON content');
  }
  
  // Fix double-escaped quotes
  const doubleEscapedRegex = /\\"/g;
  if (doubleEscapedRegex.test(fixed)) {
    fixed = fixed.replace(doubleEscapedRegex, '"');
    hasChanges = true;
    console.log('   🔧 Fixed double-escaped quotes');
  }
  
  return { content: fixed, hasChanges };
}

/**
 * Validate and fix JSON-LD data types
 */
function fixJsonLdDataTypes(jsonLdContent) {
  let fixed = jsonLdContent;
  let hasChanges = false;
  
  try {
    // Parse the JSON-LD
    const schema = JSON.parse(jsonLdContent);
    
    // Fix common data type issues
    if (schema.datePublished && typeof schema.datePublished === 'string') {
      // Ensure proper ISO date format
      const date = new Date(schema.datePublished);
      if (!isNaN(date.getTime())) {
        const isoDate = date.toISOString();
        if (schema.datePublished !== isoDate) {
          schema.datePublished = isoDate;
          hasChanges = true;
          console.log('   🔧 Fixed datePublished format');
        }
      }
    }
    
    if (schema.dateModified && typeof schema.dateModified === 'string') {
      // Ensure proper ISO date format
      const date = new Date(schema.dateModified);
      if (!isNaN(date.getTime())) {
        const isoDate = date.toISOString();
        if (schema.dateModified !== isoDate) {
          schema.dateModified = isoDate;
          hasChanges = true;
          console.log('   🔧 Fixed dateModified format');
        }
      }
    }
    
    // Fix URL fields - ensure they're proper URLs
    const urlFields = ['url', 'image', 'logo'];
    urlFields.forEach(field => {
      if (schema[field] && typeof schema[field] === 'string') {
        // Check if it's a nested object with url property
        if (field === 'image' || field === 'logo') {
          if (schema[field].url && typeof schema[field].url === 'string') {
            if (!schema[field].url.startsWith('http')) {
              console.log(`   ⚠️  Invalid ${field} URL: ${schema[field].url}`);
            }
          }
        } else {
          if (!schema[field].startsWith('http')) {
            console.log(`   ⚠️  Invalid ${field} URL: ${schema[field]}`);
          }
        }
      }
    });
    
    // Fix author object structure
    if (schema.author && typeof schema.author === 'object') {
      if (!schema.author['@type']) {
        schema.author['@type'] = 'Person';
        hasChanges = true;
        console.log('   🔧 Added missing @type to author');
      }
    }
    
    // Fix publisher object structure
    if (schema.publisher && typeof schema.publisher === 'object') {
      if (!schema.publisher['@type']) {
        schema.publisher['@type'] = 'Organization';
        hasChanges = true;
        console.log('   🔧 Added missing @type to publisher');
      }
    }
    
    // Fix mainEntityOfPage structure
    if (schema.mainEntityOfPage && typeof schema.mainEntityOfPage === 'object') {
      if (!schema.mainEntityOfPage['@type']) {
        schema.mainEntityOfPage['@type'] = 'WebPage';
        hasChanges = true;
        console.log('   🔧 Added missing @type to mainEntityOfPage');
      }
    }
    
    if (hasChanges) {
      fixed = JSON.stringify(schema, null, 2);
    }
    
  } catch (error) {
    console.log(`   ❌ JSON parsing error: ${error.message}`);
    return { content: jsonLdContent, hasChanges: false };
  }
  
  return { content: fixed, hasChanges };
}

/**
 * Process a single markdown file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let fixedContent = content;
    let hasChanges = false;
    
    // Extract and fix JSON-LD schema
    const jsonLdRegex = /<script\s+type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g;
    const matches = [...content.matchAll(jsonLdRegex)];
    
    if (matches.length > 0) {
      matches.forEach((match, index) => {
        const fullMatch = match[0];
        const jsonLdContent = match[1];
        
        // Fix syntax issues first
        const syntaxFix = fixJsonLdSyntax(fullMatch);
        if (syntaxFix.hasChanges) {
          fixedContent = fixedContent.replace(fullMatch, syntaxFix.content);
          hasChanges = true;
        }
        
        // Extract JSON-LD content from fixed script tag
        const fixedJsonLdMatch = fixedContent.match(/<script\s+type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
        if (fixedJsonLdMatch) {
          const fixedJsonLdContent = fixedJsonLdMatch[1];
          
          // Fix data types
          const dataTypeFix = fixJsonLdDataTypes(fixedJsonLdContent);
          if (dataTypeFix.hasChanges) {
            const newScriptTag = `<script type="application/ld+json">\n${dataTypeFix.content}\n</script>`;
            fixedContent = fixedContent.replace(fixedJsonLdMatch[0], newScriptTag);
            hasChanges = true;
          }
        }
      });
    }
    
    // Write back if changes were made
    if (hasChanges) {
      fs.writeFileSync(filePath, fixedContent);
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.log(`   ❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Main processing function
 */
function main() {
  try {
    let processedCount = 0;
    let fixedCount = 0;
    let errorCount = 0;
    
    // Get all markdown files
    const files = getAllMarkdownFiles(blogDir);
    
    console.log(`📊 Found ${files.length} markdown files to process...`);
    
    files.forEach(filePath => {
      processedCount++;
      const relativePath = path.relative(blogDir, filePath);
      
      try {
        const wasFixed = processFile(filePath);
        if (wasFixed) {
          fixedCount++;
          console.log(`   ✅ Fixed: ${relativePath}`);
        } else {
          console.log(`   ⏭️  No issues: ${relativePath}`);
        }
      } catch (error) {
        errorCount++;
        console.log(`   ❌ Error: ${relativePath} - ${error.message}`);
      }
    });
    
    console.log(`\n✅ Schema validation complete:`);
    console.log(`   📊 Processed: ${processedCount} files`);
    console.log(`   🔧 Fixed: ${fixedCount} files`);
    console.log(`   ❌ Errors: ${errorCount} files`);
    console.log(`   ⏭️  No issues: ${processedCount - fixedCount - errorCount} files`);
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

/**
 * Recursively get all markdown files
 */
function getAllMarkdownFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    });
  }
  
  traverse(dir);
  return files;
}

// Run the validation
main();
