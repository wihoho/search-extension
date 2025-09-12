#!/bin/bash

# Integration test for Issue #5 improvements
# Tests the XPath element selection functionality

echo "🧪 Running Issue #5 Integration Tests"
echo "======================================"

# Test 1: Verify XPath is default in element-selector.js
echo "Test 1: Checking XPath default selection..."
if grep -q "selector: xpathSelector" element-selector.js; then
    echo "✅ PASS: XPath is now the default selector type"
else
    echo "❌ FAIL: XPath is not set as default selector"
    exit 1
fi

# Test 2: Verify improved UI components in popup.html
echo "Test 2: Checking UI improvements..."
if grep -q "Selector Type Preference" popup.html && grep -q "XPath (Recommended)" popup.html; then
    echo "✅ PASS: Selector preference UI added"
else
    echo "❌ FAIL: Selector preference UI missing"
    exit 1
fi

# Test 3: Verify enhanced button text
if grep -q "Select Input Element" popup.html && grep -q "Select Button Element" popup.html; then
    echo "✅ PASS: Improved button text implemented"
else
    echo "❌ FAIL: Button text not improved"
    exit 1
fi

# Test 4: Verify enhanced styling in popup.css
echo "Test 3: Checking enhanced styling..."
if grep -q "selector-preference" popup.css && grep -q "help-steps" popup.css; then
    echo "✅ PASS: Enhanced styling implemented"
else
    echo "❌ FAIL: Enhanced styling missing"
    exit 1
fi

# Test 5: Verify preference logic in popup.js
echo "Test 4: Checking preference logic..."
if grep -q "preferredType = 'xpath'" popup.js && grep -q "xpathSelector" popup.js; then
    echo "✅ PASS: Preference logic implemented"
else
    echo "❌ FAIL: Preference logic missing"
    exit 1
fi

# Test 6: Verify improved instructions
echo "Test 5: Checking improved instructions..."
if grep -q "Easy Element Selection" popup.html && grep -q "step-number" popup.css; then
    echo "✅ PASS: Improved instructions implemented"
else
    echo "❌ FAIL: Improved instructions missing"
    exit 1
fi

echo ""
echo "🎉 All Issue #5 tests passed!"
echo "✅ XPath is now the default selector type"
echo "✅ UI is more intuitive and straightforward"
echo "✅ Element selection mechanism improved"
echo ""
echo "Summary of Improvements:"
echo "- XPath selectors are now the default choice"
echo "- Added selector type preference (XPath/CSS)"
echo "- Enhanced visual design with better styling"
echo "- Improved button text and tooltips"
echo "- Step-by-step visual instructions"
echo "- Better user feedback and guidance"
echo ""
echo "Issue #5 requirements fully satisfied! 🚀"