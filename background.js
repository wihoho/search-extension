// OmniSearch Background Script
// Handles omnibox functionality and search redirections

// Debug mode - set to false for production
const DEBUG = false;

function debugLog(...args) {
  if (DEBUG) {
    console.log('OmniSearch:', ...args);
  }
}

debugLog('Background script starting...');

// Default search shortcuts configuration
const DEFAULT_SHORTCUTS = {
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
    debugLog('Loaded shortcuts:', Object.keys(currentShortcuts));
  } catch (error) {
    console.error('OmniSearch: Error loading shortcuts:', error);
    currentShortcuts = DEFAULT_SHORTCUTS;
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
chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  debugLog('Input entered:', text, 'disposition:', disposition);

  try {
    const parts = text.split(' ');
    const keyword = parts[0].toLowerCase();
    const query = parts.slice(1).join(' ').trim();

    debugLog('Parsed - keyword:', keyword, 'query:', query);
    debugLog('Available shortcuts:', Object.keys(currentShortcuts));
    debugLog('Keyword exists:', !!currentShortcuts[keyword]);
    debugLog('Keyword enabled:', currentShortcuts[keyword]?.enabled);

    if (currentShortcuts[keyword] && currentShortcuts[keyword].enabled && query) {
      const searchUrl = currentShortcuts[keyword].url.replace('%s', encodeURIComponent(query));
      debugLog('Generated search URL:', searchUrl);

      // Open in current tab, new tab, or new window based on disposition
      if (disposition === 'currentTab') {
        debugLog('Opening in current tab');
        chrome.tabs.update({ url: searchUrl });
      } else if (disposition === 'newForegroundTab') {
        debugLog('Opening in new foreground tab');
        chrome.tabs.create({ url: searchUrl });
      } else if (disposition === 'newBackgroundTab') {
        debugLog('Opening in new background tab');
        chrome.tabs.create({ url: searchUrl, active: false });
      }
    } else {
      debugLog('Search not executed - invalid keyword or empty query');
      if (!currentShortcuts[keyword]) {
        debugLog('Keyword not found in shortcuts');
      } else if (!currentShortcuts[keyword].enabled) {
        debugLog('Keyword is disabled');
      } else if (!query) {
        debugLog('Query is empty');
      }
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
      debugLog('Sending shortcuts to popup:', Object.keys(currentShortcuts));
      sendResponse({ shortcuts: currentShortcuts });
    } else if (request.action === 'updateShortcuts') {
      debugLog('Updating shortcuts from popup');
      chrome.storage.sync.set({ shortcuts: request.shortcuts });
      currentShortcuts = request.shortcuts;
      sendResponse({ success: true });
    } else if (request.action === 'resetToDefaults') {
      debugLog('Resetting to default shortcuts');
      chrome.storage.sync.set({ shortcuts: DEFAULT_SHORTCUTS });
      currentShortcuts = DEFAULT_SHORTCUTS;
      sendResponse({ success: true });
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
