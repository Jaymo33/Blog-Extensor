#!/usr/bin/env node

/**
 * Classify all exported URLs using the rules engine
 * Generates classification results and unmatched posts
 */

import fs from 'fs';
import { classifyPost } from './lib/rules-engine.js';

const inputFile = 'out/exported-urls.csv';
const outputFile = 'out/classified-posts.csv';
const unmatchedFile = 'out/unmatched-posts.csv';

console.log('🔄 Classifying posts...');

try {
  // Read exported URLs
  const csvContent = fs.readFileSync(inputFile, 'utf8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  const classified = [];
  const unmatched = [];
  
  // Process each URL
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(v => v.replace(/"/g, ''));
    const slug = values[0];
    const oldUrl = values[1];
    const filePath = values[2];
    const contentLength = values[3];
    
    // Classify the post
    const classification = classifyPost(slug);
    
    if (classification) {
      const newSlug = `${classification.category}/${classification.hub}/${slug}`;
      const newUrl = `https://www.airfryerrecipe.co.uk/blog/${newSlug}`;
      
      classified.push({
        slug,
        oldUrl,
        newSlug,
        newUrl,
        category: classification.category,
        hub: classification.hub,
        filePath,
        contentLength
      });
    } else {
      unmatched.push({
        slug,
        oldUrl,
        filePath,
        contentLength,
        reason: 'No matching rule found'
      });
    }
  }
  
  // Write classified posts
  const classifiedCsv = [
    'slug,old_url,new_slug,new_url,category,hub,file_path,content_length',
    ...classified.map(post => `"${post.slug}","${post.oldUrl}","${post.newSlug}","${post.newUrl}","${post.category}","${post.hub}","${post.filePath}",${post.contentLength}`)
  ].join('\n');
  
  fs.writeFileSync(outputFile, classifiedCsv);
  
  // Write unmatched posts
  const unmatchedCsv = [
    'slug,old_url,file_path,content_length,reason',
    ...unmatched.map(post => `"${post.slug}","${post.oldUrl}","${post.filePath}",${post.contentLength},"${post.reason}"`)
  ].join('\n');
  
  fs.writeFileSync(unmatchedFile, unmatchedCsv);
  
  console.log(`✅ Classification complete:`);
  console.log(`   📊 Classified: ${classified.length} posts`);
  console.log(`   ❌ Unmatched: ${unmatched.length} posts`);
  console.log(`   📁 Output: ${outputFile}`);
  console.log(`   📁 Unmatched: ${unmatchedFile}`);
  
  // Show category breakdown
  const categoryCount = {};
  classified.forEach(post => {
    categoryCount[post.category] = (categoryCount[post.category] || 0) + 1;
  });
  
  console.log(`\n📊 Category breakdown:`);
  Object.entries(categoryCount).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} posts`);
  });
  
} catch (error) {
  console.error('❌ Classification failed:', error.message);
  process.exit(1);
}

