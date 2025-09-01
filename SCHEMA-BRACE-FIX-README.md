# JSON-LD Schema Brace Spacing Fix

## Problem
The blog files contained JSON-LD syntax errors where closing braces were on the same line as the last property, causing "Syntax error: value, object or array expected" errors in schema validators.

## Example of the Problem
**Before (incorrect):**
```json
"inLanguage": "en-GB",
"isAccessibleForFree": true}
```

**After (fixed):**
```json
"inLanguage": "en-GB",
"isAccessibleForFree": true
    }
```

## Root Cause
The JSON parser was expecting another property after `"isAccessibleForFree": true` because of the comma before it, but instead found the closing brace immediately after `true`, which caused the "value, object or array expected" error.

## Solution
A PowerShell script (`fix-schema-brace-spacing.ps1`) was created to:

1. **Backup all files** - Creates a timestamped backup directory before making any changes
2. **Fix the specific pattern** - Adds proper line break and indentation before closing braces after `"isAccessibleForFree": true`
3. **Report results** - Shows which files were fixed and provides revert instructions

## Files Created

### `fix-schema-brace-spacing.ps1`
Main script that fixes the JSON-LD brace spacing errors across all blog files.

**Usage:**
```powershell
powershell -ExecutionPolicy Bypass -File .\fix-schema-brace-spacing.ps1
```

### `restore-schema-brace-backup.ps1`
Utility script to restore files from backup if needed.

**Usage:**
```powershell
.\restore-schema-brace-backup.ps1 [backup-directory-name]
```

## What Will Be Fixed
The script specifically targets the pattern where `"isAccessibleForFree": true}` appears and replaces it with:
```
"isAccessibleForFree": true
    }
```

This ensures proper JSON formatting and will resolve the schema validation errors.

## To Run the Fix
Execute the following command in PowerShell from the project root:
```powershell
powershell -ExecutionPolicy Bypass -File .\fix-schema-brace-spacing.ps1
```

## To Revert Changes
If you need to revert the changes, the script will provide you with the specific backup directory name. Run:
```powershell
.\restore-schema-brace-backup.ps1 [backup-directory-name]
```

## Verification
After running the fix, your schema validator should no longer show "Syntax error: value, object or array expected" errors for the JSON-LD blocks.