from datetime import datetime
import json

def schema(json_obj):
    """Formats schema with line breaks for use inside Webflow CMS Rich Text via CSV."""
    return '<script type="application/ld+json">\n' + json.dumps(json_obj, indent=2, ensure_ascii=False) + '\n</script>'

def generate_schema_blocks(blog_parts, image_url):
    today = datetime.now().strftime('%Y-%m-%d')
    base_url = "https://www.airfryerrecipe.co.uk/blog/"

    # === WebPage Schema ===
    webpage_schema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": blog_parts["h1"],
        "url": base_url + blog_parts["slug"],
        "description": blog_parts["meta-description"],
        "inLanguage": "en",
        "datePublished": today,
        "dateModified": today
    }

    # === FAQPage Schema ===
    faq_schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": blog_parts["FAQ1"],
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": blog_parts["FAA1"]
                }
            },
            {
                "@type": "Question",
                "name": blog_parts["FAQ2"],
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": blog_parts["FAA2"]
                }
            },
            {
                "@type": "Question",
                "name": blog_parts["FAQ3"],
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": blog_parts["FAA3"]
                }
            },
            {
                "@type": "Question",
                "name": blog_parts["FAQ4"],
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": blog_parts["FAA4"]
                }
            }
        ]
    }

    # === BlogPosting Schema ===
    blog_schema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": base_url + blog_parts["slug"]
        },
        "headline": blog_parts["h1"],
        "description": blog_parts["meta-description"],
        "author": {
            "@type": "Person",
            "name": "Junayd Moughal"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Air Fryer Recipe",
            "logo": {
                "@type": "ImageObject",
                "url": "https://cdn.prod.website-files.com/68224a465dfe9a7ab4f57570/6844191451a8b2f1e37e63cc_Untitled%20design%20-%202025-06-05T205644.948%20(1).png"
            }
        },
        "datePublished": today,
        "dateModified": today,
        "image": {
            "@type": "ImageObject",
            "url": image_url
        },
        "about": {
            "@type": "Thing",
            "name": blog_parts["category"]
        },
        "keywords": f"{blog_parts['slug']}, air fryer, air fryer recipes, {blog_parts['category']}",
        "articleSection": blog_parts["category"],
        "inLanguage": "en-GB",
        "isAccessibleForFree": True,
        "articleBody": blog_parts["content"]
    }

    return "\n\n".join([
        schema(webpage_schema),
        schema(faq_schema),
        schema(blog_schema)
    ])
