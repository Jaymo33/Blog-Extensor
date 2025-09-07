#!/usr/bin/env node
/**
 * Schema Template Generator
 *
 * This script generates a valid JSON-LD schema template for new blog posts.
 * It creates a comprehensive schema with all required fields for SEO optimization.
 *
 * Usage: node scripts/generate-schema-template.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate BlogPosting schema
 */
function generateBlogPostingSchema(postData) {
    const {
        title,
        description,
        url,
        datePublished,
        dateModified,
        authorName = 'AirFryerRecipes.co.uk',
        authorUrl = 'https://www.airfryerrecipe.co.uk/about',
        authorImage = 'https://klueoymssxwfnxsvcyhv.supabase.co/storage/v1/object/public/Shmucket/Me.jpg',
        publisherName = 'Air Fryer Recipe',
        publisherLogo = 'https://cdn.prod.website-files.com/68224a465dfe9a7ab4f57570/6844191451a8b2f1e37e63cc_Untitled%20design%20-%202025-06-05T205644.948%20(1).png',
        imageUrl,
        articleSection = 'Conversions',
        inLanguage = 'en-GB'
    } = postData;

    return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "url": url,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": url
        },
        "headline": title,
        "description": description,
        "author": {
            "@type": "Person",
            "name": authorName,
            "url": authorUrl,
            "image": {
                "@type": "ImageObject",
                "url": authorImage
            }
        },
        "publisher": {
            "@type": "Organization",
            "name": publisherName,
            "logo": {
                "@type": "ImageObject",
                "url": publisherLogo
            }
        },
        "datePublished": datePublished,
        "dateModified": dateModified || datePublished,
        "image": {
            "@type": "ImageObject",
            "url": imageUrl
        },
        "about": {
            "@type": "Thing",
            "name": articleSection
        },
        "articleSection": articleSection,
        "inLanguage": inLanguage
    };
}

/**
 * Generate FAQPage schema
 */
function generateFAQPageSchema(faqs) {
    if (!faqs || faqs.length === 0) {
        return null;
    }

    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };
}

/**
 * Generate WebPage schema
 */
function generateWebPageSchema(postData) {
    const { title, description, url, datePublished, dateModified, inLanguage = 'en' } = postData;

    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": title,
        "url": url,
        "description": description,
        "inLanguage": inLanguage,
        "datePublished": datePublished,
        "dateModified": dateModified || datePublished
    };
}

/**
 * Generate BreadcrumbList schema
 */
function generateBreadcrumbListSchema(postData) {
    const { title, url } = postData;
    const baseUrl = 'https://www.airfryerrecipe.co.uk';

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "name": "Breadcrumbs",
        "@id": `${url}#breadcrumbs`,
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": {
                    "@type": "WebPage",
                    "@id": baseUrl
                }
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "blogs",
                "item": {
                    "@type": "WebPage",
                    "@id": `${baseUrl}/blog`
                }
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": title,
                "item": {
                    "@type": "WebPage",
                    "@id": url
                }
            }
        ]
    };
}

/**
 * Generate WebSite schema
 */
function generateWebSiteSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "url": "https://www.airfryerrecipe.co.uk",
        "name": "Air Fryer Recipes",
        "description": "Explore crispy, healthy, and quick air fryer recipes from around the world. Perfect for everyday meals.",
        "inLanguage": "en"
    };
}

/**
 * Generate Organization schema
 */
function generateOrganizationSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Air Fryer Recipes",
        "url": "https://www.airfryerrecipe.co.uk",
        "logo": {
            "@type": "ImageObject",
            "url": "https://www.airfryerrecipe.co.uk/brand"
        },
        "areaServed": [
            { "@type": "Country", "name": "United Kingdom" },
            { "@type": "Country", "name": "United States" }
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "areaServed": ["GB", "US"],
            "availableLanguage": ["English"],
            "email": "support@airfryerrecipe.co.uk"
        }
    };
}

/**
 * Generate complete schema string
 */
function generateCompleteSchema(postData, faqs = []) {
    const schemas = [
        generateBlogPostingSchema(postData),
        generateFAQPageSchema(faqs),
        generateWebPageSchema(postData),
        generateBreadcrumbListSchema(postData),
        generateWebSiteSchema(),
        generateOrganizationSchema()
    ].filter(Boolean); // Remove null schemas

    return schemas.map(schema => {
        const jsonString = JSON.stringify(schema, null, 4);
        return `<script type="application/ld+json">\n${jsonString}\n</script>`;
    }).join('\n\n');
}

/**
 * Generate YAML frontmatter template
 */
function generateFrontmatterTemplate() {
    return `---
title: "Your Blog Post Title"
description: "Your blog post description for SEO"
pubDate: 2025-01-01T00:00:00.000Z
updatedDate: 2025-01-01T00:00:00.000Z
heroImage: "https://your-image-url.com/image.webp"
tags:
  - "conversions"
  - "air-fryer"
author: "AirFryerRecipes.co.uk"
canonical: "https://www.airfryerrecipe.co.uk/blog/your-post-slug"
schema: |
  <!-- Schema will be generated automatically -->
---`;
}

/**
 * Generate FAQ template
 */
function generateFAQTemplate() {
    return `## FAQ Section

### Question 1: What is the main conversion?
**Answer:** Provide a detailed answer that explains the conversion clearly and includes practical tips for air fryer cooking.

### Question 2: Why is this conversion important for air fryer cooking?
**Answer:** Explain the importance of accurate measurements in air fryer cooking, including how it affects cooking time and results.

### Question 3: How can I convert this without a calculator?
**Answer:** Provide simple methods for quick conversions, including rule-of-thumb calculations.

### Question 4: Are there any tips for using this conversion in recipes?
**Answer:** Share practical tips for applying the conversion in real cooking scenarios.`;
}

