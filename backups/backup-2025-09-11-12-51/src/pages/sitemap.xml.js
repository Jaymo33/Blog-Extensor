import { getCollection } from 'astro:content';

export async function GET({ site }) {
  const posts = await getCollection('blog');
  const sortedPosts = posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  // Generate sitemap XML
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site}</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${new URL('/blog', site)}</loc>
    <priority>0.9</priority>
  </url>
  ${sortedPosts
    .map(
      (post) => `
  <url>
    <loc>${new URL(`/blog/${post.slug}`, site)}</loc>
    <lastmod>${post.data.updatedDate?.toISOString() || post.data.pubDate.toISOString()}</lastmod>
    <priority>0.8</priority>
  </url>`
    )
    .join('')}
</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml',
      },
    }
  );
}