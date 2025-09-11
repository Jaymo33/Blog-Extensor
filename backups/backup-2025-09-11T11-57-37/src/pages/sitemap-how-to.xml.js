import { getCollection } from 'astro:content';

export async function GET() {
  const allPosts = await getCollection('blog');
  const howToPosts = allPosts.filter(post => post.data.category === 'how-to');
  
  // Sort by priority - cleaning and troubleshooting are high priority
  const sortedPosts = howToPosts.sort((a, b) => {
    const aPriority = a.slug.includes('clean') || a.slug.includes('troubleshoot') ? 1 : 0;
    const bPriority = b.slug.includes('clean') || b.slug.includes('troubleshoot') ? 1 : 0;
    return bPriority - aPriority;
  });

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  sortedPosts.forEach(post => {
    const lastmod = post.data.updatedDate || post.data.pubDate;
    const priority = post.slug.includes('clean') || post.slug.includes('troubleshoot') ? '0.9' : '0.8';
    
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
