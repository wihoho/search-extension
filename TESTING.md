# OmniSearch Testing Guide

This document provides comprehensive testing procedures for the OmniSearch Chrome extension.

## 🚀 Quick Start Testing

### Prerequisites
1. Google Chrome (latest version)
2. Extension loaded in developer mode
3. Icons created and placed in `/icons/` directory

### Basic Functionality Test (5 minutes)

1. **Load Extension**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked" and select project directory
   - ✅ Extension appears in list without errors

2. **Test Omnibox Trigger**
   - Click in address bar (or press Ctrl+L)
   - Type `os`
   - Press Tab or Space
   - ✅ Address bar shows "Search OmniSearch for:"

3. **Test Basic Search**
   - Type `youtube cats`
   - Press Enter
   - ✅ Redirects to YouTube search for "cats"

4. **Test Settings**
   - Click OmniSearch icon in toolbar
   - ✅ Settings popup opens
   - ✅ Can switch between "Shortcuts" and "Help" tabs

## 📋 Comprehensive Testing Checklist

### Omnibox Functionality

#### Basic Omnibox Tests
- [ ] Type `os` + Tab activates OmniSearch
- [ ] Type `os` + Space activates OmniSearch
- [ ] Typing invalid keyword shows no suggestions
- [ ] Empty search query doesn't redirect

#### Pre-configured Shortcuts
Test each default shortcut:
- [ ] `os drive test` → Google Drive search
- [ ] `os gmail test` → Gmail search
- [ ] `os youtube test` → YouTube search
- [ ] `os amazon test` → Amazon search
- [ ] `os wikipedia test` → Wikipedia search
- [ ] `os imdb test` → IMDb search
- [ ] `os spotify test` → Spotify search
- [ ] `os github test` → GitHub search
- [ ] `os twitter test` → Twitter search

#### Search Behavior
- [ ] Current tab redirect (default Enter)
- [ ] New foreground tab (Ctrl+Enter)
- [ ] New background tab (Ctrl+Shift+Enter)
- [ ] Special characters in search terms work
- [ ] Long search queries work (100+ characters)
- [ ] Unicode characters work (emojis, accents)

#### Suggestions
- [ ] Typing partial keyword shows suggestions
- [ ] Suggestions show correct website names
- [ ] Selecting suggestion works
- [ ] Suggestions update as you type

### Settings Interface

#### Popup Functionality
- [ ] Popup opens when clicking extension icon
- [ ] Tabs switch correctly (Shortcuts/Help)
- [ ] Quick start instructions are clear
- [ ] All UI elements render properly

#### Shortcut Management
- [ ] All default shortcuts are listed
- [ ] Toggle switches work for each shortcut
- [ ] Disabled shortcuts don't appear in omnibox
- [ ] Icons load correctly (or show fallback)

#### Custom Shortcuts
- [ ] "+ Add Custom" button opens modal
- [ ] Form validation works:
  - [ ] Empty fields show error
  - [ ] Invalid keyword format rejected
  - [ ] Missing %s in URL rejected
  - [ ] Duplicate keywords rejected
- [ ] Custom shortcut saves correctly
- [ ] Custom shortcut works in omnibox
- [ ] Edit custom shortcut works
- [ ] Delete custom shortcut works
- [ ] Custom shortcuts persist after browser restart

#### Help Tab
- [ ] Usage instructions are clear
- [ ] Examples are accurate
- [ ] Keywords grid shows enabled shortcuts only
- [ ] All links work

### Storage & Persistence

#### Data Persistence
- [ ] Settings persist after closing popup
- [ ] Settings persist after browser restart
- [ ] Settings persist after extension reload
- [ ] Custom shortcuts persist
- [ ] Toggle states persist

#### Storage Limits
- [ ] Can add many custom shortcuts (test 20+)
- [ ] Large search queries work
- [ ] Long website names work

### First-Time Experience

#### Welcome Page
- [ ] Welcome page opens on first install
- [ ] All sections render correctly
- [ ] Interactive elements work
- [ ] Examples are clickable
- [ ] "Try Now" button provides helpful instructions
- [ ] "Open Settings" button works
- [ ] Page is responsive on different screen sizes

#### Onboarding Hints
- [ ] First-time hint appears in popup
- [ ] Hint can be dismissed
- [ ] Hint doesn't appear after dismissal

### Error Handling

#### Network Issues
- [ ] Works when target websites are down
- [ ] Handles invalid URLs gracefully
- [ ] Favicon loading failures don't break UI

