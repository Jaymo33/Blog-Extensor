import os
from datetime import datetime

def export_blog_to_astro_md(parsed, output_dir=os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "src", "content", "blog"))):
    os.makedirs(output_dir, exist_ok=True)

    slug = parsed.get("slug", "").strip()
    if not slug:
        print("[✗] Missing slug. Cannot export Markdown.")
        return

    # Map to Astro schema (src/content/config.ts)
    # Prefer SEO meta title; fallback to h1, then name
    title = (parsed.get("meta-title") or parsed.get("h1") or parsed.get("name") or parsed.get("title") or "Untitled").strip()
    # Prefer SEO meta description; fallback to provided description, then 3-liner summary
    description = (parsed.get("meta-description") or parsed.get("description") or parsed.get("3-liner") or "").strip()
    pub_date_iso = datetime.utcnow().isoformat() + "Z"
    updated_date_iso = pub_date_iso
    hero_image = (parsed.get("image") or "").strip()
    # Build tags: include category and any secondary keywords if present
    tags = []
    category = (parsed.get("category") or "").strip()
    if category:
        tags.append(category)
    # Collect secondary keywords fields if parser provided them as a list or numbered keys
    secondary_keywords = []
    if isinstance(parsed.get("secondaryKeywords"), list):
        secondary_keywords = parsed.get("secondaryKeywords")
    else:
        # Look for numbered keys: Secondary Keyword1..17 like other scripts
        for i in range(1, 25):
            kw = parsed.get(f"Secondary Keyword{i}")
            if kw and isinstance(kw, str) and kw.strip():
                secondary_keywords.append(kw.strip())
    # Normalise and deduplicate
    for kw in secondary_keywords:
        norm = kw.lower().strip()
        if norm and norm not in [t.lower() for t in tags]:
            tags.append(norm)
    author = "AirFryerRecipes.co.uk"
    canonical = f"https://www.airfryerrecipe.co.uk/blog/{slug}"
    schema_block = (parsed.get("schema") or "").strip()

    content = parsed.get("content", "").strip()
    if not content:
        print("[✗] No content to write.")
        return

    # YAML frontmatter block matching Astro collection
    frontmatter = "---\n"
    frontmatter += f'title: "{title}"\n'
    frontmatter += f'description: "{description}"\n'
    frontmatter += f'pubDate: {pub_date_iso}\n'
    frontmatter += f'updatedDate: {updated_date_iso}\n'
    if hero_image:
        frontmatter += f'heroImage: "{hero_image}"\n'
    if tags:
        frontmatter += "tags:\n" + "\n".join([f"  - \"{t}\"" for t in tags]) + "\n"
    frontmatter += f'author: "{author}"\n'
    frontmatter += f'canonical: "{canonical}"\n'
    if schema_block:
        frontmatter += "schema: |\n"
        # indent schema by 4 spaces for YAML block
        for line in schema_block.splitlines():
            frontmatter += f"    {line}\n"
    frontmatter += "---\n\n"

    if not content:
        print("[✗] No content to write.")
        return

    filename = os.path.join(output_dir, f"{slug}.md")
    with open(filename, "w", encoding="utf-8") as f:
        f.write(frontmatter)
        f.write(content)

    print(f"[✓] Exported blog as Markdown: {filename}")
