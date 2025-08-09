import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fixBlogPosts() {
  try {
    const sourceDir = path.join(__dirname, '..', '.md');
    const destDir = path.join(__dirname, '..', 'src', 'content', 'blog');
    
    // Create destination directory if it doesn't exist
    await fs.mkdir(destDir, { recursive: true });
    
    // Get all markdown files
    const files = await fs.readdir(sourceDir);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    for (const filename of mdFiles) {
      const sourcePath = path.join(sourceDir, filename);
      const destPath = path.join(destDir, filename);
      
      // Read the file content
      const content = await fs.readFile(sourcePath, 'utf-8');
      
      // Extract frontmatter and content using regex - more flexible pattern
      const match = content.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
      
      if (!match) {
        console.log(`No frontmatter found in ${filename}, skipping...`);
        continue;
      }
      
      console.log(`Found frontmatter in ${filename}`);
      console.log(match[1].substring(0, 100) + '...');
      
      const [_, frontmatterText, markdownContent] = match;
      
      // Parse frontmatter manually line by line
      const frontmatter = {};
      const lines = frontmatterText.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Extract key and value
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;
        
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith('\'') && value.endsWith('\'')))
        {
          value = value.substring(1, value.length - 1);
        }
        
        frontmatter[key] = value;
      }
      
      console.log(`Processed frontmatter for ${filename}:`, frontmatter);
      
      // Create new frontmatter
      const newFrontmatter = {
        title: frontmatter.title || frontmatter.h1 || frontmatter.metaTitle || 'Untitled',
        description: frontmatter.metaDescription || frontmatter.description || frontmatter.summary || '',
        pubDate: frontmatter.date ? new Date(frontmatter.date) : new Date(),
        heroImage: frontmatter.image || undefined,
        tags: frontmatter.category ? [frontmatter.category.toLowerCase()] : ['measurement'],
        author: frontmatter.author || 'AirFryerRecipes.co.uk',
      };
      
      console.log(`New frontmatter for ${filename}:`);
      console.log(`Title: ${newFrontmatter.title}`);
      console.log(`Description: ${newFrontmatter.description}`);
      console.log(`Image: ${newFrontmatter.heroImage}`);
      console.log('---');
      
      // Create YAML frontmatter string
      let yamlFrontmatter = '---\n';
      for (const [key, value] of Object.entries(newFrontmatter)) {
        if (value === undefined) continue;
        
        if (Array.isArray(value)) {
          yamlFrontmatter += `${key}:\n${value.map(item => `  - "${item}"`).join('\n')}\n`;
        } else if (value instanceof Date) {
          yamlFrontmatter += `${key}: ${value.toISOString()}\n`;
        } else if (typeof value === 'string') {
          yamlFrontmatter += `${key}: "${value}"\n`;
        } else {
          yamlFrontmatter += `${key}: ${value}\n`;
        }
      }
      yamlFrontmatter += '---\n\n';
      
      // Combine new frontmatter with original content
      const newContent = yamlFrontmatter + markdownContent;
      
      // Write to destination file
      await fs.writeFile(destPath, newContent, 'utf-8');
      console.log(`Processed: ${filename}`);
    }
    
    console.log('All blog posts have been fixed successfully!');
  } catch (error) {
    console.error('Error fixing blog posts:', error);
  }
}

fixBlogPosts();