# OmniSearch Chrome Extension

A powerful Chrome extension that provides quick search shortcuts for popular websites directly from the address bar (omnibox). Transform your browsing experience with instant access to search functionality across your favorite platforms.

## 🚀 Features

- **Quick Search Shortcuts**: Type keywords in the address bar to search specific websites instantly
- **Pre-configured Popular Sites**: Built-in support for Google Drive, Gmail, YouTube, Amazon, Wikipedia, IMDb, Spotify, GitHub, and Twitter
- **Custom Shortcuts**: Add your own search shortcuts for any website
- **Simple Interface**: Clean, intuitive settings panel for managing shortcuts
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

*Coming soon to Chrome Web Store*

## ⚙️ Configuration

Click the OmniSearch icon in your Chrome toolbar to access settings:

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

### Custom Shortcuts

Add your own shortcuts by:

1. Clicking the "+ Add Custom" button in settings
2. Entering a keyword (e.g., "reddit")
3. Providing the website name (e.g., "Reddit")
4. Adding the search URL with `%s` placeholder (e.g., `https://www.reddit.com/search/?q=%s`)

## 🏗️ Project Structure

```
search-extension/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Service worker handling omnibox functionality
├── popup.html            # Settings interface HTML
├── popup.css             # Settings interface styles
├── popup.js              # Settings interface logic
├── icons/                # Extension icons (16, 32, 48, 128px)
│   └── README.md         # Icon requirements and guidelines
└── README.md             # This file
```

## 🔧 Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: `storage`, `activeTab`
- **APIs Used**: `chrome.omnibox`, `chrome.storage`, `chrome.tabs`
- **Storage**: Local sync storage for user preferences and custom shortcuts

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
