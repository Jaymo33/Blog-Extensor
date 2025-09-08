// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
// Cloudflare adapter removed to restore static build

// https://astro.build/config
export default defineConfig({
  site: 'https://airfryerrecipes.co.uk',
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
