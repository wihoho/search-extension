// Element Selector Content Script
// Provides functionality for users to visually select DOM elements for advanced shortcuts

console.log("OmniSearch: element-selector.js loaded");

let isSelectionMode = false;
let highlightedElement = null;
let overlayElement = null;
let selectionCallback = null;

// CSS for highlighting elements
const HIGHLIGHT_STYLES = `
  .omnisearch-highlight {
    outline: 3px solid #4285f4 !important;
    outline-offset: 2px !important;
    cursor: pointer !important;
    position: relative !important;
  }
  
  .omnisearch-highlight::before {
    content: attr(data-omnisearch-info) !important;
    position: absolute !important;
    top: -30px !important;
    left: 0 !important;
    background: #4285f4 !important;
    color: white !important;
    padding: 4px 8px !important;
    border-radius: 4px !important;
    font-size: 12px !important;
    font-family: Arial, sans-serif !important;
    white-space: nowrap !important;
    z-index: 10000 !important;
    pointer-events: none !important;
  }
  
  .omnisearch-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    background: rgba(0, 0, 0, 0.2) !important;
    z-index: 9999 !important;
    cursor: crosshair !important;
    pointer-events: none !important;
  }
  
  .omnisearch-instructions {
    position: fixed !important;
    top: 20px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    background: #4285f4 !important;
    color: white !important;
    padding: 12px 20px !important;
    border-radius: 8px !important;
    font-family: Arial, sans-serif !important;
    font-size: 14px !important;
    z-index: 10001 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  }
`;

