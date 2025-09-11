import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog');
  const sortedPosts = posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
  
  return rss({
    title: 'Air Fryer Recipes Blog',
    description: 'Delicious air fryer recipes and cooking tips',
    site: context.site,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
      // Optionally include content
      // content: post.body,
    })),
    customData: `<language>en-us</language>`,
  });
}