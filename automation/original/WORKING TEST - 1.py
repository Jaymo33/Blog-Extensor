import gspread
from oauth2client.service_account import ServiceAccountCredentials

SERVICE_ACCOUNT_FILE = 'your-service-account.json'
SPREADSHEET_NAME = 'Blog Topics'

def find_first_unused_row():
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_name(SERVICE_ACCOUNT_FILE, scope)
    client = gspread.authorize(creds)

    sheet = client.open(SPREADSHEET_NAME).sheet1
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
