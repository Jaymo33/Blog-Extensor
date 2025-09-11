import { getCollection } from 'astro:content';

export async function GET() {
  const allPosts = await getCollection('blog');
  const conversionPosts = allPosts.filter(post => post.data.category === 'conversions');
  
  // Sort by priority - more specific conversions first
  const sortedPosts = conversionPosts.sort((a, b) => {
    const aSpecificity = a.slug.split('-').length;
    const bSpecificity = b.slug.split('-').length;
    return bSpecificity - aSpecificity; // More specific first
  });

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  sortedPosts.forEach(post => {
    const lastmod = post.data.updatedDate || post.data.pubDate;
    const priority = post.slug.includes('cups-to-') || post.slug.includes('grams-to-') ? '0.9' : '0.8';
    
    sitemap += `
  <url>
    <loc>https://airfryerrecipe.co.uk/blog/${post.slug}</loc>
    <lastmod>${lastmod.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  sitemap += `
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
