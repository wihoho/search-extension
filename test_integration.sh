#!/bin/bash

# Simple integration test for the extension
echo "🔧 Running OmniSearch Extension Tests"
echo "====================================="

# Check if all required files exist
echo "📁 Checking required files..."
files=(
    "manifest.json"
    "background.js"
    "popup.js" 
    "popup.html"
    "popup.css"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check JavaScript syntax
echo ""
echo "🔍 Checking JavaScript syntax..."
if command -v node >/dev/null 2>&1; then
    node -c background.js && echo "✅ background.js syntax OK" || echo "❌ background.js syntax error"
    node -c popup.js && echo "✅ popup.js syntax OK" || echo "❌ popup.js syntax error"
else
    echo "⚠️ Node.js not available, skipping syntax check"
fi

# Check manifest.json validity
echo ""
echo "📋 Checking manifest.json..."
if command -v python3 >/dev/null 2>&1; then
    python3 -c "import json; json.load(open('manifest.json'))" && echo "✅ manifest.json is valid JSON" || echo "❌ manifest.json invalid"
else
    echo "⚠️ Python3 not available, skipping JSON validation"
fi

# Verify key components exist
echo ""
echo "🔑 Checking key components..."
grep -q "chrome.runtime.onInstalled" background.js && echo "✅ Extension initialization found" || echo "❌ Extension initialization missing"
grep -q "loadShortcuts" background.js && echo "✅ Shortcut loading found" || echo "❌ Shortcut loading missing"
grep -q "saveShortcuts" popup.js && echo "✅ Shortcut saving found" || echo "❌ Shortcut saving missing"
grep -q "shortcutsLoaded" background.js && echo "✅ Shortcuts loaded flag found (fix applied)" || echo "❌ Shortcuts loaded flag missing"

# Check for potential issues
echo ""
echo "⚠️ Checking for potential issues..."
if grep -q "shortcuts = {}" popup.js; then
    echo "⚠️ Found 'shortcuts = {}' in popup.js - check if this is safe"
fi

if grep -q "chrome.storage.sync.set" background.js; then
    echo "✅ Storage operations found in background.js"
else
    echo "❌ No storage operations found in background.js"
fi

echo ""
echo "🎉 Test completed!"
echo ""
echo "📦 To test the extension:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable Developer mode"
echo "3. Click 'Load unpacked' and select this directory"
echo "4. Test adding multiple custom shortcuts"
echo "5. Verify all shortcuts persist after adding new ones"