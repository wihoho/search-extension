// OmniSearch Background Script
// Handles omnibox functionality and search redirections

// Debug mode - set to true for production
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log('OmniSearch:', ...args);
  }
}

debugLog('Background script starting...');

// Default search shortcuts configuration
const DEFAULT_SHORTCUTS = {
  'ai': {
    name: 'AI Studio',
    keyword: 'ai',
    type: 'advanced',
    url: 'https://aistudio.google.com/prompts/new_chat',
    inputSelector: 'textarea',
    buttonSelector: 'button[aria-label*="Run"]:not([disabled])',
    enabled: true,
    icon: 'https://www.gstatic.com/a/images/brand/project-wordmark/bard-64.png'
  },
  'drive': {
    name: 'Google Drive',
    url: 'https://drive.google.com/drive/search?q=%s',
    enabled: true,
    icon: 'https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png'
  },
  'gmail': {
    name: 'Gmail',
    url: 'https://mail.google.com/mail/u/0/#search/%s',
    enabled: true,
    icon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico'
  },
  'youtube': {
    name: 'YouTube',
    url: 'https://www.youtube.com/results?search_query=%s',
    enabled: true,
    icon: 'https://www.youtube.com/favicon.ico'
  },
  'amazon': {
    name: 'Amazon',
    url: 'https://www.amazon.com/s?k=%s',
    enabled: true,
    icon: 'https://www.amazon.com/favicon.ico'
  },
  'wikipedia': {
    name: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Special:Search?search=%s',
    enabled: true,
    icon: 'https://en.wikipedia.org/favicon.ico'
  },
  'imdb': {
    name: 'IMDb',
    url: 'https://www.imdb.com/find?q=%s',
    enabled: true,
    icon: 'https://www.imdb.com/favicon.ico'
  },
  'spotify': {
    name: 'Spotify',
    url: 'https://open.spotify.com/search/%s',
    enabled: true,
    icon: 'https://open.spotify.com/favicon.ico'
  },
  'github': {
    name: 'GitHub',
    url: 'https://github.com/search?q=%s',
    enabled: true,
    icon: 'https://github.com/favicon.ico'
  },
  'twitter': {
    name: 'Twitter',
    url: 'https://twitter.com/search?q=%s',
    enabled: true,
    icon: 'https://twitter.com/favicon.ico'
  }
};

let currentShortcuts = {};
let currentKeyword = '';
let shortcutsLoaded = false;

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  debugLog('Extension installed/updated', details);

  try {
    if (details.reason === 'install') {
      debugLog('First time installation');
      // First time installation - set up default shortcuts
      await chrome.storage.sync.set({ shortcuts: DEFAULT_SHORTCUTS });
      await chrome.storage.sync.set({ firstTime: true });
      debugLog('Default shortcuts saved');

      // Open welcome page
      chrome.tabs.create({
        url: chrome.runtime.getURL('welcome.html')
      });
    } else if (details.reason === 'update') {
      debugLog('Extension updated');
      // Handle extension updates
      const result = await chrome.storage.sync.get(['shortcuts']);
      if (!result.shortcuts) {
        await chrome.storage.sync.set({ shortcuts: DEFAULT_SHORTCUTS });
        debugLog('Default shortcuts restored after update');
      }
    }

    // Load shortcuts
    await loadShortcuts();
    debugLog('Initialization complete');
  } catch (error) {
    console.error('OmniSearch: Error during initialization:', error);
  }
});

// Load shortcuts from storage
async function loadShortcuts() {
  try {
    debugLog('Loading shortcuts from storage...');
    const result = await chrome.storage.sync.get(['shortcuts']);
    currentShortcuts = result.shortcuts || DEFAULT_SHORTCUTS;
    shortcutsLoaded = true;
    debugLog('Loaded shortcuts:', Object.keys(currentShortcuts));
  } catch (error) {
    console.error('OmniSearch: Error loading shortcuts:', error);
    currentShortcuts = DEFAULT_SHORTCUTS;
    shortcutsLoaded = true;
  }
}

// Omnibox input started
chrome.omnibox.onInputStarted.addListener(() => {
  debugLog('Omnibox input started');
  currentKeyword = '';
});

// Omnibox input changed - provide suggestions
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  debugLog('Input changed:', text);

  try {
    const suggestions = [];

    // Check if user is typing a keyword
    const parts = text.split(' ');
    const keyword = parts[0].toLowerCase();

    debugLog('Parsed keyword:', keyword, 'parts:', parts.length);

    if (parts.length === 1) {
      // User is still typing keyword - show available shortcuts
      Object.keys(currentShortcuts).forEach(key => {
        if (key.startsWith(keyword) && currentShortcuts[key].enabled) {
          suggestions.push({
            content: key,
            description: `Search ${currentShortcuts[key].name} - Type your query after "${key} "`
          });
        }
      });
    } else if (currentShortcuts[keyword] && currentShortcuts[keyword].enabled) {
      // Valid keyword found - show search suggestion
      currentKeyword = keyword;
      const query = parts.slice(1).join(' ');
      debugLog('Valid keyword found:', keyword, 'query:', query);
      if (query.trim()) {
        suggestions.push({
          content: `${keyword} ${query}`,
          description: `Search ${currentShortcuts[keyword].name} for: ${query}`
        });
      }
    }

    debugLog('Providing suggestions:', suggestions.length);
    suggest(suggestions);
  } catch (error) {
    console.error('OmniSearch: Error in onInputChanged:', error);
    suggest([]);
  }
});

