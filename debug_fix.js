// Debug script to test the fix for custom shortcuts deletion bug
// This simulates the problematic scenario

console.log('=== Testing Custom Shortcuts Fix ===');

// Simulate the background script state
let mockCurrentShortcuts = {};
let mockShortcutsLoaded = false;

// Simulate default shortcuts
const DEFAULT_SHORTCUTS = {
  'drive': { name: 'Google Drive', url: 'https://drive.google.com/drive/search?q=%s', enabled: true },
  'gmail': { name: 'Gmail', url: 'https://mail.google.com/mail/u/0/#search/%s', enabled: true },
  'youtube': { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=%s', enabled: true }
};

// Simulate loading shortcuts (async)
async function mockLoadShortcuts() {
  console.log('Mock: Loading shortcuts from storage...');
  // Simulate existing shortcuts with custom ones
  mockCurrentShortcuts = {
    ...DEFAULT_SHORTCUTS,
    'reddit': { name: 'Reddit', url: 'https://www.reddit.com/search/?q=%s', enabled: true },
    'stackoverflow': { name: 'Stack Overflow', url: 'https://stackoverflow.com/search?q=%s', enabled: true }
  };
  mockShortcutsLoaded = true;
  console.log('Mock: Loaded shortcuts:', Object.keys(mockCurrentShortcuts));
  return mockCurrentShortcuts;
}

// Simulate background script getShortcuts handler (fixed version)
async function mockGetShortcuts() {
  console.log('Mock: getShortcuts called');
  
  // OLD BUGGY BEHAVIOR (commented out):
  // if (!mockShortcutsLoaded) {
  //   console.log('Mock: Shortcuts not loaded, returning empty object');
  //   return {}; // BUG: This would cause data loss
  // }
  
  // NEW FIXED BEHAVIOR:
  if (!mockShortcutsLoaded) {
    console.log('Mock: Shortcuts not loaded yet, loading now...');
    await mockLoadShortcuts();
  }
  
  console.log('Mock: Returning shortcuts:', Object.keys(mockCurrentShortcuts));
  return mockCurrentShortcuts;
}

// Simulate popup requesting shortcuts
async function mockPopupLoadShortcuts() {
  console.log('Mock Popup: Requesting shortcuts from background...');
  const shortcuts = await mockGetShortcuts();
  console.log('Mock Popup: Received shortcuts:', Object.keys(shortcuts));
  return shortcuts;
}

// Simulate saving new shortcut
async function mockSaveNewShortcut(shortcuts, newKeyword, newShortcut) {
  console.log(`Mock Popup: Adding new shortcut "${newKeyword}"`);
  console.log('Mock Popup: Existing shortcuts before save:', Object.keys(shortcuts));
  
  // Add new shortcut
  shortcuts[newKeyword] = newShortcut;
  
  console.log('Mock Popup: Shortcuts after adding new one:', Object.keys(shortcuts));
  
  // Save to storage (this is where the bug would manifest)
  mockCurrentShortcuts = shortcuts;
  console.log('Mock: Saved shortcuts to storage:', Object.keys(mockCurrentShortcuts));
}

// Test scenarios
async function runTests() {
  console.log('\n--- Test 1: Normal flow (shortcuts already loaded) ---');
  await mockLoadShortcuts(); // Background loaded
  let popupShortcuts = await mockPopupLoadShortcuts(); // Popup gets shortcuts
  await mockSaveNewShortcut(popupShortcuts, 'github', { name: 'GitHub', url: 'https://github.com/search?q=%s', enabled: true });
  
  const afterTest1 = Object.keys(mockCurrentShortcuts);
  console.log('After Test 1 shortcuts:', afterTest1.join(', '));
  
  console.log('\n--- Test 2: Race condition (popup loads before background) ---');
  // Simulate service worker restart (but storage persists)
  const persistedShortcuts = {...mockCurrentShortcuts}; // Storage persists
  mockCurrentShortcuts = {}; // Background script memory reset
  mockShortcutsLoaded = false; // Reset background state
  
  // Simulate that loadShortcuts will restore from persistent storage
  const originalMockLoadShortcuts = mockLoadShortcuts;
  mockLoadShortcuts = async function() {
    console.log('Mock: Loading shortcuts from storage...');
    mockCurrentShortcuts = persistedShortcuts; // Restore from storage
    mockShortcutsLoaded = true;
    console.log('Mock: Loaded shortcuts:', Object.keys(mockCurrentShortcuts));
    return mockCurrentShortcuts;
  };
  
  popupShortcuts = await mockPopupLoadShortcuts(); // This should trigger loading
  await mockSaveNewShortcut(popupShortcuts, 'twitter', { name: 'Twitter', url: 'https://twitter.com/search?q=%s', enabled: true });
  
  console.log('\n--- Final Result ---');
  console.log('Final shortcuts count:', Object.keys(mockCurrentShortcuts).length);
  console.log('Final shortcuts:', Object.keys(mockCurrentShortcuts).join(', '));
  
  // Check if we preserved existing shortcuts
  const expectedShortcuts = ['drive', 'gmail', 'youtube', 'reddit', 'stackoverflow', 'github', 'twitter'];
  const actualShortcuts = Object.keys(mockCurrentShortcuts);
  const missing = expectedShortcuts.filter(s => !actualShortcuts.includes(s));
  
  if (missing.length === 0) {
    console.log('✅ SUCCESS: All shortcuts preserved!');
  } else {
    console.log('❌ FAILURE: Missing shortcuts:', missing.join(', '));
  }
}

// Run the tests
runTests().catch(console.error);