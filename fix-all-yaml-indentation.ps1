# Fix YAML Indentation Issues Across All Files
# Reverts 2-space indentation back to 4-space for schema blocks

Write-Host "🔄 Fixing YAML indentation issues across all files..." -ForegroundColor Yellow

# Get all markdown files recursively
$files = Get-ChildItem -Path "src/content/blog" -Recurse -Filter "*.md"

Write-Host "📊 Found $($files.Count) markdown files to process..." -ForegroundColor Cyan

$fixedCount = 0
$processedCount = 0
$errorCount = 0

foreach ($file in $files) {
    $processedCount++
    $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
    
    try {
        $content = Get-Content -Path $file.FullName -Raw
        $originalContent = $content
        
        # Check if this file has the problematic 2-space indentation pattern
        if ($content -match 'schema: \|\r?\n    <script type="application/ld\+json">\r?\n\{\r?\n  "@context"') {
            Write-Host "   🔧 Fixing: $relativePath" -ForegroundColor Yellow
            
            # Fix the schema block indentation
            # Convert 2-space indented JSON to 4-space indented JSON
            $lines = $content -split "`r?`n"
            $fixedLines = @()
            $inSchemaBlock = $false
            $schemaBlockStart = $false
            
            foreach ($line in $lines) {
                if ($line.Trim() -eq "schema: |") {
                    $inSchemaBlock = $true
                    $schemaBlockStart = $true
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
                    
                    if ($schemaBlockStart -and $line.Trim() -eq "<script type=`"application/ld+json`">") {
                        $fixedLines += "    " + $line
                        $schemaBlockStart = $false
                        continue
                    }
                    
                    if ($line.StartsWith("  ") -and -not $line.StartsWith("    ") -and $line.Trim() -ne "") {
                        # Convert 2-space indentation to 4-space for JSON content
                        $fixedLines += "    " + $line
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
                Write-Host "   ⏭️  No changes needed: $relativePath" -ForegroundColor Gray
            }
        } else {
            Write-Host "   ⏭️  No issues: $relativePath" -ForegroundColor Gray
        }
        
    } catch {
        Write-Host "   ❌ Error: $relativePath - $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`n✅ YAML indentation fix complete:" -ForegroundColor Green
Write-Host "   📊 Processed: $processedCount files" -ForegroundColor Cyan
Write-Host "   🔧 Fixed: $fixedCount files" -ForegroundColor Green
Write-Host "   ❌ Errors: $errorCount files" -ForegroundColor Red
Write-Host "   ⏭️  No issues: $($processedCount - $fixedCount - $errorCount) files" -ForegroundColor Gray

if ($fixedCount -gt 0) {
    Write-Host "`n🚀 Ready to commit and push changes!" -ForegroundColor Green
}
