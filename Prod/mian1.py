from importlib.machinery import SourceFileLoader
from datetime import datetime, time as dt_time
import time
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import traceback
import os
try:
    from dotenv import load_dotenv, find_dotenv, dotenv_values
    dotenv_found = find_dotenv()
    if dotenv_found:
        load_dotenv(dotenv_found, override=False)
    if not (os.getenv('DEEPSEEK_API_KEY') or os.getenv('DEESEEK_API_KEY')):
        root_env = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '.env'))
        if os.path.exists(root_env):
            load_dotenv(root_env, override=True)
            # Force-set DEEPSEEK_API_KEY from parsed values if still missing
            env_map = dotenv_values(root_env)
            key_val = (env_map.get('DEEPSEEK_API_KEY') or env_map.get('DEESEEK_API_KEY'))
            if key_val and not (os.getenv('DEEPSEEK_API_KEY') or os.getenv('DEESEEK_API_KEY')):
                os.environ['DEEPSEEK_API_KEY'] = key_val.strip()
except Exception:
    pass

# === Load Modules ===
find_row = SourceFileLoader("find_row", "WORKING TEST - 1.py").load_module()
generate_blog = SourceFileLoader("generate_blog", "WORKING TEST - 2.py").load_module()
parser = SourceFileLoader("parser", "WORKING TEST - 3.py").load_module()
generate_image = SourceFileLoader("generate_image", "WORKING TEST - 4.py").load_module()
schema_module = SourceFileLoader("schema", "WORKING TEST - 5.py").load_module()
mark_used = SourceFileLoader("mark_used", "WORKING TEST - 7.py").load_module()
md_export = SourceFileLoader("md_export", "WORKING TEST - 9.py").load_module()

# === Google Sheet Stats ===
def get_sheet_stats():
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    service_account_file = os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE', 'your-service-account.json')
    spreadsheet_name = os.getenv('GOOGLE_SPREADSHEET_NAME', 'Blog Topics')
    sheet_name = os.getenv('GOOGLE_SHEET_NAME', 'Blog Topics')
    creds = ServiceAccountCredentials.from_json_keyfile_name(service_account_file, scope)
    client = gspread.authorize(creds)
    # Prefer opening by Spreadsheet ID if provided to avoid list API
    spreadsheet_id = os.getenv('GOOGLE_SPREADSHEET_ID')
    if spreadsheet_id:
        sheet = client.open_by_key(spreadsheet_id).worksheet(sheet_name)
    else:
        # Fallback to title-based open (may be slower)
        sheet = client.open(spreadsheet_name).worksheet(sheet_name)
    all_values = sheet.get_all_values()

    headers = all_values[0]
    used_col = headers.index("Used?") if "Used?" in headers else -1
    if used_col == -1:
        return 0, 0, 0

    total = len(all_values) - 1
    used = sum(1 for row in all_values[1:] if len(row) > used_col and row[used_col].strip().lower() == "yes")
    unused = total - used
    return total, used, unused

def run_pipeline():
    t0 = time.time()
    print(f"\n🚀 [START] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    # Minimal env debug (masked)
    debug_flags = {
        'DEESEEK_API_KEY': bool(os.getenv('DEEPSEEK_API_KEY') or os.getenv('DEESEEK_API_KEY')),
        'GOOGLE_SERVICE_ACCOUNT_FILE': bool(os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE')),
        'GOOGLE_SPREADSHEET_NAME': bool(os.getenv('GOOGLE_SPREADSHEET_NAME')),
        'GOOGLE_SHEET_NAME': bool(os.getenv('GOOGLE_SHEET_NAME')),
        'GOOGLE_SPREADSHEET_ID': bool(os.getenv('GOOGLE_SPREADSHEET_ID')),
        'GETIMG_API_KEY': bool(os.getenv('GETIMG_API_KEY')),
        'SUPABASE_URL': bool(os.getenv('SUPABASE_URL')),
        'SUPABASE_BUCKET': bool(os.getenv('SUPABASE_BUCKET')),
        'SUPABASE_SECRET': bool(os.getenv('SUPABASE_SECRET')),
    }
    print(f"[env] {debug_flags}")

    try:
        total, used, unused = get_sheet_stats()
        print(f"\n📊 Sheet Stats: {total} total rows — {used} used — {unused} remaining\n")
    except Exception as e:
        # Stats are non-critical; still continue
        print(f"[⚠] Stats check failed: {e}")

    row_num, row_data = find_row.find_first_unused_row()

    if not row_data:
        print("❌ No unused blog rows found. Exiting...\n")
        return

    print(f"[→] Row {row_num} found. Starting blog pipeline...\n")

    try:
        t1 = time.time()
        blog_output = generate_blog.generate_blog_from_row(row_data)
        print(f"[✓] Blog generated in {round(time.time() - t1, 2)}s")

        t2 = time.time()
        parsed = parser.parse_deepseek_blocks(blog_output)
        print(f"[✓] Parsed blocks in {round(time.time() - t2, 2)}s")

        t3a = time.time()
        image_url = generate_image.generate_image_from_row(row_data)
        t3b = time.time()
        if not image_url or not isinstance(image_url, str) or not image_url.strip():
            raise RuntimeError("Image generation returned empty URL")
        parsed["image"] = image_url.strip()
        print(f"[✓] Image generated in {round(t3b - t3a, 2)}s: {image_url}")

        t4 = time.time()
        schema_output = schema_module.generate_schema_blocks(parsed, image_url)
        parsed["schema"] = schema_output
        print(f"[✓] Schema generated in {round(time.time() - t4, 2)}s")

        t5 = time.time()
        # Webflow step removed per env refactor; Markdown export is now primary output
        print(f"[→] Skipping Webflow upload step.")

        t6 = time.time()
        mark_used.mark_first_unused_row_as_used()
        print(f"[✓] Row marked as used in {round(time.time() - t6, 2)}s")

        md_export.export_blog_to_astro_md(parsed)
        print(f"[✓] Markdown exported to src/content/blog/{parsed.get('slug', 'unknown-slug')}.md")

        end_time = time.time()
        total_time = round(end_time - t0, 2)

        print(f"\n✅ All steps complete for row {row_num}.")
        print(f"\n🕒 [DONE] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"⏱️  Total runtime: {total_time} seconds\n")

        # Optional: stats logging step removed (logger module deleted)

    except Exception as e:
        print("❌ Exception occurred in blog pipeline:")
        traceback.print_exc()
        # Hard exit on any pipeline error
        raise SystemExit(1)

def is_between(start, end, now=None):
    now = now or datetime.now().time()
    return start <= now or now <= end if start > end else start <= now <= end

if __name__ == "__main__":
    # Ask user for mode
    mode = input("Run in scheduled mode (Y) or continuous mode (N)? ").strip().upper()

    if mode == "Y":
        print("⏳ Waiting for 16:30...")
        while True:
            current_time = datetime.now().time()

            if is_between(dt_time(16, 30), dt_time(0, 30), current_time):
                print(f"🕓 Running pipeline at {datetime.now().strftime('%H:%M:%S')}")
                run_pipeline()
                # Immediately process next row, no sleep
            else:
                print(f"⏹️  Outside run window. Current time: {datetime.now().strftime('%H:%M:%S')}")
                time.sleep(60)  # Check again in 60 seconds

    elif mode == "N":
        print("♾ Running continuously (no schedule). Press CTRL+C to stop.")
        while True:
            run_pipeline()
            time.sleep(5)

    else:
        print("❌ Invalid input. Please restart and enter 'Y' or 'N'.")
