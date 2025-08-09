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
      let frontmatter;
      try {
        frontmatter = yaml.load(frontmatterStr) || {};
        console.log('Parsed frontmatter:', JSON.stringify(frontmatter, null, 2));
      } catch (error) {
        console.error(`Error parsing frontmatter in ${filename}:`, error);
        frontmatter = {};
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
        schema: frontmatter.schema ? frontmatter.schema.trim() : undefined,
      };
      
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
          } else {
            yamlFrontmatter += `${key}: "${value}"\n`;
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