// Omnibox input entered - perform search
chrome.omnibox.onInputEntered.addListener(async (text) => {
  debugLog('Input entered:', text);

  try {
    const [keyword, ...queryParts] = text.split(' ');
    const query = queryParts.join(' ');
    const shortcut = currentShortcuts[keyword.toLowerCase()];

    debugLog('Parsed - keyword:', keyword, 'query:', query);

    if (!shortcut || !shortcut.enabled || !query) {
      debugLog('Search not executed - invalid keyword, disabled, or empty query');
      return;
    }

    if (shortcut.type === 'advanced') {
      // --- THIS IS THE NEW ADVANCED WORKFLOW ---
      debugLog(`Executing advanced shortcut: '${keyword}'`);
      
      const tab = await chrome.tabs.create({ url: shortcut.url, active: true });
      debugLog(`Created tab ${tab.id} with URL: ${shortcut.url}`);

      // The content script is now injected via manifest.json, so we just need to
      // wait for the tab to be ready and send the message.
      const listener = (tabId, changeInfo) => {
        debugLog(`Tab update detected: tabId=${tabId}, status=${changeInfo.status}`);
        if (tabId === tab.id && changeInfo.status === 'complete') {
          debugLog(`Tab ${tabId} is complete. Sending message...`);
          chrome.tabs.sendMessage(tab.id, {
            type: 'OMNISEARCH_AUTOMATE',
            query: query,
            inputSelector: shortcut.inputSelector,
            buttonSelector: shortcut.buttonSelector
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('OmniSearch: Error sending message:', chrome.runtime.lastError.message);
            } else {
              debugLog('Automation script responded:', response);
            }
          });
          
          // Clean up the listener
          debugLog(`Removing listener for tab ${tabId}`);
          chrome.tabs.onUpdated.removeListener(listener);
        }
      };
      chrome.tabs.onUpdated.addListener(listener);

    } else {
      // --- THIS IS THE EXISTING SIMPLE WORKFLOW ---
      debugLog('Executing simple shortcut:', keyword);
      const searchUrl = shortcut.url.replace('%s', encodeURIComponent(query));
      debugLog('Generated search URL:', searchUrl);
      chrome.tabs.create({ url: searchUrl });
    }

  } catch (error) {
    console.error('OmniSearch: Error in onInputEntered:', error);
  }
});

// Listen for storage changes to update shortcuts
chrome.storage.onChanged.addListener((changes, namespace) => {
  debugLog('Storage changed:', changes, 'namespace:', namespace);
  if (namespace === 'sync' && changes.shortcuts) {
    currentShortcuts = changes.shortcuts.newValue;
    debugLog('Shortcuts updated from storage:', Object.keys(currentShortcuts));
  }
});

// Message handling for popup communication
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  debugLog('Message received:', request);

  try {
    if (request.action === 'getShortcuts') {
      // Ensure shortcuts are loaded before responding
      if (!shortcutsLoaded) {
        debugLog('Shortcuts not loaded yet, loading now...');
        loadShortcuts().then(() => {
          debugLog('Sending shortcuts to popup:', Object.keys(currentShortcuts));
          sendResponse({ shortcuts: currentShortcuts });
        }).catch(error => {
          console.error('OmniSearch: Error loading shortcuts for popup:', error);
          sendResponse({ shortcuts: DEFAULT_SHORTCUTS });
        });
        return true; // Will respond asynchronously
      } else {
        debugLog('Sending shortcuts to popup:', Object.keys(currentShortcuts));
        sendResponse({ shortcuts: currentShortcuts });
      }
    } else if (request.action === 'updateShortcuts') {
      debugLog('Updating shortcuts from popup');
      // Ensure we save to storage first, then update current shortcuts
      chrome.storage.sync.set({ shortcuts: request.shortcuts }).then(() => {
        currentShortcuts = request.shortcuts;
        debugLog('Shortcuts saved and updated:', Object.keys(currentShortcuts));
        sendResponse({ success: true });
      }).catch(error => {
        console.error('OmniSearch: Error saving shortcuts:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true; // Will respond asynchronously
    } else if (request.action === 'resetToDefaults') {
      debugLog('Resetting to default shortcuts');
      chrome.storage.sync.set({ shortcuts: DEFAULT_SHORTCUTS }).then(() => {
        currentShortcuts = DEFAULT_SHORTCUTS;
        shortcutsLoaded = true;
        sendResponse({ success: true });
      }).catch(error => {
        console.error('OmniSearch: Error resetting shortcuts:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true; // Will respond asynchronously
    } else if (request.action === 'elementSelected') {
      // Handle element selection completion - reopen popup
      debugLog('Element selected, attempting to reopen popup');
      try {
        // Open the extension popup programmatically
        chrome.action.openPopup().catch(error => {
          debugLog('Could not auto-open popup (user must click extension icon):', error);
          // Note: chrome.action.openPopup() requires user gesture in newer Chrome versions
          // The user will need to click the extension icon manually
        });
        sendResponse({ success: true });
      } catch (error) {
        debugLog('Error handling element selection:', error);
        sendResponse({ success: false, error: error.message });
      }
    }
  } catch (error) {
    console.error('OmniSearch: Error handling message:', error);
    sendResponse({ error: error.message });
  }

  return true; // Keep message channel open for async response
});

// Handle browser startup
chrome.runtime.onStartup.addListener(async () => {
  debugLog('Browser startup detected');
  await loadShortcuts();
});

// Ensure shortcuts are loaded when service worker becomes active
(async () => {
  debugLog('Service worker activated, loading shortcuts...');
  await loadShortcuts();
})();
