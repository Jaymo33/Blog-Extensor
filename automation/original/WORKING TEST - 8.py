import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime

SERVICE_ACCOUNT_FILE = 'your-service-account.json'
SPREADSHEET_NAME = 'Blog Upload Storage'
SHEET_NAME = 'Sheet1'

def log_pipeline_stats(stats: dict):
    # === Connect to Google Sheets ===
    scope = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive"
    ]
    creds = ServiceAccountCredentials.from_json_keyfile_name(SERVICE_ACCOUNT_FILE, scope)
    client = gspread.authorize(creds)
    sheet = client.open(SPREADSHEET_NAME).worksheet(SHEET_NAME)

    # === Define expected headers ===
    expected_headers = [
        "Timestamp", "Row Number", "Blog Topic", "Slug", "Image URL",
        "Time DeepSeek (s)", "Time Parser (s)", "Time Image Gen (s)",
        "Time Schema (s)", "Time Webflow Upload (s)", "Time Mark Used (s)",
        "Total Runtime (s)", "Status"
    ]

    # === Check headers, insert if not present ===
    current_headers = sheet.row_values(1)
    if current_headers != expected_headers:
        print("[ℹ️] Headers missing or mismatched. Resetting sheet headers.")
        if len(current_headers) > 0:
            sheet.delete_rows(1)  # Clear existing headers
        sheet.insert_row(expected_headers, index=1)

    # === Prepare new row ===
    new_row = [
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        stats.get("row_num", ""),
        stats.get("topic", ""),
        stats.get("slug", ""),
        stats.get("image_url", ""),
        round(stats.get("time_deepseek", 0), 2),
        round(stats.get("time_parser", 0), 2),
        round(stats.get("time_image", 0), 2),
        round(stats.get("time_schema", 0), 2),
        round(stats.get("time_webflow", 0), 2),
        round(stats.get("time_mark_used", 0), 2),
        round(stats.get("total_runtime", 0), 2),
        stats.get("status", "")
    ]

    # === Append the row ===
    sheet.append_row(new_row, value_input_option="USER_ENTERED")
    print(f"[✓] Logged pipeline stats to '{SHEET_NAME}' in '{SPREADSHEET_NAME}'.")
