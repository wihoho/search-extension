# OmniSearch Development Guide

This guide provides detailed information for developers working on the OmniSearch Chrome extension.

## 🏗️ Architecture Overview

### Core Components

1. **manifest.json**: Extension configuration and permissions
2. **background.js**: Service worker handling omnibox API and search logic
3. **popup.html/css/js**: Settings interface for managing shortcuts
4. **Storage**: Chrome sync storage for user preferences

### Data Flow

```
User types in omnibox → background.js processes → Chrome redirects to search URL
User manages settings → popup.js updates → Chrome storage → background.js reloads
```

## 🔧 Development Setup

### Prerequisites

- Google Chrome (latest version)
- Text editor or IDE
- Basic knowledge of JavaScript, HTML, CSS
- Understanding of Chrome Extension APIs

### Local Development

1. **Clone and Setup**:
   ```bash
   git clone <repository-url>
   cd search-extension
   ```

2. **Load Extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project directory

3. **Development Workflow**:
   - Make changes to files
   - Click the refresh button on the extension card in `chrome://extensions/`
   - Test changes immediately

### Testing the Extension

#### Manual Testing Checklist

**Omnibox Functionality**:
- [ ] Type `os` in address bar
- [ ] Press Tab - should show "Search OmniSearch for:"
- [ ] Type `youtube cats` - should show suggestion
- [ ] Press Enter - should redirect to YouTube search
- [ ] Test with multiple keywords (drive, gmail, amazon, etc.)
- [ ] Test with custom shortcuts

**Settings Interface**:
- [ ] Click extension icon to open popup
- [ ] Switch between "Shortcuts" and "Help" tabs
- [ ] Toggle shortcuts on/off
- [ ] Add custom shortcut with valid URL
- [ ] Edit existing custom shortcut
- [ ] Delete custom shortcut
- [ ] Verify changes persist after closing popup

**Edge Cases**:
- [ ] Empty search query
- [ ] Invalid URLs in custom shortcuts
- [ ] Duplicate keywords
- [ ] Special characters in search terms
- [ ] Very long search queries

#### Automated Testing

Currently, the extension uses manual testing. Future improvements could include:

- Unit tests for utility functions
- Integration tests for Chrome APIs
- End-to-end testing with tools like Puppeteer

## 📝 Code Style Guidelines

### JavaScript

- Use modern ES6+ syntax
- Prefer `const` and `let` over `var`
- Use async/await for asynchronous operations
- Add comments for complex logic
- Follow camelCase naming convention

### HTML/CSS

- Use semantic HTML elements
- Follow BEM methodology for CSS classes
- Ensure responsive design principles
- Maintain accessibility standards

### Example Code Style

```javascript
// Good
const shortcuts = await loadShortcutsFromStorage();
const enabledShortcuts = Object.entries(shortcuts)
  .filter(([_, shortcut]) => shortcut.enabled);

// Avoid
var shortcuts = loadShortcutsFromStorage();
var enabledShortcuts = [];
for (var key in shortcuts) {
  if (shortcuts[key].enabled) {
    enabledShortcuts.push([key, shortcuts[key]]);
  }
}
```

## 🔍 Debugging

### Chrome DevTools

1. **Background Script Debugging**:
   - Go to `chrome://extensions/`
   - Click "Inspect views: service worker" under your extension
   - Use console.log() and breakpoints

2. **Popup Debugging**:
   - Right-click the extension icon
   - Select "Inspect popup"
   - Debug like a normal web page

3. **Storage Inspection**:
   - In DevTools, go to Application tab
   - Check "Storage" → "Extension Storage"

### Common Issues

**Extension not loading**:
- Check manifest.json syntax
- Verify all file paths exist
- Check Chrome DevTools for errors

**Omnibox not working**:
- Ensure background script is running
- Check omnibox keyword in manifest
- Verify event listeners are properly set up

**Settings not persisting**:
- Check chrome.storage permissions
- Verify storage API calls are awaited
- Check for storage quota limits

## 🚀 Building for Production

### Pre-release Checklist

- [ ] Update version number in manifest.json
- [ ] Test all functionality thoroughly
- [ ] Optimize images and assets
- [ ] Review and update documentation
- [ ] Check for console errors/warnings
- [ ] Verify permissions are minimal and necessary

### Chrome Web Store Submission

1. **Prepare Assets**:
   - Create high-quality icons (16, 32, 48, 128px)
   - Prepare promotional images
   - Write compelling store description

2. **Package Extension**:
   - Zip the entire extension directory
   - Exclude development files (.git, node_modules, etc.)

3. **Submit to Store**:
   - Create Chrome Web Store developer account
   - Upload zip file
   - Fill out store listing details
   - Submit for review

## 🔄 API Reference

### Chrome APIs Used

#### chrome.omnibox

```javascript
// Set up omnibox keyword in manifest.json
"omnibox": { "keyword": "os" }

// Listen for input events
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  // Provide suggestions
});

chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  // Handle search execution
});
```

#### chrome.storage

```javascript
// Save data
await chrome.storage.sync.set({ key: value });

// Load data
const result = await chrome.storage.sync.get(['key']);

// Listen for changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  // Handle storage changes
});
```

#### chrome.tabs

```javascript
// Open new tab
chrome.tabs.create({ url: searchUrl });

// Update current tab
chrome.tabs.update({ url: searchUrl });
```

## 🤝 Contributing Guidelines

### Pull Request Process

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes with appropriate tests
4. Update documentation if needed
5. Submit a pull request with clear description

### Code Review Criteria

- Functionality works as expected
- Code follows style guidelines
- No security vulnerabilities
- Performance considerations addressed
- Documentation updated

### Issue Reporting

When reporting bugs, include:
- Chrome version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)

## 📚 Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/reference/)
- [Chrome Web Store Developer Policies](https://developer.chrome.com/docs/webstore/program_policies/)

## 🔮 Future Enhancements

### Planned Features

- Search suggestions from target websites
- Import/export settings
- Keyboard shortcuts for quick access
- Analytics and usage tracking
- Multi-language support

### Technical Improvements

- TypeScript migration
- Automated testing suite
- Performance optimizations
- Better error handling
- Accessibility improvements
