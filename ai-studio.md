

### Detailed Technical Steps to Implement Advanced Automation

Here is your detailed guide to implement the feature where typing `os ai where is singapore` will automate AI Studio.

#### Step 1: Evolve Your Data Structure for Shortcuts

First, you need to teach OmniSearch the difference between a simple URL search and a complex automation. You'll do this by updating how you store your shortcuts.

In your `chrome.storage`, each shortcut object will now have a `type`.

**Example Shortcut Configuration:**

```json
{
  "youtube": {
    "keyword": "youtube",
    "type": "simple",
    "url": "https://www.youtube.com/results?search_query=%s"
  },
  "ai": {
    "keyword": "ai",
    "type": "advanced",
    "url": "https://aistudio.google.com/prompts/new_chat",
    "inputSelector": "textarea[placeholder='Start typing a prompt']",
    "buttonSelector": "button[data-testid='send-button']"
  }
}
```

*   **`type: "simple"`:** The existing functionality.
*   **`type: "advanced"`:** The new automation feature.
*   **`url`:** The page to open.
*   **`inputSelector`:** The CSS Selector to find the textbox on the page.
*   **`buttonSelector`:** The CSS Selector to find the submit button.

#### Step 2: Modify Your `background.js` to Orchestrate the Workflow

Your `chrome.omnibox.onInputEntered` listener will become the main orchestrator, deciding which path to take based on the shortcut's `type`.

```javascript
// in your background.js

chrome.omnibox.onInputEntered.addListener(async (text) => {
  const [keyword, ...queryParts] = text.split(' ');
  const query = queryParts.join(' ');

  // 1. Get your shortcuts from chrome.storage
  const shortcuts = await getShortcutsFromStorage(); 
  const shortcut = shortcuts[keyword];

  if (!shortcut) return; // Handle error

  // 2. Decide which workflow to use
  if (shortcut.type === 'simple') {
    // --- THIS IS YOUR EXISTING CODE ---
    const searchUrl = shortcut.url.replace('%s', encodeURIComponent(query));
    chrome.tabs.create({ url: searchUrl });

  } else if (shortcut.type === 'advanced') {
    // --- THIS IS THE NEW ADVANCED WORKFLOW ---
    
    // Create the tab but don't make it active immediately
    const tab = await chrome.tabs.create({ url: shortcut.url, active: true });

    // This pattern is taken directly from your example's `waitForTabLoad` function.
    // It is ESSENTIAL for modern websites that take time to load.
    const listener = (tabId, changeInfo, updatedTab) => {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        
        // Now that the tab is fully loaded, inject the automation script
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['automation-script.js'] // Our new "robot" script
        }, () => {
          // After injecting, send a message with the instructions
          chrome.tabs.sendMessage(tab.id, {
            type: 'OMNISEARCH_AUTOMATE',
            query: query,
            inputSelector: shortcut.inputSelector,
            buttonSelector: shortcut.buttonSelector
          });
        });
        
        // IMPORTANT: Remove the listener to prevent it from running again
        chrome.tabs.onUpdated.removeListener(listener);
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  }
});

// Helper function to get your data
async function getShortcutsFromStorage() {
  // Your logic to retrieve shortcuts from chrome.storage.local.get
  // For this example, we'll return the hardcoded object.
  return {
    "youtube": { /*...*/ },
    "ai": {
      "keyword": "ai", "type": "advanced", "url": "https://aistudio.google.com/prompts/new_chat",
      "inputSelector": "textarea[placeholder='Start typing a prompt']",
      "buttonSelector": "button[data-testid='send-button']"
    }
  };
}
```

#### Step 3: Create the "Robot" Script (`automation-script.js`)

This new file is the heart of the automation. It's a simplified and adapted version of your `ai-studio-injector.js`. Its only job is to listen for a message and perform the actions on the page.

Create a new file named `automation-script.js`:

```javascript
// automation-script.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Wait for the instructions from background.js
  if (request.type === 'OMNISEARCH_AUTOMATE') {
    const { query, inputSelector, buttonSelector } = request;
    
    // This is an async function to perform the steps in order
    const performAutomation = async () => {
      try {
        // Step 1: Wait for the textbox to exist on the page
        const inputField = await waitForElement(inputSelector);
        console.log('OmniSearch: Found input field.');

        // Step 2: Fill the textbox like a user would
        // This is more reliable for sites like ChatGPT or AI Studio
        inputField.value = query;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('OmniSearch: Injected query into input field.');

        // Step 3: Wait for the submit button to exist
        const submitButton = await waitForElement(buttonSelector);
        console.log('OmniSearch: Found submit button.');

        // Step 4: Click the button
        submitButton.click();
        console.log('OmniSearch: Clicked submit button.');
        
        sendResponse({ status: 'success' });
      } catch (error) {
        console.error('OmniSearch Automation Error:', error);
        sendResponse({ status: 'error', message: error.message });
      }
    };

    performAutomation();
    return true; // Indicates you will send a response asynchronously
  }
});

/**
 * A robust function to wait for an element to appear in the DOM.
 * This is essential for modern web apps that load content dynamically.
 * This pattern is extracted from your example code.
 */
function waitForElement(selector) {
  return new Promise(resolve => {
    const element = document.querySelector(selector);
    if (element) {
      return resolve(element);
    }

    const observer = new MutationObserver(mutations => {
      const targetElement = document.querySelector(selector);
      if (targetElement) {
        resolve(targetElement);
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}
```

#### Step 4: Update Your `manifest.json`

Finally, you need to give your extension the necessary permissions to perform these advanced actions.

```json
{
  "name": "OmniSearch",
  "version": "2.0",
  "manifest_version": 3,
  "background": {
    "service_worker": "background.js"
  },
  "permissions": [
    "storage",
    "scripting" 
  ],
  "host_permissions": [
    "https://aistudio.google.com/*",
    "https://chat.openai.com/*" 
  ],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["automation-script.js"],
      "run_at": "document_idle"
    }
  ]
}
```

### Summary of How It Works for "os ai where is singapore"

1.  **You type:** `os ai where is singapore` and hit Enter.
2.  **`background.js` triggers:** It finds the `"ai"` shortcut. It sees `type: "advanced"`.
3.  **Navigate:** It opens a new tab to `https://aistudio.google.com/...`.
4.  **Wait:** It uses the `chrome.tabs.onUpdated` listener to wait until the AI Studio page is fully loaded.
5.  **Inject & Instruct:** It executes `automation-script.js` into the loaded page and immediately sends it a message containing `{ query: "where is singapore", inputSelector: "...", buttonSelector: "..." }`.
6.  **Automate:** The `automation-script.js` running inside the AI Studio page receives the message.
    *   It uses `waitForElement` to find the prompt `textarea`.
    *   It sets the textarea's value to "where is singapore".
    *   It uses `waitForElement` to find the send button.
    *   It `click()`s the button.
7.  **Result:** The query is submitted to AI Studio, exactly as if you had done it manually, but in a fraction of the time.