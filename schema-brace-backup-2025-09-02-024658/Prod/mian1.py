from importlib.machinery import SourceFileLoader
from datetime import datetime, time as dt_time
import time
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import traceback

# === Load Modules ===
find_row = SourceFileLoader("find_row", "WORKING TEST - 1.py").load_module()
generate_blog = SourceFileLoader("generate_blog", "WORKING TEST - 2.py").load_module()
parser = SourceFileLoader("parser", "WORKING TEST - 3.py").load_module()
generate_image = SourceFileLoader("generate_image", "WORKING TEST - 4.py").load_module()
schema_module = SourceFileLoader("schema", "WORKING TEST - 5.py").load_module()
webflow = SourceFileLoader("webflow", "WORKING TEST - 6.py").load_module()
mark_used = SourceFileLoader("mark_used", "WORKING TEST - 7.py").load_module()
logger = SourceFileLoader("logger", "WORKING TEST - 8.py").load_module()
md_export = SourceFileLoader("md_export", "WORKING TEST - 9.py").load_module()

# === Google Sheet Stats ===
def get_sheet_stats():
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_name("your-service-account.json", scope)
    client = gspread.authorize(creds)
    sheet = client.open("Blog Topics").worksheet("Blog Topics")
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

    total, used, unused = get_sheet_stats()
    print(f"\n📊 Sheet Stats: {total} total rows — {used} used — {unused} remaining\n")

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
        parsed["image"] = image_url.strip()
        print(f"[✓] Image generated in {round(t3b - t3a, 2)}s")

        t4 = time.time()
        schema_output = schema_module.generate_schema_blocks(parsed, image_url)
        parsed["schema"] = schema_output
        print(f"[✓] Schema generated in {round(time.time() - t4, 2)}s")

        t5 = time.time()
        webflow.upload_to_webflow(parsed)
        print(f"[✓] Uploaded to Webflow in {round(time.time() - t5, 2)}s")

        t6 = time.time()
        mark_used.mark_first_unused_row_as_used()
        print(f"[✓] Row marked as used in {round(time.time() - t6, 2)}s")

        try:
            md_export.export_blog_to_astro_md(parsed)
            print(f"[✓] Markdown exported to .md/{parsed.get('slug', 'unknown-slug')}.md")
        except Exception as e:
            print(f"⚠️ [MARKDOWN EXPORT ERROR] {e}")
            traceback.print_exc()

        end_time = time.time()
        total_time = round(end_time - t0, 2)

        print(f"\n✅ All steps complete for row {row_num}.")
        print(f"\n🕒 [DONE] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"⏱️  Total runtime: {total_time} seconds\n")

        try:
            logger.log_pipeline_stats({
                "row_num": row_num,
                "topic": row_data.get("Blog Topic", "N/A"),
                "slug": parsed.get("slug", "missing-slug"),
                "image_url": parsed.get("image", "missing-image"),
                "time_deepseek": t1 - t0,
                "time_parser": t2 - t1,
                "time_image": t3b - t3a,
                "time_schema": t4 - t3b,
                "time_webflow": t5 - t4,
                "time_mark_used": t6 - t5,
                "total_runtime": total_time,
                "status": "✅ Success"
            })
        except Exception as e:
            print(f"⚠️ [LOGGER ERROR] {e}")
            traceback.print_exc()

    except Exception as e:
        print("❌ Exception occurred in blog pipeline:")
        traceback.print_exc()
        print("\n⚠️ [WARNING] Skipping to next row...\n")

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
            # Optional: add a small pause to prevent hammering APIs too hard
            time.sleep(5)

    else:
        print("❌ Invalid input. Please restart and enter 'Y' or 'N'.")
