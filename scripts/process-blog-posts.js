const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const glob = promisify(require('glob'));

async function processBlogPosts() {
  try {
    // Source and destination directories
    const sourceDir = path.join(__dirname, '..', '.md');
    const destDir = path.join(__dirname, '..', 'src', 'content', 'blog');
    
    // Get all markdown files
    const files = await glob(path.join(sourceDir, '*.md'));
    
    for (const file of files) {
      // Read the file content
      const content = await fs.readFile(file, 'utf-8');
      
      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\s*([\s\S]*?)\s*---/);
      if (!frontmatterMatch) continue;
      
      const frontmatterStr = frontmatterMatch[1];
      const frontmatter = {};
      
      // Parse frontmatter
      frontmatterStr.split('\n').forEach(line => {
        const match = line.match(/^([^:]+):\s*(.*)$/);
        if (match) {
          let [_, key, value] = match;
          key = key.trim();
          value = value.trim().replace(/^['"](.*)['"]$/, '$1');
          
          // Handle date format
          if (key === 'date') {
            frontmatter.pubDate = new Date(value).toISOString();
          } else if (key === 'title') {
            frontmatter.title = value;
          } else if (key === 'description' || key === 'metaDescription') {
            frontmatter.description = value;
          } else if (key === 'category') {
            frontmatter.tags = [value];
          } else if (key === 'author') {
            frontmatter.author = value;
          } else if (key === 'image') {
            frontmatter.heroImage = value;
          } else if (key === 'canonical') {
            frontmatter.canonical = value;
          } else if (key === 'schema') {
            frontmatter.schema = value;
          }
        }
      });
      
      // Get the content after frontmatter
      const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\s*/, '');
      
      // Create new frontmatter in the required format
      const newFrontmatter = {
        title: frontmatter.title || 'Untitled',
        description: frontmatter.description || '',
        pubDate: frontmatter.pubDate || new Date().toISOString(),
        updatedDate: frontmatter.updatedDate || undefined,
        heroImage: frontmatter.heroImage || undefined,
        tags: frontmatter.tags || [],
        author: frontmatter.author || 'AirFryerRecipes.co.uk',
        canonical: frontmatter.canonical || undefined,
        schema: frontmatter.schema ? frontmatter.schema.trim() : undefined,
      };
      
      // Convert to YAML frontmatter
      let yamlFrontmatter = '---\n';
      Object.entries(newFrontmatter).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            yamlFrontmatter += `${key}:\n${value.map(item => `  - ${item}`).join('\n')}\n`;
          } else if (typeof value === 'object' && value !== null) {
            yamlFrontmatter += `${key}: ${JSON.stringify(value, null, 2)}\n`;
          } else {
            yamlFrontmatter += `${key}: ${value}\n`;
          }
        }
      });
      yamlFrontmatter += '---\n\n';
      
      // Create the new content
      const newContent = yamlFrontmatter + contentWithoutFrontmatter;
      
      // Create the destination filename
      const filename = path.basename(file);
      const destPath = path.join(destDir, filename);
      
      // Write the processed file
      await fs.writeFile(destPath, newContent, 'utf-8');
      console.log(`Processed: ${filename}`);
    }
    
    console.log('All blog posts have been processed successfully!');
  } catch (error) {
    console.error('Error processing blog posts:', error);
  }
}

processBlogPosts();