#### Edge Cases
- [ ] Very long search queries
- [ ] Special characters in custom shortcuts
- [ ] Invalid JSON in storage (manual corruption test)
- [ ] Missing permissions (test with restricted permissions)

#### Browser Compatibility
- [ ] Works in Chrome (latest)
- [ ] Works in Chrome (previous version)
- [ ] Works in Microsoft Edge
- [ ] Works in Brave Browser

### Performance Testing

#### Response Time
- [ ] Omnibox activation is instant
- [ ] Suggestions appear quickly (<100ms)
- [ ] Search redirection is immediate
- [ ] Settings popup opens quickly

#### Memory Usage
- [ ] Extension doesn't cause memory leaks
- [ ] Background script stays responsive
- [ ] Multiple searches don't slow down browser

#### Resource Usage
- [ ] Minimal CPU usage when idle
- [ ] Reasonable memory footprint
- [ ] No unnecessary network requests

## 🐛 Common Issues & Solutions

### Extension Won't Load
**Symptoms:** Extension doesn't appear in chrome://extensions/
**Solutions:**
- Check manifest.json syntax
- Verify all referenced files exist
- Check Chrome DevTools for errors
- Ensure proper file permissions

### Omnibox Not Working
**Symptoms:** Typing `os` + Tab doesn't activate
**Solutions:**
- Check background script is running
- Verify omnibox keyword in manifest
- Check for JavaScript errors in background script
- Reload extension

### Settings Not Saving
**Symptoms:** Changes don't persist
**Solutions:**
- Check storage permissions in manifest
- Verify chrome.storage API calls
- Check for quota exceeded errors
- Clear extension storage and retry

### Icons Not Showing
**Symptoms:** Default icons or broken images
**Solutions:**
- Verify icon files exist in correct paths
- Check file names match manifest exactly
- Ensure proper image formats (PNG recommended)
- Check file permissions

## 🔧 Debugging Tools

### Chrome DevTools

#### Background Script Console
```
1. Go to chrome://extensions/
2. Click "Inspect views: service worker"
3. Check console for errors
4. Set breakpoints in background.js
```

#### Popup Console
```
1. Right-click extension icon
2. Select "Inspect popup"
3. Debug like normal webpage
4. Check for JavaScript errors
```

#### Storage Inspector
```
1. Open DevTools in any tab
2. Go to Application tab
3. Expand "Storage" → "Extension Storage"
4. View/edit stored data
```

### Useful Console Commands

```javascript
// Check current shortcuts
chrome.storage.sync.get(['shortcuts'], console.log);

// Clear all data
chrome.storage.sync.clear();

// Add test shortcut
chrome.storage.sync.set({
  shortcuts: {
    test: {
      name: 'Test Site',
      url: 'https://example.com/search?q=%s',
      enabled: true
    }
  }
});

// Check first-time status
chrome.storage.sync.get(['firstTime'], console.log);
```

## 📊 Test Results Template

### Test Environment
- Chrome Version: ___________
- OS: ___________
- Extension Version: ___________
- Date: ___________

### Test Results
- [ ] Basic functionality: PASS/FAIL
- [ ] All default shortcuts: PASS/FAIL
- [ ] Custom shortcuts: PASS/FAIL
- [ ] Settings interface: PASS/FAIL
- [ ] First-time experience: PASS/FAIL
- [ ] Error handling: PASS/FAIL
- [ ] Performance: PASS/FAIL

### Issues Found
1. ________________________________
2. ________________________________
3. ________________________________

### Notes
_________________________________
_________________________________
_________________________________

## 🚀 Pre-Release Checklist

Before submitting to Chrome Web Store:

### Code Quality
- [ ] No console.log statements in production
- [ ] No TODO comments
- [ ] Code follows style guidelines
- [ ] All functions have proper error handling

### Assets
- [ ] High-quality icons (16, 32, 48, 128px)
- [ ] Promotional images for store
- [ ] Screenshots for store listing

### Documentation
- [ ] README.md is complete
- [ ] DEVELOPMENT.md is up to date
- [ ] All examples work
- [ ] License file included

### Testing
- [ ] All tests pass
- [ ] Tested on multiple browsers
- [ ] Tested on different screen sizes
- [ ] Performance is acceptable

### Store Preparation
- [ ] Version number updated
- [ ] Store description written
- [ ] Keywords selected
- [ ] Privacy policy (if needed)
- [ ] Support contact information
