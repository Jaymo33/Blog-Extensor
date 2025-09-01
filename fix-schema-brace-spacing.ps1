# PowerShell script to fix JSON-LD schema brace spacing errors in all blog files
# This script adds proper line breaks and spacing before closing braces

$blogDir = "src/content/blog"
$backupDir = "schema-brace-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"

# Create backup directory
New-Item -ItemType Directory -Path $backupDir -Force
Write-Host "Created backup directory: $backupDir" -ForegroundColor Green

# Get all markdown files
$mdFiles = Get-ChildItem -Path $blogDir -Filter "*.md" -File

$fixedCount = 0
$totalFiles = $mdFiles.Count

Write-Host "Processing $totalFiles files..." -ForegroundColor Yellow

foreach ($file in $mdFiles) {
    try {
        # Create backup
        Copy-Item $file.FullName -Destination "$backupDir\$($file.Name)"
        
        # Read content
        $content = Get-Content $file.FullName -Raw
        $originalContent = $content
        
        # Fix the specific pattern: "isAccessibleForFree": true} 
        # Replace with: "isAccessibleForFree": true\n    }
        $content = $content -replace '("isAccessibleForFree":\s*true)\}', "$1`n    }"
        
        # Write back if changed
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            $fixedCount++
            Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
        } else {
            Write-Host "No changes needed: $($file.Name)" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "Error processing $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nProcessing complete!" -ForegroundColor Green
Write-Host "Files processed: $totalFiles" -ForegroundColor Cyan
Write-Host "Files fixed: $fixedCount" -ForegroundColor Cyan
Write-Host "Backup location: $backupDir" -ForegroundColor Yellow
Write-Host "`nTo revert changes, run: .\restore-schema-brace-backup.ps1 $backupDir" -ForegroundColor Yellow