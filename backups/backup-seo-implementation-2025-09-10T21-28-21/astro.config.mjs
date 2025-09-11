// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import redirectsData from './src/data/redirects.json';
// Cloudflare adapter removed to restore static build

// Convert the JSON to Astro redirects format
const redirects = Object.fromEntries(
  Object.entries(redirectsData).map(([oldSlug, newSlug]) => [
    `/blog/${oldSlug}`,
    `/blog/${newSlug}`
  ])
);

// https://astro.build/config
export default defineConfig({
  site: 'https://airfryerrecipes.co.uk',
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
