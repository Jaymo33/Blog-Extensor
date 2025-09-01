# PowerShell script to restore blog files from backup
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupDir
)

$blogDir = "src/content/blog"

if (-not (Test-Path $BackupDir)) {
    Write-Host "Backup directory not found: $BackupDir" -ForegroundColor Red
    exit 1
}

# Get all backup files
$backupFiles = Get-ChildItem -Path $BackupDir -Filter "*.md" -File

if ($backupFiles.Count -eq 0) {
    Write-Host "No backup files found in: $BackupDir" -ForegroundColor Red
    exit 1
}

$restoredCount = 0
$totalFiles = $backupFiles.Count

Write-Host "Restoring $totalFiles files from backup..." -ForegroundColor Yellow

foreach ($backupFile in $backupFiles) {
    try {
        $targetPath = Join-Path $blogDir $backupFile.Name
        
        if (Test-Path $targetPath) {
            Copy-Item $backupFile.FullName -Destination $targetPath -Force
            $restoredCount++
            Write-Host "Restored: $($backupFile.Name)" -ForegroundColor Green
        } else {
            Write-Host "Target file not found, skipping: $($backupFile.Name)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Error restoring $($backupFile.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nRestore complete!" -ForegroundColor Green
Write-Host "Files restored: $restoredCount" -ForegroundColor Cyan
Write-Host "Total backup files: $totalFiles" -ForegroundColor Cyan