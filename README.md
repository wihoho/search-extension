# OmniSearch

Search any website from Chrome's address bar with short keywords.

Type `os`, press <kbd>Space</kbd> or <kbd>Tab</kbd>, then a keyword and your search:

| You type | What happens |
|---|---|
| `os youtube cats` | Searches YouTube for "cats" |
| `os youtube` | Opens YouTube |
| `os you cats` | Same as `youtube`: keywords can be shortened |
| `os youtube+amazon cats` | Searches both sites, the second in a background tab |
| `os best pizza near me` | No matching keyword, so it runs a normal web search |
| `os youtube cats`, then <kbd>↓</kbd> | Picks another site for the same words |

Results open in the current tab. <kbd>Alt</kbd>+<kbd>Enter</kbd> opens them in a new tab.

[Chrome Web Store](https://chromewebstore.google.com/detail/eihpnhdoneijgoppfeldaclpkllomacc)

## Managing shortcuts

Click the toolbar icon or press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> (<kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> on Mac) to open the OmniSearch side panel. From there you can turn shortcuts on and off, edit or delete them (with undo), and export or import them as JSON.

Ways to add a site:

- **Right-click its search box** and choose **Add a keyword for this search**. OmniSearch reads the box's form, or the site's OpenSearch description, and fills in the address.
- **Paste a results page address** into **+ Add**. OmniSearch finds your search words in it and replaces them with `%s`.
- **Browse suggested shortcuts**: about 50 common sites, grouped by category.
- **Type the address yourself**, with `%s` where the search words go.

**Advanced shortcuts** are for sites without a search address, such as some AI chat tools. OmniSearch opens the page, types your words into the text box you name (a CSS selector) and clicks the button, or presses Enter if you leave the button empty. Each advanced shortcut asks for access to its own site only.

New installs get 10 shortcuts. Amazon and Wikipedia use the local store and language for Chrome's UI language.

## Code

```
manifest.json         Manifest V3
background.js         Service worker: address bar, context menus, keyboard shortcut, advanced shortcuts
lib/shortcuts.js      Shortcut model, defaults, suggested sites, input parsing, storage
lib/page-scripts.js   Functions injected into a page: fill in a search box, detect a site's search address
sidepanel.*           Side panel (also the options page)
welcome.*             Page shown after install
_locales/             Store name and summary in 12 languages
store-listing/        Store descriptions in 12 languages
tests/                Unit tests (node) and an end-to-end test (Playwright)
build.py              Writes build/omnisearch-<version>.zip
```

Storage: each shortcut is its own `chrome.storage.sync` item (`sc:<keyword>`), so there's no 8 KB cap on the whole list. Use counts stay in `chrome.storage.local`. The 2.0 format (one `shortcuts` object) is migrated on first run.

## Development

1. `chrome://extensions` → Developer mode → **Load unpacked** → this folder.
2. Tests:
   ```bash
   node --test tests/*.test.mjs
   PLAYWRIGHT=/path/to/node_modules/playwright node tests/e2e.cjs [screenshot-dir]
   ```
   The end-to-end test loads a copy of the extension in Chromium with access to `localhost`, then drives the address bar handlers through `omnisearch.onInputChanged/onInputEntered` in the service worker, plus the side panel and a local test site.
3. Package: `python3 build.py`

## Privacy

No servers, accounts or analytics. See [PRIVACY_POLICY.md](PRIVACY_POLICY.md).

## License

MIT, see [LICENSE](LICENSE).
