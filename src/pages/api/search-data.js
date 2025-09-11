import { getCollection } from 'astro:content';

export async function GET() {
  try {
    // Get all blog posts
    const posts = await getCollection('blog');
    
    // Transform posts for search (title-only search)
    const searchData = posts.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.data.title,
      pubDate: post.data.pubDate,
      category: post.slug.split('/')[0],
      url: `/blog/${post.slug}/`
    }));

    return new Response(JSON.stringify(searchData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error generating search data:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate search data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
