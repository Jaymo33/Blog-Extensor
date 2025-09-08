"""
Simplified blog pipeline:
1) Generate blog content (placeholder: expects an already generated JSON or text)
2) Parse content into fields
3) Upload images to Supabase bucket 'shmucket'
4) Render schema using templates/schema-template.txt with mappings
5) Write Markdown file to src/content/blog/

Requires env:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

Usage:
  python automation/pipeline.py --title "My Post" --slug my-post --hero ./path/image.jpg --content ./path/content.txt
"""

import os
import re
import json
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict

from supabase import create_client, Client  # type: ignore


def get_supabase() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)


def upload_image(sb: Client, local_path: Path, bucket: str = "shmucket") -> str:
    with open(local_path, "rb") as f:
        name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{local_path.name}"
        path = f"{name}"
        # create if not exists; ignore errors
        try:
            sb.storage.create_bucket(bucket)
        except Exception:
            pass
        res = sb.storage.from_(bucket).upload(path, f)
        if getattr(res, "status_code", 200) >= 400:
            raise RuntimeError(f"Upload failed: {res}")
    public_url = f"{sb.storage.url}/object/public/{bucket}/{path}"  # type: ignore[attr-defined]
    return public_url


def read_file(p: Path) -> str:
    return p.read_text(encoding="utf-8").strip()


def render_schema(template: str, mapping: Dict[str, str]) -> str:
    out = template
    for k, v in mapping.items():
        out = out.replace(k, v)
    return out


def write_markdown(out_dir: Path, slug: str, title: str, description: str, hero_url: str, schema_html: str, body_md: str) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    dt = datetime.utcnow().strftime("%Y-%m-%d")
    frontmatter = (
        f"---\n"
        f"title: {json.dumps(title)}\n"
        f"description: {json.dumps(description)}\n"
        f"pubDate: {dt}\n"
        f"heroImage: {json.dumps(hero_url)}\n"
        f"---\n\n"
    )
    content = frontmatter + body_md + "\n\n" + schema_html + "\n"
    out_path = out_dir / f"{slug}.md"
    out_path.write_text(content, encoding="utf-8")
    return out_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--title", required=True)
    ap.add_argument("--slug", required=True)
    ap.add_argument("--hero", required=True, help="Path to hero image")
    ap.add_argument("--content", required=True, help="Path to markdown content to embed")
    ap.add_argument("--description", default="")
    args = ap.parse_args()

    project_root = Path(__file__).resolve().parents[1]
    schema_template_path = project_root / "templates" / "schema-template.txt"
    blog_dir = project_root / "src" / "content" / "blog"

    sb = get_supabase()
    hero_url = upload_image(sb, Path(args.hero), bucket="shmucket")

    body_md = read_file(Path(args.content))
    schema_template = read_file(schema_template_path)

    # Map placeholders: replace example values with actual
    # Detect supabase URLs and swap to uploaded hero when appropriate
    mapping = {
        "Example: 1 kg to pounds conversion": args.title,
        "Convert 1 kg to pounds easily with our simple guide. Perfect for air fryer recipes and meal prep.": args.description or args.title,
        "https://www.airfryerrecipe.co.uk/blog/example-1-kg-to-pounds": f"https://www.airfryerrecipe.co.uk/blog/{args.slug}",
        "https://klueoymssxwfnxsvcyhv.supabase.co/storage/v1/object/public/Shmucket/example-image.webp": hero_url,
        "https://klueoymssxwfnxsvcyhv.supabase.co/storage/v1/object/public/Shmucket/Me.jpg": hero_url,
    }
    schema_html = render_schema(schema_template, mapping)

    out_path = write_markdown(blog_dir, args.slug, args.title, args.description or args.title, hero_url, schema_html, body_md)
    print(f"Wrote: {out_path}")


if __name__ == "__main__":
    main()


