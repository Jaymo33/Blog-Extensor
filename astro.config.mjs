// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import redirectsData from './src/data/redirects.json';

// Convert the JSON to Astro redirects format
const redirects = Object.fromEntries(
  Object.entries(redirectsData).map(([oldSlug, newSlug]) => [
    `/blog/${oldSlug}`,
    `/blog/${newSlug}`
  ])
);

// https://astro.build/config
export default defineConfig({
  site: 'https://airfryerrecipe.co.uk',
  output: 'server',
  adapter: cloudflare(),
  redirects,
  integrations: [
    mdx(),
    sitemap(),
  ],
  vite: {
    server: {
      watch: {
        // Exclude blog files from file watching to prevent ENOSPC errors
        ignored: ['**/src/content/blog/**/*.md']
      }
    }
  }
});
