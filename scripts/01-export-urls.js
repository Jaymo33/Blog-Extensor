#!/usr/bin/env node

/**
 * Export all blog URLs from src/content/blog/ folder
 * Scans all .md files and extracts slugs
 */

import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';
const outputFile = 'out/exported-urls.csv';

// Ensure output directory exists
if (!fs.existsSync('out')) {
  fs.mkdirSync('out', { recursive: true });
}

console.log('🔄 Scanning blog posts...');

const urls = [];

try {
  // Read all files in blog directory
  const files = fs.readdirSync(blogDir);
  
  for (const file of files) {
    if (file.endsWith('.md')) {
      const slug = file.replace('.md', '');
      const filePath = path.join(blogDir, file);
      
      // Read file to extract any additional metadata if needed
      const content = fs.readFileSync(filePath, 'utf8');
      
      urls.push({
        slug: slug,
        filePath: filePath,
        oldUrl: `https://www.airfryerrecipe.co.uk/blog/${slug}`,
        contentLength: content.length
      });
    }
  }
  
  // Write to CSV
  const csvContent = [
    'slug,old_url,file_path,content_length',
    ...urls.map(url => `"${url.slug}","${url.oldUrl}","${url.filePath}",${url.contentLength}`)
  ].join('\n');
  
  fs.writeFileSync(outputFile, csvContent);
  
  console.log(`✅ Exported ${urls.length} URLs to ${outputFile}`);
  console.log(`📊 Sample URLs:`);
  urls.slice(0, 5).forEach(url => {
    console.log(`   - ${url.slug}`);
  });
  
} catch (error) {
  console.error('❌ Export failed:', error.message);
  process.exit(1);
}

