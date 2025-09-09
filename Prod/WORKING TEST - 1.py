import gspread
from oauth2client.service_account import ServiceAccountCredentials
import os
try:
    from dotenv import load_dotenv, find_dotenv
    load_dotenv(find_dotenv(), override=False)
except Exception:
    pass

SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE', 'your-service-account.json')
SPREADSHEET_NAME = os.getenv('GOOGLE_SPREADSHEET_NAME', 'Blog Topics')
SPREADSHEET_ID = os.getenv('GOOGLE_SPREADSHEET_ID', '')
SHEET_NAME = os.getenv('GOOGLE_SHEET_NAME', 'Blog Topics')

def find_first_unused_row():
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_name(SERVICE_ACCOUNT_FILE, scope)
    client = gspread.authorize(creds)

    if SPREADSHEET_ID:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(SHEET_NAME)
    else:
        sheet = client.open(SPREADSHEET_NAME).worksheet(SHEET_NAME)
    all_values = sheet.get_all_values()
    headers = all_values[0]
    data_rows = all_values[1:]

    # Confirm Used? column index (zero-based)
    if "Used?" not in headers:
        print("❌ 'Used?' column not found in headers.")
        return None, None

    used_index = headers.index("Used?")  # e.g. 17 if column S

    for i, row in enumerate(data_rows, start=2):  # Start from row 2 in Sheets
        value = row[used_index] if len(row) > used_index else ""
        if value.strip().lower() == "no":
            row_data = dict(zip(headers, row))
            return i, row_data

    return None, None
