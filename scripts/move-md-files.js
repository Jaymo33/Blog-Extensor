import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'child_process';

// Install js-yaml if not already installed
try {
  require.resolve('js-yaml');
} catch (e) {
  console.log('Installing js-yaml...');
  execSync('npm install js-yaml');
}

import yaml from 'js-yaml';

// Get the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function moveMarkdownFiles() {
  try {
    const sourceDir = path.join(__dirname, '..', '.md');
    const destDir = path.join(__dirname, '..', 'src', 'content', 'blog');
    
    // Create destination directory if it doesn't exist
    await fs.mkdir(destDir, { recursive: true });
    
    // Get all markdown files
    const files = await fs.readdir(sourceDir);
    const mdFiles = files.filter(file => file.endsWith('.md')).map(file => path.join(sourceDir, file));
    
    for (const file of mdFiles) {
      const filename = path.basename(file);
      const destPath = path.join(destDir, filename);
      
      // Read the file content
      const content = await fs.readFile(file, 'utf-8');
      
      // Parse the frontmatter using js-yaml
      const frontmatterMatch = content.match(/^---\s*([\s\S]*?)\s*---/);
      if (!frontmatterMatch) continue;
      
      const frontmatterStr = frontmatterMatch[1];
      
      // Parse YAML frontmatter
      let frontmatter = {};
      try {
        frontmatter = yaml.load(frontmatterStr) || {};
        console.log('Parsed frontmatter:', JSON.stringify(frontmatter, null, 2));
      } catch (error) {
        console.error(`Error parsing frontmatter in ${filename}:`, error);
        console.error('Frontmatter string that caused the error:', frontmatterStr);
        
        // Try a more robust manual approach to extract key-value pairs
        const lines = frontmatterStr.split('\n');
        for (const line of lines) {
          // Skip empty lines
          if (!line.trim()) continue;
          
          // Try to extract key-value pairs
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.substring(1, value.length - 1);
            }
            
            frontmatter[key] = value;
          }
        }
        console.log('Manually parsed frontmatter:', frontmatter);
      }
      
      // Create new frontmatter in the required format
      const newFrontmatter = {
        title: frontmatter.title || frontmatter.h1 || frontmatter.metaTitle || 'Untitled',
        description: frontmatter.metaDescription || frontmatter.description || frontmatter.summary || '',
        pubDate: frontmatter.date ? new Date(frontmatter.date) : new Date(),
        heroImage: frontmatter.image || undefined,
        tags: frontmatter.category ? [frontmatter.category.toLowerCase()] : ['measurement'],
        author: frontmatter.author || 'AirFryerRecipes.co.uk',
        canonical: frontmatter.canonical || undefined,
      };
      
      // Only add schema if it's not empty or just quotes
      if (frontmatter.schema && 
          frontmatter.schema.trim() !== '' && 
          frontmatter.schema.trim() !== '""""""' && 
          frontmatter.schema.trim() !== '""""') {
        newFrontmatter.schema = frontmatter.schema.trim();
      }
      
      // Check if we have empty values for important fields and try to fill them from other fields
      if (newFrontmatter.title === 'Untitled' && frontmatter.h1) {
        newFrontmatter.title = frontmatter.h1;
      }
      
      if (!newFrontmatter.description && frontmatter.summary) {
        newFrontmatter.description = frontmatter.summary;
      }
      
      if (!newFrontmatter.heroImage && frontmatter.image) {
        newFrontmatter.heroImage = frontmatter.image;
      }
      
      // Ensure we're not losing any data by logging the original and new frontmatter
      console.log('Original frontmatter:', frontmatter);
      console.log('New frontmatter:', newFrontmatter);
      
      // Log the frontmatter for debugging
      console.log(`Processing ${filename}:`);
      console.log(`Title: ${newFrontmatter.title}`);
      console.log(`Description: ${newFrontmatter.description}`);
      console.log(`Image: ${newFrontmatter.heroImage}`);
      console.log('---');
      
      // Convert to YAML frontmatter
      let yamlFrontmatter = '---\n';
      Object.entries(newFrontmatter).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            yamlFrontmatter += `${key}:\n${value.map(item => `  - "${item}"`).join('\n')}\n`;
          } else if (key === 'pubDate') {
            yamlFrontmatter += `${key}: ${value.toISOString()}\n`;
          } else if (key === 'schema') {
            // Handle schema specially to preserve formatting and avoid escaping
            // Make sure schema is properly enclosed in triple quotes
            if (value && value.trim() !== '') {
              if (!value.startsWith('"""')) {
                yamlFrontmatter += `${key}: """${value}"""\n`;
              } else {
                yamlFrontmatter += `${key}: ${value}\n`;
              }
            }
            // Skip empty schema values
          } else if (typeof value === 'string') {
            // Add quotes only for string values that aren't already quoted
            yamlFrontmatter += `${key}: "${value.replace(/"/g, '\\"')}"\n`;
          } else {
            // For non-string values, don't add quotes
            yamlFrontmatter += `${key}: ${value}\n`;
          }
        }
      });
      yamlFrontmatter += '---\n\n';
      
      // Get the content after frontmatter
      const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\s*/, '');
      
      // Create the new content
      const newContent = yamlFrontmatter + contentWithoutFrontmatter;
      
      // Write the processed file
      await fs.writeFile(destPath, newContent, 'utf-8');
      console.log(`Processed: ${filename}`);
    }
    
    console.log('All markdown files have been processed and moved successfully!');
  } catch (error) {
    console.error('Error processing markdown files:', error);
  }
}

moveMarkdownFiles();
