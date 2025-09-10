# Fix YAML Indentation Issues
# Reverts 2-space indentation back to 4-space for schema blocks

Write-Host "🔄 Fixing YAML indentation issues..." -ForegroundColor Yellow

# Get all markdown files recursively
$files = Get-ChildItem -Path "src/content/blog" -Recurse -Filter "*.md"

Write-Host "📊 Found $($files.Count) markdown files to process..." -ForegroundColor Cyan

$fixedCount = 0
$processedCount = 0

foreach ($file in $files) {
    $processedCount++
    $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
    
    try {
        $content = Get-Content -Path $file.FullName -Raw
        $originalContent = $content
        
        # Fix schema block indentation
        # Look for schema: | followed by 2-space indented content and convert to 4-space
        $content = $content -replace '(schema: \|\r?\n)(  <script type="application/ld\+json">\r?\n)(  \{)', '$1    <script type="application/ld+json">$2    {'
        
        # Fix other 2-space indented lines in schema blocks
        $lines = $content -split "`r?`n"
        $fixedLines = @()
        $inSchemaBlock = $false
        
        foreach ($line in $lines) {
            if ($line.Trim() -eq "schema: |") {
                $inSchemaBlock = $true
                $fixedLines += $line
                continue
            }
            
            if ($inSchemaBlock) {
                if ($line.Trim() -eq "---" -and $fixedLines.Count -gt 0) {
                    # End of frontmatter
                    $inSchemaBlock = $false
                    $fixedLines += $line
                    continue
                }
                
                if ($line.StartsWith("  ") -and -not $line.StartsWith("    ")) {
                    # Convert 2-space indentation to 4-space
                    $fixedLines += "  " + $line
                } else {
                    $fixedLines += $line
                }
            } else {
                $fixedLines += $line
            }
        }
        
        $newContent = $fixedLines -join "`r`n"
        
        if ($newContent -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
            Write-Host "   ✅ Fixed: $relativePath" -ForegroundColor Green
            $fixedCount++
        } else {
            Write-Host "   ⏭️  No issues: $relativePath" -ForegroundColor Gray
        }
        
    } catch {
        Write-Host "   ❌ Error: $relativePath - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n✅ YAML indentation fix complete:" -ForegroundColor Green
Write-Host "   📊 Processed: $processedCount files" -ForegroundColor Cyan
Write-Host "   🔧 Fixed: $fixedCount files" -ForegroundColor Green
Write-Host "   ⏭️  No issues: $($processedCount - $fixedCount) files" -ForegroundColor Gray
