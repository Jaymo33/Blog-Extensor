import re
import uuid
import base64
import requests
import os
try:
    from dotenv import load_dotenv, find_dotenv
    load_dotenv(find_dotenv(), override=False)
except Exception:
    pass

# === GETIMG + SUPABASE CONFIG ===

GETIMG_API_KEY = os.getenv("GETIMG_API_KEY", "")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "shmucket")
SUPABASE_SECRET = os.getenv("SUPABASE_SECRET", "")

FALLBACK_IMAGE_URL = None

# === HELPERS ===

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

def upload_to_supabase_from_bytes(image_bytes, supabase_filename):
    try:
        upload_url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{supabase_filename}"
        headers = {
            "Authorization": f"Bearer {SUPABASE_SECRET}",
            "Content-Type": "image/webp",
            "x-upsert": "true"
        }
        res = requests.post(upload_url, headers=headers, data=image_bytes)
        if res.status_code in [200, 201]:
            return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{supabase_filename}"
        raise RuntimeError(f"Supabase upload failed: {res.status_code} {res.text}")
    except Exception as e:
        raise

# === MAIN FUNCTION ===

def generate_image_from_row(row_data):
    try:
        topic = row_data.get("Blog Topic", "Air Fryer Blog")
        slug = slugify(topic)

        prompt_text = (
            f"A centered photo of a modern air fryer on a clean kitchen counter. "
            f"Styled like professional UK food blog photography. Natural daylight, rustic textures, soft shadows, "
            f"minimalist background, no people, no hands. Sharp focus. Clean appliance design. "
            f"**Absolutely no text, no watermarks, no labels, no brand logos, no typography anywhere.** "
            f"Theme: {topic}."
        )

        print(f"[→] Generating image for: {topic}")

        url = "https://api.getimg.ai/v1/stable-diffusion/text-to-image"
        headers = {
            "Authorization": f"Bearer {GETIMG_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "stable-diffusion-v1-5",
            "prompt": prompt_text,
            "width": 512,
            "height": 512,
            "steps": 5,
            "samples": 1
        }

        response = requests.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            raise RuntimeError(f"Getimg API failed: {response.status_code} {response.text}")

        data = response.json()
        if "image" not in data:
            raise RuntimeError("'image' key missing in Getimg response.")

        image_bytes = base64.b64decode(data["image"])
        supabase_filename = f"{slug}-{uuid.uuid4().hex[:8]}.webp"
        supabase_url = upload_to_supabase_from_bytes(image_bytes, supabase_filename)
        print(f"[✅] Supabase URL: {supabase_url}")

        return supabase_url

    except Exception as e:
        raise

