# OmniSearch Production Build Script for Windows
# Creates a clean, production-ready package for Chrome Web Store submission

Write-Host "🚀 Creating OmniSearch production build..." -ForegroundColor Cyan

# Create build directory
$buildDir = "build"
if (Test-Path $buildDir) {
    Remove-Item $buildDir -Recurse -Force
}
New-Item -ItemType Directory -Path $buildDir | Out-Null

# Files to include in production build
$productionFiles = @(
    "manifest.json",
    "background.js", 
    "popup.html",
    "popup.css",
    "popup.js",
    "welcome.html",
    "welcome.css", 
    "welcome.js",
    "LICENSE",
    "README.md"
)

# Directories to include
$productionDirs = @("icons")

Write-Host "📁 Copying production files..." -ForegroundColor Yellow

# Copy files
foreach ($file in $productionFiles) {
    if (Test-Path $file) {
        Copy-Item $file $buildDir
        Write-Host "   ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $file not found" -ForegroundColor Yellow
    }
}

# Copy directories
foreach ($dir in $productionDirs) {
    if (Test-Path $dir) {
        Copy-Item $dir $buildDir -Recurse
        Write-Host "   ✓ $dir/" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $dir/ not found" -ForegroundColor Yellow
    }
}

# Update manifest for production
Write-Host "🔧 Optimizing for production..." -ForegroundColor Yellow
$manifestPath = Join-Path $buildDir "manifest.json"
if (Test-Path $manifestPath) {
    $manifest = Get-Content $manifestPath | ConvertFrom-Json
    
    # Remove debug resources if present
    if ($manifest.web_accessible_resources) {
        foreach ($resourceGroup in $manifest.web_accessible_resources) {
            if ($resourceGroup.resources -contains "debug.html") {
                $resourceGroup.resources = $resourceGroup.resources | Where-Object { $_ -ne "debug.html" }
            }
        }
    }
    
    $manifest | ConvertTo-Json -Depth 10 | Set-Content $manifestPath
    Write-Host "   ✓ Manifest optimized" -ForegroundColor Green
}

# Update background.js for production
$bgPath = Join-Path $buildDir "background.js"
if (Test-Path $bgPath) {
    $content = Get-Content $bgPath -Raw
    # Ensure DEBUG is set to false (it should already be)
    $content = $content -replace 'const DEBUG = true;', 'const DEBUG = false;'
    Set-Content $bgPath $content
    Write-Host "   ✓ Background script optimized" -ForegroundColor Green
}

# Create ZIP package
Write-Host "📦 Creating ZIP package..." -ForegroundColor Yellow
$date = Get-Date -Format "yyyyMMdd"
$zipFilename = "omnisearch-v1.0.0-$date.zip"

# Remove existing zip if it exists
if (Test-Path $zipFilename) {
    Remove-Item $zipFilename
}

# Create ZIP using .NET compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($buildDir, $zipFilename)

Write-Host "✅ Production build complete!" -ForegroundColor Green
Write-Host "📦 Package: $zipFilename" -ForegroundColor Cyan
Write-Host "📁 Build directory: $buildDir/" -ForegroundColor Cyan

# Validation
Write-Host "`n🔍 Validating package..." -ForegroundColor Yellow

$requiredFiles = @(
    "manifest.json",
    "background.js",
    "popup.html", 
    "popup.css",
    "popup.js"
)

$requiredIcons = @(
    "icons/icon16.png",
    "icons/icon48.png", 
    "icons/icon128.png"
)

$missingFiles = @()

# Check required files
foreach ($file in $requiredFiles) {
    if (-not (Test-Path (Join-Path $buildDir $file))) {
        $missingFiles += $file
    }
}

# Check required icons
foreach ($icon in $requiredIcons) {
    if (-not (Test-Path (Join-Path $buildDir $icon))) {
        $missingFiles += $icon
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ Missing required files:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
} else {
    Write-Host "✅ Package validation passed" -ForegroundColor Green
}

# Print submission checklist
Write-Host "`n$('='*60)" -ForegroundColor Cyan
Write-Host "📋 CHROME WEB STORE SUBMISSION CHECKLIST" -ForegroundColor Cyan
Write-Host "$('='*60)" -ForegroundColor Cyan

$checklist = @(
    "Create developer account (`$5 fee)",
    "Generate store assets (promotional images)",
    "Take actual screenshots of extension",
    "Write compelling store description", 
    "Set up privacy policy hosting",
    "Test extension thoroughly",
    "Upload ZIP package",
    "Fill out store listing details",
    "Submit for review"
)

for ($i = 0; $i -lt $checklist.Count; $i++) {
    Write-Host ("{0,2}. [ ] {1}" -f ($i + 1), $checklist[$i])
}

Write-Host "`n📚 Resources:" -ForegroundColor Yellow
Write-Host "   - Store assets: create_store_assets.html"
Write-Host "   - Listing content: STORE_LISTING.md" 
Write-Host "   - Privacy policy: PRIVACY_POLICY.md"
Write-Host "   - Testing guide: TESTING.md"

Write-Host "`n🎉 Ready for Chrome Web Store submission!" -ForegroundColor Green
Write-Host "📦 Upload this file: $zipFilename" -ForegroundColor Cyan

# Check if icons exist
Write-Host "`n🖼️  Icon Status:" -ForegroundColor Yellow
foreach ($icon in $requiredIcons) {
    if (Test-Path (Join-Path $buildDir $icon)) {
        Write-Host "   ✓ $icon exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $icon missing - create using create_icons.html" -ForegroundColor Red
    }
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Create icons if missing (use create_icons.html)"
Write-Host "2. Generate store assets (use create_store_assets.html)"
Write-Host "3. Take actual screenshots of the extension"
Write-Host "4. Go to Chrome Web Store Developer Dashboard"
Write-Host "5. Upload $zipFilename"
