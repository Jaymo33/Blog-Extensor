import json
import time
import requests

WEBFLOW_API_TOKEN = "1d30d972619d3b3456c4aafbc5a9d804e9b96db0b6267d173baa370fed70ab60"
COLLECTION_ID = "6866f05a70a7d76d018911f4"
WEBFLOW_CREATE_URL = f"https://api.webflow.com/v2/collections/{COLLECTION_ID}/items"
WEBFLOW_PUBLISH_URL = f"https://api.webflow.com/v2/collections/{COLLECTION_ID}/items/publish"

def upload_to_webflow(parsed):
    image_url = parsed.get("image", "")
    if not isinstance(image_url, str) or not image_url.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        image_url = "https://upload.wikimedia.org/wikipedia/commons/9/9a/Gull_portrait_ca_usa.jpg"

    def clean(key): return parsed.get(key, "").strip()

    payload = {
        "fieldData": {
            "name": clean("name"),
            "slug": clean("slug"),
            "h1": clean("h1"),
            "image": { "url": image_url.strip() },
            "content": clean("content"),
            "category": clean("category"),
            "meta-title": clean("meta-title"),
            "meta-description": clean("meta-description"),
            "schema": clean("schema"),
            "alt-tag": clean("alt-tag"),
            "3-liner": clean("3-liner")
        }
    }

    headers = {
        "Authorization": f"Bearer {WEBFLOW_API_TOKEN}",
        "accept-version": "2.0.0",
        "Content-Type": "application/json"
    }

    # Step 1: Create CMS item (staged)
    res = requests.post(WEBFLOW_CREATE_URL, json=payload, headers=headers)
    if res.status_code not in (200, 202):
        print(f"❌ Upload failed: {res.status_code} {res.text}")
        return

    try:
        item_id = res.json()["id"]
    except KeyError:
        print(f"❌ Could not find 'id' in response: {res.json()}")
        return

    print(f"[✓] CMS item created in staged mode. ID: {item_id}")

    # Step 2: Publish the staged item
    publish_payload = { "itemIds": [item_id] }
    publish_res = requests.post(WEBFLOW_PUBLISH_URL, json=publish_payload, headers=headers)
    if publish_res.status_code not in (200, 202):
        print(f"❌ Publish failed: {publish_res.status_code} {publish_res.text}")
        return

    print(f"[🚀] Item published successfully. ID: {item_id} (status: {publish_res.status_code})")
