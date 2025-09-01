# JSON-LD Schema Fix

## Problem
The blog files contained JSON-LD syntax errors in their schema blocks. The specific issue was extra whitespace and line breaks before closing braces in the BlogPosting schema, which caused "Syntax error: value, object or array expected" errors in schema validators.

## Example of the Problem
**Before (incorrect):**
```json
"isAccessibleForFree": true
        
    }
```

**After (fixed):**
```json
"isAccessibleForFree": true}
```

## Solution
A PowerShell script (`fix-schema-errors.ps1`) was created to:

1. **Backup all files** - Creates a timestamped backup directory before making any changes
2. **Fix the specific pattern** - Removes extra spaces and line breaks before closing braces in JSON-LD blocks
3. **Report results** - Shows which files were fixed and provides revert instructions

## Files Created

### `fix-schema-errors.ps1`
Main script that fixes the JSON-LD syntax errors across all blog files.

**Usage:**
```powershell
powershell -ExecutionPolicy Bypass -File .\fix-schema-errors.ps1
```

### `restore-schema-backup.ps1`
Utility script to restore files from backup if needed.

**Usage:**
```powershell
.\restore-schema-backup.ps1 [backup-directory-name]
```

## Results
- **Files processed:** 9,282
- **Files fixed:** 9,282
- **Backup location:** `schema-backup-2025-09-02-020628`

## What Was Fixed
The script specifically targeted the pattern where `"isAccessibleForFree": true` was followed by extra whitespace before the closing brace. This was causing JSON parsing errors in schema validators.

The fix ensures that all JSON-LD blocks in the schema are properly formatted and will pass validation.

## To Revert Changes
If you need to revert the changes, run:
```powershell
.\restore-schema-backup.ps1 schema-backup-2025-09-02-020628
```

## Verification
After running the fix, your schema validator should no longer show "Syntax error: value, object or array expected" errors for the JSON-LD blocks.