import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function generateSearchData() {
  try {
    console.log('Generating search data from markdown files...');
    
    const blogDir = join(process.cwd(), 'src', 'content', 'blog');
    const searchData = [];
    
    // Simple YAML frontmatter parser
    function parseFrontmatter(content) {
      const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
      const match = content.match(frontmatterRegex);
      
      if (!match) return { frontmatter: {}, content };
      
      const frontmatterText = match[1];
      const frontmatter = {};
      
      // Simple key-value parser
      frontmatterText.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          let value = line.substring(colonIndex + 1).trim();
          
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          frontmatter[key] = value;
        }
      });
      
      return { frontmatter, content: match[2] };
    }
    
    // Recursively get all markdown files
    async function scanDirectory(dir, category = '') {
      const items = await readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = join(dir, item.name);
        
        if (item.isDirectory()) {
          // Recursively scan subdirectories
          await scanDirectory(fullPath, item.name);
        } else if (item.isFile() && item.name.endsWith('.md')) {
          try {
            const content = await readFile(fullPath, 'utf-8');
            const { frontmatter } = parseFrontmatter(content);
            
            if (frontmatter.title) {
              // Extract slug from file path
              const relativePath = fullPath.replace(join(process.cwd(), 'src', 'content', 'blog'), '');
              const slug = relativePath.replace(/^[\\/]/, '').replace(/\\/g, '/').replace('.md', '');
              
              searchData.push({
                title: frontmatter.title,
                slug: slug,
                pubDate: frontmatter.pubDate || new Date().toISOString(),
                category: category || slug.split('/')[0],
                url: `/blog/${slug}`
              });
            }
          } catch (error) {
            console.warn(`Warning: Could not parse ${fullPath}:`, error.message);
          }
        }
      }
    }
    
    await scanDirectory(blogDir);
    
    // Write to public directory
    const outputPath = join(process.cwd(), 'public', 'search-data.json');
    await writeFile(outputPath, JSON.stringify(searchData, null, 2));
    
    console.log(`✅ Generated search data for ${searchData.length} posts`);
    console.log(`📁 Saved to: ${outputPath}`);
    
    // Show sample of data
    if (searchData.length > 0) {
      console.log('\n📋 Sample entries:');
      searchData.slice(0, 5).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title} (${post.category})`);
      });
      
      if (searchData.length > 5) {
        console.log(`... and ${searchData.length - 5} more posts`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error generating search data:', error);
  }
}

generateSearchData();