// Inject styles
function injectStyles() {
  if (document.getElementById('omnisearch-selector-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'omnisearch-selector-styles';
  style.textContent = HIGHLIGHT_STYLES;
  document.head.appendChild(style);
}

// Generate CSS selector for an element
function generateSelector(element) {
  // Try to generate a reliable selector
  const selectors = [];
  
  // Try ID first
  if (element.id) {
    const idSelector = `#${element.id}`;
    if (document.querySelectorAll(idSelector).length === 1) {
      return idSelector;
    }
  }
  
  // Try unique attributes
  const attributes = ['data-testid', 'data-test', 'name', 'placeholder', 'aria-label'];
  for (const attr of attributes) {
    const value = element.getAttribute(attr);
    if (value) {
      const attrSelector = `${element.tagName.toLowerCase()}[${attr}="${value}"]`;
      if (document.querySelectorAll(attrSelector).length === 1) {
        return attrSelector;
      }
    }
  }
  
  // Try class-based selector
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ').filter(c => c.trim());
    if (classes.length > 0) {
      const classSelector = `${element.tagName.toLowerCase()}.${classes.join('.')}`;
      if (document.querySelectorAll(classSelector).length === 1) {
        return classSelector;
      }
    }
  }
  
  // Fallback to tag with position
  const tagName = element.tagName.toLowerCase();
  const siblings = Array.from(element.parentNode?.children || []).filter(el => el.tagName === element.tagName);
  if (siblings.length === 1) {
    return tagName;
  } else {
    const index = siblings.indexOf(element) + 1;
    return `${tagName}:nth-of-type(${index})`;
  }
}

// Generate XPath selector for an element
function generateXPathSelector(element) {
  // Try to generate a reliable XPath
  
  // Try ID first
  if (element.id) {
    const xpath = `//*[@id='${element.id}']`;
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    if (result.singleNodeValue === element) {
      return xpath;
    }
  }
  
  // Try unique attributes
  const attributes = ['data-testid', 'data-test', 'name', 'placeholder', 'aria-label'];
  for (const attr of attributes) {
    const value = element.getAttribute(attr);
    if (value) {
      const xpath = `//${element.tagName.toLowerCase()}[@${attr}='${value}']`;
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      if (result.singleNodeValue === element) {
        return xpath;
      }
    }
  }
  
  // Try text content for buttons and links
  if (['button', 'a', 'span'].includes(element.tagName.toLowerCase())) {
    const text = element.textContent?.trim();
    if (text && text.length > 0 && text.length < 50) {
      const xpath = `//${element.tagName.toLowerCase()}[text()='${text}']`;
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      if (result.singleNodeValue === element) {
        return xpath;
      }
      
      // Try contains for partial text match
      const containsXpath = `//${element.tagName.toLowerCase()}[contains(text(),'${text}')]`;
      const containsResult = document.evaluate(containsXpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      if (containsResult.snapshotLength === 1 && containsResult.snapshotItem(0) === element) {
        return containsXpath;
      }
    }
  }
  
  // Fallback to positional XPath
  const getElementIndex = (el) => {
    let index = 1;
    let sibling = el.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === el.tagName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }
    return index;
  };
  
  const tagName = element.tagName.toLowerCase();
  const index = getElementIndex(element);
  return `//${tagName}[${index}]`;
}

// Get element description for display
function getElementDescription(element) {
  const tagName = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const placeholder = element.placeholder ? ` "${element.placeholder}"` : '';
  const ariaLabel = element.getAttribute('aria-label') ? ` "${element.getAttribute('aria-label')}"` : '';
  const text = element.textContent?.trim().substring(0, 20) || '';
  
  return `${tagName}${id}${placeholder}${ariaLabel}${text ? ` "${text}"` : ''}`.trim();
}

// Start element selection mode
function startElementSelection(type, callback) {
  console.log('Starting element selection for type:', type);
  
  if (isSelectionMode) {
    console.log('Already in selection mode, ignoring request');
    return;
  }
  
  isSelectionMode = true;
  selectionCallback = callback;
  
  injectStyles();
  
  // Create overlay
  overlayElement = document.createElement('div');
  overlayElement.className = 'omnisearch-overlay';
  document.body.appendChild(overlayElement);
  console.log('Created overlay element');
  
  // Create instructions
  const instructions = document.createElement('div');
  instructions.className = 'omnisearch-instructions';
  instructions.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 8px;">🎯 Element Selection Mode</div>
    <div>Click on the ${type} element you want to select</div>
    <div style="font-size: 12px; margin-top: 6px; opacity: 0.9;">Press ESC to cancel</div>
  `;
  document.body.appendChild(instructions);
  console.log('Created instructions element');
  
  // Add event listeners
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown, true);
  console.log('Added event listeners for element selection');
  
  // Don't disable pointer events on body since overlay now has pointer-events: none
  // This allows clicks to reach the target elements while overlay provides visual feedback
}

// Stop element selection mode
function stopElementSelection() {
  if (!isSelectionMode) return;
  
  isSelectionMode = false;
  selectionCallback = null;
  
  // Remove event listeners
  document.removeEventListener('mouseover', handleMouseOver, true);
  document.removeEventListener('mouseout', handleMouseOut, true);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('keydown', handleKeyDown, true);
  
  // Clean up highlights
  if (highlightedElement) {
    highlightedElement.classList.remove('omnisearch-highlight');
    highlightedElement.removeAttribute('data-omnisearch-info');
    highlightedElement = null;
  }
  
  // Remove overlay and instructions
  const overlay = document.querySelector('.omnisearch-overlay');
  const instructions = document.querySelector('.omnisearch-instructions');
  if (overlay) overlay.remove();
  if (instructions) instructions.remove();
  
  // No need to restore pointer events since we didn't disable them
}

// Handle mouse over events
function handleMouseOver(event) {
  if (!isSelectionMode) return;
  
  const element = event.target;
  
  // Skip if user is hovering over instructions
  if (element.classList.contains('omnisearch-instructions')) {
    return;
  }
  
  // Remove previous highlight
  if (highlightedElement) {
    highlightedElement.classList.remove('omnisearch-highlight');
    highlightedElement.removeAttribute('data-omnisearch-info');
  }
  
  // Add new highlight
  highlightedElement = element;
  element.classList.add('omnisearch-highlight');
  element.setAttribute('data-omnisearch-info', getElementDescription(element));
}

// Handle mouse out events
function handleMouseOut(event) {
  // Keep highlight until mouse enters another element
}

// Handle click events
function handleClick(event) {
  if (!isSelectionMode) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const element = event.target;
  
  // Skip if user clicked on instructions (they still need pointer events)
  if (element.classList.contains('omnisearch-instructions')) {
    return;
  }
  
  const cssSelector = generateSelector(element);
  const xpathSelector = generateXPathSelector(element);
  const description = getElementDescription(element);
  
  console.log('Element selected:', { element, cssSelector, xpathSelector, description });
  
  if (selectionCallback) {
    selectionCallback({
      cssSelector: cssSelector,
      xpathSelector: xpathSelector,
      selector: xpathSelector, // Default to XPath as requested in issue #5
      description: description,
      tagName: element.tagName.toLowerCase(),
      element: element
    });
  }
  
  stopElementSelection();
}

// Handle keyboard events
function handleKeyDown(event) {
  if (!isSelectionMode) return;
  
  if (event.key === 'Escape') {
    event.preventDefault();
    stopElementSelection();
    if (selectionCallback) {
      selectionCallback(null); // Cancelled
    }
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Element selector received message:', request);
  
  if (request.action === 'startElementSelection') {
    console.log('Processing startElementSelection request');
    const { type } = request;
    
    startElementSelection(type, (result) => {
      console.log('Element selection completed, sending response:', result);
      sendResponse(result);
    });
    
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'stopElementSelection') {
    console.log('Processing stopElementSelection request');
    stopElementSelection();
    sendResponse({ success: true });
  }
  
  // Handle existing automation requests
  if (request.type === 'OMNISEARCH_AUTOMATE') {
    console.log('OMNISEARCH_AUTOMATE request - delegating to automation-script.js');
    // This is handled by automation-script.js
    return false;
  }
});