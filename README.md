# OmniSearch Chrome Extension

A powerful Chrome extension that provides quick search shortcuts for popular websites directly from the address bar (omnibox). Transform your browsing experience with instant access to search functionality across your favorite platforms.

## 🚀 Features

- **Quick Search Shortcuts**: Type keywords in the address bar to search specific websites instantly
- **Pre-configured Popular Sites**: Built-in support for Google Drive, Gmail, YouTube, Amazon, Wikipedia, IMDb, Spotify, GitHub, and Twitter
- **Custom Shortcuts**: Add your own search shortcuts for any website
- **Non-Intrusive Sidebar**: Clean sidebar interface that slides in from the right without blocking webpage content
- **Keyboard Shortcut**: Quick access with `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)
- **Tab-to-Search**: Familiar Chrome omnibox behavior with tab activation
- **Real-time Suggestions**: Get search suggestions as you type

## 📖 How to Use

1. **Activate OmniSearch**: Type `os` in Chrome's address bar
2. **Press Tab or Space**: This activates OmniSearch mode
3. **Enter your search**: Type `keyword searchterm` (e.g., `youtube cats`)
4. **Press Enter**: You'll be taken directly to the search results

### Example Searches

- `os youtube cats` → Search YouTube for "cats"
- `os drive quarterly report` → Search Google Drive for "quarterly report"
- `os amazon laptop` → Search Amazon for "laptop"
- `os github react` → Search GitHub for "react"
- `os ai-studio my prompt` → Search AI Studio for "my prompt"

## 🛠️ Installation

### For Development

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/search-extension.git
   cd search-extension
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked" and select the extension directory

5. The OmniSearch extension should now appear in your extensions list

### For Users

[*Chrome Web Store*](https://chromewebstore.google.com/detail/omnisearch/eihpnhdoneijgoppfeldaclpkllomacc?authuser=0&hl=en)

## ⚙️ Configuration

Access OmniSearch settings through the sidebar interface:

### Opening the Sidebar

- **Extension Icon**: Click the OmniSearch icon in your Chrome toolbar
- **Keyboard Shortcut**: Press `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)

The sidebar slides in from the right side of your screen without blocking the page content, allowing you to manage settings while keeping the webpage fully interactive.

### Built-in Shortcuts

The extension comes with these pre-configured shortcuts:

| Keyword | Website | Search URL |
|---------|---------|------------|
| `drive` | Google Drive | Search your Google Drive files |
| `gmail` | Gmail | Search your Gmail messages |
| `youtube` | YouTube | Search YouTube videos |
| `amazon` | Amazon | Search Amazon products |
| `wikipedia` | Wikipedia | Search Wikipedia articles |
| `imdb` | IMDb | Search movies and TV shows |
| `spotify` | Spotify | Search Spotify music |
| `github` | GitHub | Search GitHub repositories |
| `twitter` | Twitter | Search Twitter posts |
| `ai-studio` | AI Studio | Search AI Studio |

### Custom Shortcuts

Add your own shortcuts using the sidebar interface:

1. Open the sidebar (click extension icon or press `Ctrl+Shift+S`)
2. Click the "+ Add Custom" button in the shortcuts section
3. Enter a keyword (e.g., "reddit")
4. Provide the website name (e.g., "Reddit")
5. Add the search URL with `%s` placeholder (e.g., `https://www.reddit.com/search/?q=%s`)

The sidebar allows you to manage shortcuts without interrupting your browsing workflow.

## 🏗️ Project Structure

```
search-extension/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Service worker handling omnibox functionality
├── sidebar.js             # Sidebar interface injected into web pages
├── sidebar.css            # Sidebar styles with slide animation
├── popup.html            # Legacy popup interface (for reference)
├── popup.css             # Legacy popup styles (for reference)
├── popup.js              # Legacy popup logic (for reference)
├── content-script.js     # Content script for search detection
├── automation-script.js  # Advanced search automation
├── element-selector.js   # Element selection utilities
├── icons/                # Extension icons (16, 32, 48, 128px)
│   └── README.md         # Icon requirements and guidelines
└── README.md             # This file
```

## 🔧 Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: `storage`, `scripting`
- **APIs Used**: `chrome.omnibox`, `chrome.storage`, `chrome.tabs`, `chrome.action`, `chrome.commands`
- **Interface**: Sidebar injection system that doesn't block page content
- **Storage**: Local sync storage for user preferences and custom shortcuts
- **Keyboard Shortcuts**: `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac) to toggle sidebar

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test the extension thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports & Feature Requests

Please use the [GitHub Issues](https://github.com/yourusername/search-extension/issues) page to report bugs or request new features.

## 📞 Support

If you need help using OmniSearch:

1. Check the built-in help tab in the extension settings
2. Review this README
3. Open an issue on GitHub

---

**Made with ❤️ for productivity enthusiasts**
