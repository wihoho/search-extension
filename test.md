# OmniSearch Testing & Debugging Guide

## 🚨 If Extension Stops Working

If the extension works initially but then stops responding:

1. **Open Debug Console**:
   - Navigate to: `chrome-extension://[extension-id]/debug.html`
   - Or create a bookmark: `chrome://extensions/` → Find OmniSearch → Copy ID → `chrome-extension://YOUR_ID_HERE/debug.html`

2. **Check Background Script**:
   - Go to `chrome://extensions/`
   - Find OmniSearch extension
   - Click "Inspect views: service worker"
   - Look for errors in the console

3. **Check Extension Status**:
   - The debug console will show if background script is active
   - Red status = problem, Green status = working

## Quick Test Instructions

### 1. Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select this directory
4. The OmniSearch extension should appear in your extensions list

### 2. Create Icons (Required)

Before testing, you need to create the icon files:

1. Open `create_icons.html` in your browser
2. Right-click each canvas and save as:
   - Save 16x16 canvas as `icons/icon16.png`
   - Save 32x32 canvas as `icons/icon32.png`
   - Save 48x48 canvas as `icons/icon48.png`
   - Save 128x128 canvas as `icons/icon128.png`
3. Refresh the extension in `chrome://extensions/`

### 3. Test Basic Functionality

#### Test Omnibox Integration:
1. Click in Chrome's address bar
2. Type `os` and press Tab or Space
3. You should see "Search OmniSearch for:" in the address bar
4. Type `youtube cats` and press Enter
5. You should be redirected to YouTube search results for "cats"

#### Test Other Keywords:
- `os drive quarterly report` → Google Drive search
- `os amazon laptop` → Amazon search
- `os github react` → GitHub search
- `os wikipedia javascript` → Wikipedia search

#### Test Settings Interface:
1. Click the OmniSearch extension icon in the toolbar
2. The settings popup should open
3. Try toggling shortcuts on/off
4. Click "Help" tab to see usage instructions
5. Try adding a custom shortcut:
   - Click "+ Add Custom"
   - Keyword: `reddit`
   - Name: `Reddit`
   - URL: `https://www.reddit.com/search/?q=%s`
   - Click Save
6. Test the new shortcut: `os reddit programming`

### 4. Troubleshooting

#### Extension not loading:
- Check that all files are present
- Look for errors in Chrome DevTools
- Ensure manifest.json is valid JSON

#### Omnibox not working:
- Make sure you pressed Tab or Space after typing `os`
- Check the background script is running (inspect service worker)
- Verify the omnibox keyword in manifest.json

#### Icons not showing:
- Make sure icon files exist in the `icons/` directory
- Check file names match exactly: icon16.png, icon32.png, etc.
- Refresh the extension after adding icons

#### Settings not saving:
- Check browser console for errors
- Verify storage permissions in manifest.json
- Try reloading the extension

### 5. Expected Behavior

✅ **Working correctly:**
- Typing `os` + Tab shows "Search OmniSearch for:"
- Search suggestions appear as you type
- Pressing Enter redirects to correct website
- Settings popup opens and functions properly
- Custom shortcuts can be added/edited/deleted
- Shortcuts can be toggled on/off

❌ **Common issues:**
- No response when typing `os` → Check extension is loaded and enabled
- Wrong search results → Check URL format in shortcuts
- Settings not saving → Check storage permissions and console errors

### 6. Performance Testing

Test with various scenarios:
- Long search queries
- Special characters in search terms
- Multiple rapid searches
- Opening searches in new tabs (Ctrl+Enter)
- Background tab searches (Ctrl+Shift+Enter)

### 7. Browser Compatibility

This extension is designed for Google Chrome and Chromium-based browsers. Test on:
- Chrome (latest version)
- Microsoft Edge (Chromium-based)
- Brave Browser
- Other Chromium browsers

### 8. Debug Console Usage

**Access Debug Console:**
1. Go to `chrome://extensions/`
2. Find OmniSearch extension and copy the ID
3. Navigate to `chrome-extension://[EXTENSION_ID]/debug.html`

**Debug Console Features:**
- Real-time extension status monitoring
- Shortcuts validation and testing
- Console log capture
- Storage management tools
- Test search functionality

### 9. Next Steps

After basic testing works:
1. Test all pre-configured shortcuts
2. Add several custom shortcuts
3. Test edge cases (empty queries, invalid URLs)
4. Check performance with many shortcuts
5. Verify data persistence across browser restarts

## Debugging Tips

### Chrome DevTools

1. **Background Script Console:**
   - Go to `chrome://extensions/`
   - Click "Inspect views: service worker"
   - Check console for errors

2. **Popup Console:**
   - Right-click extension icon → "Inspect popup"
   - Debug like a normal webpage

3. **Storage Inspection:**
   - In DevTools → Application tab → Storage → Extension Storage
   - View stored shortcuts and settings

### Common Console Commands

```javascript
// Check current shortcuts
chrome.storage.sync.get(['shortcuts'], console.log);

// Clear all data (reset extension)
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
```
