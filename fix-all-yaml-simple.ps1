# Fix YAML Indentation Issues - Simple Version
Write-Host "🔄 Fixing YAML indentation issues..." -ForegroundColor Yellow

$files = Get-ChildItem -Path "src/content/blog" -Recurse -Filter "*.md"
Write-Host "📊 Found $($files.Count) markdown files..." -ForegroundColor Cyan

$fixedCount = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    
    # Check if file has the problematic pattern: schema: | followed by 2-space indented JSON
    if ($content -match 'schema: \|\r?\n    <script type="application/ld\+json">\r?\n\{\r?\n  "@context"') {
        $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
        Write-Host "   🔧 Fixing: $relativePath" -ForegroundColor Yellow
        
        # Simple fix: replace the problematic pattern
        $content = $content -replace '(\{\r?\n)(  "@context")', '$1    "@context"'
        $content = $content -replace '(\{\r?\n)(  "@type")', '$1    "@type"'
        $content = $content -replace '(\{\r?\n)(  "url")', '$1    "url"'
        $content = $content -replace '(\{\r?\n)(  "mainEntityOfPage")', '$1    "mainEntityOfPage"'
        $content = $content -replace '(\{\r?\n)(  "headline")', '$1    "headline"'
        $content = $content -replace '(\{\r?\n)(  "description")', '$1    "description"'
        $content = $content -replace '(\{\r?\n)(  "author")', '$1    "author"'
        $content = $content -replace '(\{\r?\n)(  "publisher")', '$1    "publisher"'
        $content = $content -replace '(\{\r?\n)(  "datePublished")', '$1    "datePublished"'
        $content = $content -replace '(\{\r?\n)(  "dateModified")', '$1    "dateModified"'
        $content = $content -replace '(\{\r?\n)(  "image")', '$1    "image"'
        $content = $content -replace '(\{\r?\n)(  "about")', '$1    "about"'
        $content = $content -replace '(\{\r?\n)(  "articleSection")', '$1    "articleSection"'
        $content = $content -replace '(\{\r?\n)(  "inLanguage")', '$1    "inLanguage"'
        
        # Fix nested objects
        $content = $content -replace '(\{\r?\n)(    "@type")', '$1        "@type"'
        $content = $content -replace '(\{\r?\n)(    "@id")', '$1        "@id"'
        $content = $content -replace '(\{\r?\n)(    "name")', '$1        "name"'
        $content = $content = $content -replace '(\{\r?\n)(    "url")', '$1        "url"'
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "   ✅ Fixed: $relativePath" -ForegroundColor Green
            $fixedCount++
        }
    }
}

Write-Host "`n✅ Fixed $fixedCount files" -ForegroundColor Green
