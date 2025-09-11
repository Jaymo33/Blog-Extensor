import { getCollection } from 'astro:content';

export async function GET() {
  const allPosts = await getCollection('blog');
  
  // Group posts by category
  const categories = {
    conversions: allPosts.filter(post => post.data.category === 'conversions'),
    cooking: allPosts.filter(post => post.data.category === 'cooking'),
    'food-system': allPosts.filter(post => post.data.category === 'food-system'),
    general: allPosts.filter(post => post.data.category === 'general'),
    health: allPosts.filter(post => post.data.category === 'health'),
    'how-to': allPosts.filter(post => post.data.category === 'how-to'),
    products: allPosts.filter(post => post.data.category === 'products'),
    safety: allPosts.filter(post => post.data.category === 'safety')
  };

  // Create sitemap index
  let sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://airfryerrecipe.co.uk/sitemap-static.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`;

  // Add category sitemaps
  Object.entries(categories).forEach(([category, posts]) => {
    if (posts.length > 0) {
      sitemapIndex += `
  <sitemap>
    <loc>https://airfryerrecipe.co.uk/sitemap-${category}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`;
    }
  });

  sitemapIndex += `
</sitemapindex>`;

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
