import gspread
from oauth2client.service_account import ServiceAccountCredentials

SERVICE_ACCOUNT_FILE = 'your-service-account.json'
SPREADSHEET_NAME = 'Blog Topics'
SHEET_NAME = 'Blog Topics'  # Adjust if needed

def mark_first_unused_row_as_used():
    scope = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/spreadsheets"
    ]
    creds = ServiceAccountCredentials.from_json_keyfile_name(SERVICE_ACCOUNT_FILE, scope)
    client = gspread.authorize(creds)

    sheet = client.open(SPREADSHEET_NAME).worksheet(SHEET_NAME)
    all_values = sheet.get_all_values()

    headers = all_values[0]
    data_rows = all_values[1:]

    if "Used?" not in headers:
        print("❌ 'Used?' column not found in sheet.")
        return

    used_col_index = headers.index("Used?") + 1  # gspread is 1-indexed

    for i, row in enumerate(data_rows, start=2):  # Row 2 is the first data row
        if len(row) >= used_col_index:
            if row[used_col_index - 1].strip().lower() == "no":
                # ✅ Mark as used
                sheet.update_cell(i, used_col_index, "Yes")

                # ✅ Format from A to last actual header column
                last_col_index = len(headers)
                end_col_label = gspread.utils.rowcol_to_a1(1, last_col_index).rstrip("1") + str(i)
                range_to_format = f"A{i}:{end_col_label}"

                # ✅ Properly structured format dictionary
                yellow_background = {
                    "backgroundColor": {
                        "red": 1.0,
                        "green": 1.0,
                        "blue": 0.6
                    }
                }

                try:
                    sheet.format(range_to_format, yellow_background)
                    print(f"[✓] Marked and highlighted row {i} in yellow.")
                except Exception as e:
                    print(f"⚠️ Could not format row {i}: {e}")

                return

    print("❌ No unused rows found to update.")
