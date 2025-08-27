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

    await fs.mkdir(destDir, { recursive: true });

    const files = await fs.readdir(sourceDir);
    const mdFiles = files.filter(file => file.endsWith('.md')).map(file => path.join(sourceDir, file));

    for (const file of mdFiles) {
      const filename = path.basename(file);
      const destPath = path.join(destDir, filename);

      const content = await fs.readFile(file, 'utf-8');

      const frontmatterMatch = content.match(/^---\s*([\s\S]*?)\s*---/);
      if (!frontmatterMatch) continue;

      let frontmatterStr = frontmatterMatch[1];
      let schemaBlock = '';

      // Extract schema manually to avoid js-yaml parsing errors
      const schemaMatch = frontmatterStr.match(/schema:\s*"""([\s\S]*?)"""/);
      if (schemaMatch) {
        schemaBlock = schemaMatch[1].trim();
        
        // Remove the problematic articleBody field that contains the entire content
        // Find the articleBody field and remove it completely
        const articleBodyRegex = /"articleBody":\s*"[\s\S]*?(?<!\\)"/g;
        schemaBlock = schemaBlock.replace(articleBodyRegex, '');
        
        // Clean up any trailing or leading commas that might be left
        schemaBlock = schemaBlock.replace(/,(\s*[}\]])/g, '$1'); // trailing commas
        schemaBlock = schemaBlock.replace(/([{\[])\s*,/g, '$1'); // leading commas
        
        frontmatterStr = frontmatterStr.replace(schemaMatch[0], '');
      }

      // Parse YAML safely
      let frontmatter = {};
      try {
        frontmatter = yaml.load(frontmatterStr) || {};
      } catch (err) {
        console.error(`YAML parse error in ${filename}:`, err);
        continue;
      }

      // Construct new frontmatter
      const newFrontmatter = {
        title: frontmatter.title || frontmatter.h1 || frontmatter.metaTitle || 'Untitled',
        description: frontmatter.metaDescription || frontmatter.description || frontmatter.summary || '',
        pubDate: frontmatter.date ? new Date(frontmatter.date) : new Date(),
        heroImage: frontmatter.image || undefined,
        tags: frontmatter.category ? [frontmatter.category.toLowerCase()] : ['measurement'],
        author: frontmatter.author || 'AirFryerRecipes.co.uk',
      };

      if (schemaBlock) newFrontmatter.schema = schemaBlock;

      // Convert to YAML frontmatter
      let yamlFrontmatter = '---\n';
      for (const [key, value] of Object.entries(newFrontmatter)) {
        if (value === undefined) continue;

        if (Array.isArray(value)) {
          yamlFrontmatter += `${key}:\n${value.map(v => `  - "${v}"`).join('\n')}\n`;
        } else if (key === 'pubDate') {
          yamlFrontmatter += `${key}: ${value.toISOString()}\n`;
        } else if (key === 'schema') {
          yamlFrontmatter += `${key}: """\n${value}\n"""\n`;
        } else {
          yamlFrontmatter += `${key}: "${String(value).replace(/"/g, '\\"')}"\n`;
        }
      }
      yamlFrontmatter += '---\n\n';

      const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\s*/, '');
      const newContent = yamlFrontmatter + contentWithoutFrontmatter;

      await fs.writeFile(destPath, newContent, 'utf-8');
      console.log(`Processed: ${filename}`);
    }

    console.log('All markdown files have been processed and moved successfully!');
  } catch (error) {
    console.error('Error processing markdown files:', error);
  }
}

moveMarkdownFiles();