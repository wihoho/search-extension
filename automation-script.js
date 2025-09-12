// automation-script.js

console.log("OmniSearch: automation-script.js loaded and listening.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("OmniSearch: Message received in content script.", request);
  // Wait for the instructions from background.js
  if (request.type === 'OMNISEARCH_AUTOMATE') {
    const { query, inputSelector, buttonSelector } = request;
    console.log(`OmniSearch: Starting automation with query: "${query}"`);
    
    // This is an async function to perform the steps in order
    const performAutomation = async () => {
      try {
        // Step 1: Wait for the textbox to exist on the page
        const inputSelectorType = isXPathSelector(inputSelector) ? 'XPath' : 'CSS';
        console.log(`OmniSearch: Waiting for input element (${inputSelectorType}): "${inputSelector}"`);
        const inputField = await waitForElement(inputSelector);
        console.log('OmniSearch: Found input field.', inputField);

        // Step 2: Fill the textbox like a user would
        // This is more reliable for sites like ChatGPT or AI Studio
        inputField.value = query;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('OmniSearch: Injected query into input field.');

        // Step 3: Wait for the submit button to exist
        const buttonSelectorType = isXPathSelector(buttonSelector) ? 'XPath' : 'CSS';
        console.log(`OmniSearch: Waiting for button element (${buttonSelectorType}): "${buttonSelector}"`);
        const submitButton = await waitForElement(buttonSelector);
        console.log('OmniSearch: Found submit button.', submitButton);

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
 * Detects if a selector is XPath or CSS selector
 */
function isXPathSelector(selector) {
  // XPath selectors typically start with / or // or contain XPath-specific syntax
  return selector.startsWith('/') || 
         selector.startsWith('//') || 
         selector.includes('[@') || 
         selector.includes('text()') ||
         selector.includes('contains(') ||
         selector.includes('following-sibling::') ||
         selector.includes('preceding-sibling::') ||
         selector.includes('ancestor::') ||
         selector.includes('descendant::');
}

/**
 * Finds an element using either CSS selector or XPath
 */
function findElement(selector) {
  if (isXPathSelector(selector)) {
    // Use XPath
    const result = document.evaluate(
      selector,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue;
  } else {
    // Use CSS selector
    return document.querySelector(selector);
  }
}

/**
 * A robust function to wait for an element to appear in the DOM.
 * This is essential for modern web apps that load content dynamically.
 * Supports both CSS selectors and XPath expressions.
 */
function waitForElement(selector) {
  return new Promise(resolve => {
    const element = findElement(selector);
    if (element) {
      return resolve(element);
    }

    const observer = new MutationObserver(mutations => {
      const targetElement = findElement(selector);
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
