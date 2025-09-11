# Schema Template Usage Guide

## Overview
This template provides a complete, valid JSON-LD schema structure for blog posts that will pass schema.org validation.

## Files Generated
- `schema-template.txt` - Complete schema markup
- `frontmatter-template.md` - YAML frontmatter template
- `faq-template.md` - FAQ section template
- `complete-blog-post-example.md` - Complete example blog post

## How to Use
### 1. For New Blog Posts
1. Copy the frontmatter template  
2. Update the following fields:
   - `title`: Your blog post title
   - `description`: SEO description
   - `pubDate`: Publication date in ISO format
   - `heroImage`: URL to your hero image
   - `tags`: Relevant tags
   - `canonical`: Canonical URL  

3. Generate schema using the template:
   - Replace placeholder values in the schema
   - Ensure all URLs are valid
   - Update dates to match your post

### 2. Schema Validation
Before publishing, validate your schema at:
- https://validator.schema.org/
- https://search.google.com/test/rich-results

### 3. Required Fields
Make sure these fields are always present:
- `@context` and `@type`
- `headline` (matches your title)
- `datePublished`
- `author` with name and URL
- `publisher` with name and logo
- Valid `url` and `mainEntityOfPage`

### 4. Common Issues to Avoid
- No trailing commas in JSON
- No empty lines before closing braces
- Valid URLs for all links
- Proper date formatting (ISO 8601)
- Consistent language codes

## Automation
You can use the `generate-schema-template.js` script to programmatically generate schemas for bulk content creation.