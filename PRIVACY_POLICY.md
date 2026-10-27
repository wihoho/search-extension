# OmniSearch Privacy Policy

**Last updated: October 27, 2026**

OmniSearch is a Chrome extension that lets you search websites from Chrome's address bar with short keywords. It has no servers, no accounts, no ads and no analytics. The developer never receives any of your data.

## What OmniSearch stores

All of it stays in Chrome's own extension storage:

- **Your shortcuts** (name, keyword, search address and, for advanced shortcuts, the text box and button to use). These are saved in `chrome.storage.sync`, so if Chrome sync is on, Chrome copies them to your other computers. Sync is run by Google under Google's privacy policy; the developer can't see it.
- **How often you use each shortcut**, to put your favorites first in suggestions. This stays on this computer only (`chrome.storage.local`).

OmniSearch does not store your searches, your browsing history or the content of the pages you visit.

## What OmniSearch sends, and where

- **Your search goes only to the site you choose.** When you search with a shortcut, OmniSearch opens that site's search page with your words in the address, just as if you had typed it yourself. That site's own privacy policy applies.
- **Searches with no matching keyword** go to the default search engine you picked in Chrome's settings.
- **Site icons** in the OmniSearch panel are loaded directly from each shortcut's website.

Nothing is sent anywhere else.

## Permissions

| Permission | Why |
|---|---|
| `storage` | Save your shortcuts and use counts. |
| `sidePanel` | Show the OmniSearch panel where you manage shortcuts. |
| `search` | Run a normal web search with your default search engine when no keyword matches. |
| `contextMenus` | Add the right-click item **Add a keyword for this search**. |
| `activeTab`, `scripting` | Only after you choose that right-click item: read that page's search box (its address and field names, never what you typed) to fill in the new shortcut. Also used by advanced shortcuts, below. |
| Optional site access | Only for **advanced shortcuts**, and only for the sites you approve one by one. OmniSearch opens the page, types your search into the box you chose and presses its button. It does nothing else on those sites. You can remove this access at any time in `chrome://extensions`. |

OmniSearch does not run on the pages you visit otherwise.

## Deleting your data

Remove the extension from `chrome://extensions` and all OmniSearch data is deleted. To clear only the shortcuts, open the OmniSearch panel and choose **Restore default shortcuts** from the menu, or delete them one by one.

## Children

OmniSearch collects no data from anyone, including children.

## Changes

If this policy changes, the date at the top will change too.

## Contact

Questions or problems: [github.com/wihoho/search-extension/issues](https://github.com/wihoho/search-extension/issues)
