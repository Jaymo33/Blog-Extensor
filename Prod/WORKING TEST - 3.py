import re

REQUIRED_KEYS = [
    "name", "slug", "category", "h1", "meta-title", "meta-description",
    "3-liner", "alt-tag", "content",
    "FAQ1", "FAA1", "FAQ2", "FAA2", "FAQ3", "FAA3", "FAQ4", "FAA4"
]

def parse_deepseek_blocks(text):
    # Normalize all line endings to Unix-style
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Handle trailing whitespace after ==key== (e.g. ==name==  )
    pattern = r"==\s*(.+?)\s*==\s*\n"
    matches = list(re.finditer(pattern, text))

    result = {}
    for i, match in enumerate(matches):
        key = match.group(1).strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        value = text[start:end].strip()

        # Check if key is duplicated
        if key in result:
            print(f"[!] Duplicate key detected: {key} — skipping second instance.")
        else:
            result[key] = value


    # Check for any missing required keys
    missing = [k for k in REQUIRED_KEYS if k not in result or not result[k].strip()]
    if missing:
        print(f"[!] WARNING: The following expected fields were missing or empty:\n{missing}\n")

    return result