/**
 * Main function
 */
function main() {
    console.log('📋 Schema Template Generator');
    console.log('============================\n');

    // Example post data
    const examplePostData = {
        title: "Example: 1 kg to pounds conversion",
        description: "Convert 1 kg to pounds easily with our simple guide. Perfect for air fryer recipes and meal prep.",
        url: "https://www.airfryerrecipe.co.uk/blog/example-1-kg-to-pounds",
        datePublished: "2025-01-01T00:00:00.000Z",
        dateModified: "2025-01-01T00:00:00.000Z",
        imageUrl: "https://klueoymssxwfnxsvcyhv.supabase.co/storage/v1/object/public/Shmucket/example-image.webp",
        articleSection: "Conversions"
    };

    const exampleFAQs = [
        {
            question: "How many pounds is 1 kg?",
            answer: "1 kg is approximately 2.2 pounds. This conversion is essential for air fryer cooking where precise measurements ensure even cooking and perfect results."
        },
        {
            question: "Why is accurate conversion important for air fryer cooking?",
            answer: "Air fryers rely on hot air circulation, which is easily disrupted by incorrect portion sizes. Accurate measurements ensure everything cooks evenly and according to the recipe's intended time and temperature."
        }
    ];

    // Generate templates
    const schemaTemplate = generateCompleteSchema(examplePostData, exampleFAQs);
    const frontmatterTemplate = generateFrontmatterTemplate();
    const faqTemplate = generateFAQTemplate();

    // Create templates directory
    const templatesDir = path.join(process.cwd(), 'templates');
    if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Write schema template
    const schemaTemplatePath = path.join(templatesDir, 'schema-template.txt');
    fs.writeFileSync(schemaTemplatePath, schemaTemplate, 'utf8');

    // Write frontmatter template
    const frontmatterTemplatePath = path.join(templatesDir, 'frontmatter-template.md');
    fs.writeFileSync(frontmatterTemplatePath, frontmatterTemplate, 'utf8');

    // Write FAQ template
    const faqTemplatePath = path.join(templatesDir, 'faq-template.md');
    fs.writeFileSync(faqTemplatePath, faqTemplate, 'utf8');

    // Write complete example
    const completeExample = `${frontmatterTemplate}

${schemaTemplate}

# ${examplePostData.title}
${examplePostData.description}

## Introduction
Write your introduction here, explaining the conversion and its importance for air fryer cooking.

## Main Content
Write your main content here, including detailed explanations, tips, and practical examples.

${faqTemplate}

## Conclusion
Summarize the key points and provide additional resources or links to related content.`;

    const completeExamplePath = path.join(templatesDir, 'complete-blog-post-example.md');
    fs.writeFileSync(completeExamplePath, completeExample, 'utf8');

    // Write usage guide
    const usageGuide = `# Schema Template Usage Guide

## Overview
This template provides a complete, valid JSON-LD schema structure for blog posts that will pass schema.org validation.

## Files Generated
- \`schema-template.txt\` - Complete schema markup
- \`frontmatter-template.md\` - YAML frontmatter template
- \`faq-template.md\` - FAQ section template
- \`complete-blog-post-example.md\` - Complete example blog post

## How to Use
### 1. For New Blog Posts
1. Copy the frontmatter template  
2. Update the following fields:
   - \`title\`: Your blog post title
   - \`description\`: SEO description
   - \`pubDate\`: Publication date in ISO format
   - \`heroImage\`: URL to your hero image
   - \`tags\`: Relevant tags
   - \`canonical\`: Canonical URL  

3. Generate schema using the template:
   - Replace placeholder values in the schema
   - Ensure all URLs are valid
   - Update dates to match your post

### 2. Schema Validation
Before publishing, validate your schema at:
- https://validator.schema.org/
- https://search.google.com/test/rich-results

### 3. Required Fields
Make sure these fields are always present:
- \`@context\` and \`@type\`
- \`headline\` (matches your title)
- \`datePublished\`
- \`author\` with name and URL
- \`publisher\` with name and logo
- Valid \`url\` and \`mainEntityOfPage\`

### 4. Common Issues to Avoid
- No trailing commas in JSON
- No empty lines before closing braces
- Valid URLs for all links
- Proper date formatting (ISO 8601)
- Consistent language codes

## Automation
You can use the \`generate-schema-template.js\` script to programmatically generate schemas for bulk content creation.`;

    const usageGuidePath = path.join(templatesDir, 'README.md');
    fs.writeFileSync(usageGuidePath, usageGuide, 'utf8');

    console.log('✅ Templates generated successfully!');
    console.log(`📁 Templates saved to: ${templatesDir}`);
    console.log('\n📋 Generated files:');
    console.log(' - schema-template.txt');
    console.log(' - frontmatter-template.md');
    console.log(' - faq-template.md');
    console.log(' - complete-blog-post-example.md');
    console.log(' - README.md');
    console.log('\n🔍 Next steps:');
    console.log('1. Review the templates in the templates/ directory');
    console.log('2. Use the complete example as a starting point for new posts');
    console.log('3. Validate schemas at https://validator.schema.org/');
    console.log('4. Test with a few posts before bulk implementation');
}

// Run the script
main();
