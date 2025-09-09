import os
from datetime import datetime

def export_blog_to_astro_md(parsed, output_dir=r"C:\Users\junay\Documents\airfryer-automation\.md"):
    os.makedirs(output_dir, exist_ok=True)

    slug = parsed.get("slug", "").strip()
    if not slug:
        print("[✗] Missing slug. Cannot export Markdown.")
        return

    # Extract fields exactly as used in Webflow
    title = parsed.get("name", "Untitled").strip()
    h1 = parsed.get("h1", "").strip()
    image = parsed.get("image", "").strip()
    content = parsed.get("content", "").strip()
    category = parsed.get("category", "General").strip()
    meta_title = parsed.get("meta-title", "").strip()
    meta_description = parsed.get("meta-description", "").strip()
    schema = parsed.get("schema", "").strip()
    alt_tag = parsed.get("alt-tag", "").strip()
    summary = parsed.get("3-liner", "").strip()

    date = datetime.today().strftime("%Y-%m-%d")
    author = "AirFryerRecipes.co.uk"

    # YAML frontmatter block
    frontmatter = "---\n"
    frontmatter += f'title: "{title}"\n'
    frontmatter += f'slug: "{slug}"\n'
    frontmatter += f'date: {date}\n'
    frontmatter += f'author: "{author}"\n'
    frontmatter += f'category: "{category}"\n'
    frontmatter += f'metaTitle: "{meta_title}"\n'
    frontmatter += f'metaDescription: "{meta_description}"\n'
    frontmatter += f'altText: "{alt_tag}"\n'
    frontmatter += f'image: "{image}"\n'
    frontmatter += f'h1: "{h1}"\n'
    frontmatter += f'summary: "{summary}"\n'
    frontmatter += f'schema: """{schema}"""\n'
    frontmatter += "---\n\n"

    if not content:
        print("[✗] No content to write.")
        return

    filename = os.path.join(output_dir, f"{slug}.md")
    with open(filename, "w", encoding="utf-8") as f:
        f.write(frontmatter)
        f.write(content)

    print(f"[✓] Exported blog as Markdown: {filename}")
