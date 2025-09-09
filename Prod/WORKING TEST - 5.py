from datetime import datetime
import json
import os

def schema(json_obj):
    """Formats schema with line breaks for use inside Webflow CMS Rich Text via CSV."""
    return '<script type="application/ld+json">\n' + json.dumps(json_obj, indent=2, ensure_ascii=False) + '\n</script>'

def generate_schema_blocks(blog_parts, image_url):
    """Generate schema by filling the templates/schema-template.txt with blog-specific values.

    Keeps brand/logo and author image URLs exactly as defined in the template.
    Replaces example URLs, titles, descriptions, dates, category, and the hero image URL
    with the current blog's values and the provided Supabase image URL.
    """
    # Resolve template path relative to this file
    template_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "templates", "schema-template.txt"))

    try:
        with open(template_path, "r", encoding="utf-8") as f:
            template_text = f.read()
    except Exception as e:
        # Fallback to the old JSON construction if template is unavailable
        today_simple = datetime.now().strftime('%Y-%m-%d')
        base_url = "https://www.airfryerrecipe.co.uk/blog/"
        webpage_schema = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": blog_parts.get("h1", ""),
            "url": base_url + blog_parts.get("slug", ""),
            "description": blog_parts.get("meta-description", ""),
            "inLanguage": "en",
            "datePublished": today_simple,
            "dateModified": today_simple
        }
        faq_schema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": blog_parts.get("FAQ1", ""), "acceptedAnswer": {"@type": "Answer", "text": blog_parts.get("FAA1", "")}},
                {"@type": "Question", "name": blog_parts.get("FAQ2", ""), "acceptedAnswer": {"@type": "Answer", "text": blog_parts.get("FAA2", "")}},
                {"@type": "Question", "name": blog_parts.get("FAQ3", ""), "acceptedAnswer": {"@type": "Answer", "text": blog_parts.get("FAA3", "")}},
                {"@type": "Question", "name": blog_parts.get("FAQ4", ""), "acceptedAnswer": {"@type": "Answer", "text": blog_parts.get("FAA4", "")}},
            ]
        }
        blog_schema = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "mainEntityOfPage": {"@type": "WebPage", "@id": base_url + blog_parts.get("slug", "")},
            "headline": blog_parts.get("h1", ""),
            "description": blog_parts.get("meta-description", ""),
            "author": {"@type": "Person", "name": "AirFryerRecipes.co.uk"},
            "publisher": {"@type": "Organization", "name": "Air Fryer Recipe", "logo": {"@type": "ImageObject", "url": "https://cdn.prod.website-files.com/68224a465dfe9a7ab4f57570/6844191451a8b2f1e37e63cc_Untitled%20design%20-%202025-06-05T205644.948%20(1).png"}},
            "datePublished": today_simple,
            "dateModified": today_simple,
            "image": {"@type": "ImageObject", "url": image_url},
            "about": {"@type": "Thing", "name": blog_parts.get("category", "")},
            "keywords": f"{blog_parts.get('slug','')}, air fryer, air fryer recipes, {blog_parts.get('category','')}",
            "articleSection": blog_parts.get("category", ""),
            "inLanguage": "en-GB",
            "isAccessibleForFree": True,
            "articleBody": blog_parts.get("content", "")
        }
        return "\n\n".join([schema(webpage_schema), schema(faq_schema), schema(blog_schema)])

    # Prepare dynamic values
    slug = blog_parts.get("slug", "").strip()
    blog_url = f"https://www.airfryerrecipe.co.uk/blog/{slug}"
    h1 = blog_parts.get("h1", "").strip()
    meta_description = blog_parts.get("meta-description", "").strip()
    category = blog_parts.get("category", "").strip()
    today_iso = datetime.now().strftime('%Y-%m-%dT00:00:00.000Z')

    # Build FAQ items from up to four Q/A pairs
    faq_items = []
    for i in range(1, 5):
        q = blog_parts.get(f"FAQ{i}", "").strip()
        a = blog_parts.get(f"FAA{i}", "").strip()
        if q and a:
            faq_items.append({
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a}
            })

    # Parse each <script type="application/ld+json"> block and update fields
    output_blocks = []
    start_tag = '<script type="application/ld+json">'
    end_tag = '</script>'
    idx = 0
    while True:
        start = template_text.find(start_tag, idx)
        if start == -1:
            break
        start_json = template_text.find('{', start)
        end = template_text.find(end_tag, start_json)
        if start_json == -1 or end == -1:
            break
        json_text = template_text[start_json:end].strip()
        try:
            obj = json.loads(json_text)
        except Exception:
            output_blocks.append(template_text[start:end + len(end_tag)])
            idx = end + len(end_tag)
            continue

        obj_type = obj.get("@type", "")
        if obj_type == "WebPage":
            obj["name"] = h1
            obj["url"] = blog_url
            obj["description"] = meta_description
            obj["datePublished"] = today_iso
            obj["dateModified"] = today_iso
        elif obj_type == "BlogPosting":
            obj["url"] = blog_url
            if isinstance(obj.get("mainEntityOfPage"), dict):
                obj["mainEntityOfPage"]["@id"] = blog_url
            obj["headline"] = h1
            obj["description"] = meta_description
            obj["datePublished"] = today_iso
            obj["dateModified"] = today_iso
            if isinstance(obj.get("image"), dict):
                obj["image"]["url"] = image_url
            if isinstance(obj.get("about"), dict):
                obj["about"]["name"] = category
            obj["articleSection"] = category
        elif obj_type == "BreadcrumbList":
            obj["@id"] = f"{blog_url}#breadcrumbs"
            if isinstance(obj.get("itemListElement"), list) and len(obj["itemListElement"]) >= 3:
                third = obj["itemListElement"][2]
                if isinstance(third, dict):
                    third["name"] = h1
                    if isinstance(third.get("item"), dict):
                        third["item"]["@id"] = blog_url
        elif obj_type == "FAQPage":
            if faq_items:
                obj["mainEntity"] = faq_items

        output_blocks.append(schema(obj))
        idx = end + len(end_tag)

    return "\n\n".join(output_blocks)
