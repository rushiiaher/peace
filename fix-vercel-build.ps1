# Fix Vercel Build - Add dynamic export to all API routes
# This prevents Next.js from trying to statically analyze routes at build time

$apiPath = "c:\Users\rushi\Desktop\Personal\proj4\main\app\api"
$routeFiles = Get-ChildItem -Path $apiPath -Filter "route.ts" -Recurse

$count = 0
$skipped = 0

foreach ($file in $routeFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Check if already has dynamic export
    if ($content -match "export const dynamic") {
        Write-Host "Skipped (already has dynamic): $($file.FullName)" -ForegroundColor Yellow
        $skipped++
        continue
    }
    
    # Find the position after imports
    $lines = Get-Content -Path $file.FullName
    $insertIndex = 0
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        # Find last import statement
        if ($lines[$i] -match "^import ") {
            $insertIndex = $i + 1
        }
        # If we hit an export or other code, stop searching
        if ($lines[$i] -match "^export " -or $lines[$i] -match "^const " -or $lines[$i] -match "^function ") {
            break
        }
    }
    
    # Insert the dynamic export after imports
    $newLines = @()
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $newLines += $lines[$i]
        if ($i -eq $insertIndex - 1) {
            # Add blank line and dynamic export
            $newLines += ""
            $newLines += "export const dynamic = 'force-dynamic'"
        }
    }
    
    # Write back to file
    $newLines | Set-Content -Path $file.FullName
    Write-Host "Fixed: $($file.FullName)" -ForegroundColor Green
    $count++
}

Write-Host "`nCompleted!" -ForegroundColor Cyan
Write-Host "Files modified: $count" -ForegroundColor Green
Write-Host "Files skipped: $skipped" -ForegroundColor Yellow
