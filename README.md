# Air Fryer Recipes Blog

This repository contains the code for the Air Fryer Recipes blog, built with Astro and deployed to Cloudflare Pages. The blog is designed to be served from outside of Webflow, allowing for unlimited blog posts and better scalability.

## Project Structure

```
├── .github/workflows/   # GitHub Actions workflows for CI/CD
├── public/              # Static assets
├── src/                 # Source code
│   ├── assets/          # Images and other assets
│   ├── components/      # Reusable components
│   ├── content/         # Blog content (markdown files)
│   ├── layouts/         # Page layouts
│   └── pages/           # Page components and routes
├── astro.config.mjs     # Astro configuration
├── cloudflare-worker.js # Cloudflare Worker for routing
└── package.json         # Project dependencies
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- GitHub account
- Cloudflare account

### Local Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:4321`

### Adding Blog Posts

Blog posts are written in Markdown or MDX format and stored in the `src/content/blog/` directory. Each post should include frontmatter with the following fields:

```markdown
---
title: 'Post Title'
description: 'Post description for SEO'
pubDate: 2023-07-29
tags: ['tag1', 'tag2']
author: 'Author Name'
canonical: 'https://airfryerrecipes.co.uk/blog/post-slug'
schema: {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Post Title",
  "datePublished": "2023-07-29",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  }
}
---

# Post content goes here
```

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |

## Deployment

### GitHub Setup

1. Push your code to a GitHub repository
2. Add the following secrets to your GitHub repository:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Pages permissions
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

### Cloudflare Pages Setup

1. Log in to your Cloudflare dashboard
2. Navigate to Pages and create a new project
3. Connect your GitHub repository
4. Configure the build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Deploy the site

### Cloudflare Worker Setup

1. In your Cloudflare dashboard, navigate to Workers & Pages
2. Create a new Worker
3. Copy the contents of `cloudflare-worker.js` into the Worker editor
4. Update the `BLOG_HOSTNAME` variable with your Cloudflare Pages hostname
5. Save and deploy the Worker
6. Set up a route for the Worker to handle requests to `airfryerrecipes.co.uk/blog/*`

## SEO Considerations

This setup preserves SEO by:

1. Using proper canonical URLs
2. Maintaining consistent metadata
3. Implementing schema.org markup
4. Generating a sitemap.xml
5. Providing an RSS feed
6. Using semantic HTML

## Maintenance and Extension

### Adding New Features

1. To add new components, create them in the `src/components/` directory
2. To add new layouts, create them in the `src/layouts/` directory
3. To add new pages, create them in the `src/pages/` directory

### Updating Dependencies

Regularly update dependencies to ensure security and performance:

```bash
npm update
```

### Monitoring

Use Cloudflare Analytics to monitor traffic and performance.
