#!/usr/bin/env node

/**
 * This script creates a new blog post with the correct frontmatter
 * Usage: node scripts/create-post.js "My Post Title"
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get the post title from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Please provide a post title');
  console.error('Usage: node scripts/create-post.js "My Post Title"');
  process.exit(1);
}

const postTitle = args.join(' ');

// Generate slug from title
const slug = postTitle
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

// Get current date in YYYY-MM-DD format
const today = new Date();
const dateString = today.toISOString().split('T')[0];

// Ask for post description
rl.question('Enter post description: ', (description) => {
  // Ask for tags
  rl.question('Enter tags (comma separated): ', (tagsInput) => {
    // Ask for author
    rl.question('Enter author name (default: "Air Fryer Recipes"): ', (author) => {
      // Process inputs
      const tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
      const authorName = author || 'Air Fryer Recipes';
      
      // Create the frontmatter
      const frontmatter = {
        title: postTitle,
        description: description,
        pubDate: dateString,
        tags: tags,
        author: authorName,
        canonical: `https://airfryerrecipes.co.uk/blog/${slug}`,
        schema: {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": postTitle,
          "datePublished": dateString,
          "author": {
            "@type": "Person",
            "name": authorName
          }
        }
      };
      
      // Create the post content
      const postContent = `---
title: ${JSON.stringify(postTitle)}
description: ${JSON.stringify(description)}
pubDate: ${dateString}
tags: ${JSON.stringify(tags)}
author: ${JSON.stringify(authorName)}
canonical: ${JSON.stringify(`https://airfryerrecipes.co.uk/blog/${slug}`)}
schema: ${JSON.stringify(frontmatter.schema, null, 2)}
---

# ${postTitle}

${description}

## Introduction

Write your introduction here.

## Content

Write your content here.

## Conclusion

Write your conclusion here.
`;
      
      // Ensure the blog directory exists
      const blogDir = path.join(process.cwd(), 'src', 'content', 'blog');
      if (!fs.existsSync(blogDir)) {
        fs.mkdirSync(blogDir, { recursive: true });
      }
      
      // Write the post file
      const filePath = path.join(blogDir, `${slug}.md`);
      fs.writeFileSync(filePath, postContent);
      
      console.log(`\nBlog post created at: ${filePath}`);
      console.log(`Slug: ${slug}`);
      console.log(`URL: https://airfryerrecipes.co.uk/blog/${slug}`);
      
      rl.close();
    });
  });
});