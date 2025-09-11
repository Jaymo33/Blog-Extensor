import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),
    canonical: z.string().optional(),
    schema: z.string().optional(),
    // FAQ fields
    faqQ1: z.string().optional(),
    faqA1: z.string().optional(),
    faqQ2: z.string().optional(),
    faqA2: z.string().optional(),
    faqQ3: z.string().optional(),
    faqA3: z.string().optional(),
    faqQ4: z.string().optional(),
    faqA4: z.string().optional(),
    faqQ5: z.string().optional(),
    faqA5: z.string().optional(),
    faqQ6: z.string().optional(),
    faqA6: z.string().optional(),
    faqQ7: z.string().optional(),
    faqA7: z.string().optional(),
    faqQ8: z.string().optional(),
    faqA8: z.string().optional(),
    faqQ9: z.string().optional(),
    faqA9: z.string().optional(),
    faqQ10: z.string().optional(),
    faqA10: z.string().optional(),
  }),
});

export const collections = {
  'blog': blogCollection,
};