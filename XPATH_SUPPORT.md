# XPath Selector Support

## Overview

OmniSearch now supports both **CSS selectors** and **XPath expressions** for advanced shortcuts. This makes element selection more reliable and flexible, especially for complex web applications.

## What's New

- **XPath Support**: Use XPath expressions in addition to CSS selectors for `inputSelector` and `buttonSelector` fields
- **Automatic Detection**: The extension automatically detects whether you're using CSS or XPath syntax
- **Backward Compatibility**: All existing CSS selectors continue to work without any changes

## When to Use XPath vs CSS

### CSS Selectors (Traditional)
```css
textarea                           /* Simple tag selector */
#searchInput                       /* ID selector */
.search-input                      /* Class selector */
input[placeholder="Search"]        /* Attribute selector */
button[aria-label*="Submit"]       /* Partial attribute match */
```

### XPath Selectors (More Powerful)
```xpath
//textarea                         /* Any textarea element */
//*[@id='searchInput']             /* Element by ID */
//input[@placeholder='Search']     /* Element by exact attribute */
//button[text()='Submit']          /* Element by text content */
//button[contains(@aria-label,'Run')] /* Element by partial attribute */
//div[contains(@class,'search')]   /* Element by partial class name */
//input[@type='text'][1]           /* First input of specific type */
```

## Advantages of XPath

1. **Text-based Selection**: Select elements by their visible text content
2. **Flexible Attribute Matching**: More powerful pattern matching with `contains()`
3. **Hierarchical Navigation**: Navigate up/down the DOM tree
4. **Position-based Selection**: Select elements by their position
5. **Complex Conditions**: Combine multiple conditions with `and`/`or`

## Examples

### Example 1: ChatGPT-like Interface
```javascript
// CSS (might break if classes change)
inputSelector: 'textarea[placeholder*="message"]'
buttonSelector: 'button[data-testid="send-button"]'

// XPath (more reliable)
inputSelector: '//textarea[contains(@placeholder,"message")]'
buttonSelector: '//button[contains(@aria-label,"Send") or text()="Send"]'
```

### Example 2: Google AI Studio
```javascript
// CSS
inputSelector: 'textarea'
buttonSelector: 'button[aria-label*="Run"]:not([disabled])'

// XPath (more specific)
inputSelector: '//textarea[@placeholder="Start typing a prompt"]'
buttonSelector: '//button[contains(@aria-label,"Run") and not(@disabled)]'
```

### Example 3: Text-based Button Selection
```javascript
// Only possible with XPath
buttonSelector: '//button[text()="Search Now"]'
buttonSelector: '//button[contains(text(),"Submit")]'
buttonSelector: '//button[normalize-space()="Run Query"]'
```

## Detection Rules

The extension automatically detects XPath selectors if they contain:
- Start with `/` or `//`
- Contain `[@` (attribute selector)
- Contain `text()` (text content)
- Contain `contains(` (contains function)
- Contain XPath axes like `following-sibling::`, `ancestor::`, etc.

## Migration Guide

Your existing shortcuts will continue to work without any changes. To upgrade to XPath:

1. Open OmniSearch settings
2. Edit your advanced shortcut
3. Replace CSS selectors with XPath expressions
4. Test the shortcut to ensure it works

## Troubleshooting

### Common XPath Errors
- **Single vs Double Quotes**: Use consistent quotes in XPath expressions
- **Case Sensitivity**: XPath is case-sensitive for tag names and attributes
- **Namespace Issues**: Some sites use XML namespaces; use `//*` instead of `//tagname`

### Testing XPath
Use browser console to test XPath expressions:
```javascript
// Test if XPath finds an element
document.evaluate('//button[text()="Submit"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
```

## Best Practices

1. **Start Simple**: Begin with basic XPath expressions and add complexity as needed
2. **Use Text Content**: Text-based selectors are often more stable than class-based ones
3. **Combine Conditions**: Use multiple conditions to make selectors more specific
4. **Test Thoroughly**: Always test XPath selectors on the target website
5. **Fallback Strategy**: Keep CSS alternatives for complex sites

## Resources

- [XPath Tutorial](https://www.w3schools.com/xml/xpath_intro.asp)
- [XPath Cheat Sheet](https://devhints.io/xpath)
- [Browser DevTools XPath](https://developers.google.com/web/tools/chrome-devtools/console/command-line-reference#xpath)