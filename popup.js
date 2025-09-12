// OmniSearch Popup Script
// Handles the settings interface and shortcut management

let shortcuts = {};
let editingShortcut = null;

// Forward declarations for global functions
function toggleShortcut(keyword) {
    if (shortcuts[keyword]) {
        shortcuts[keyword].enabled = !shortcuts[keyword].enabled;
        saveShortcuts();
    }
}

function editShortcut(keyword) {
    console.log('Edit shortcut called for:', keyword);
    try {
        editingShortcut = keyword;
        const shortcut = shortcuts[keyword];

        if (!shortcut) {
            console.error('Shortcut not found:', keyword);
            alert('Shortcut not found. Please refresh and try again.');
            return;
        }

        document.getElementById('modal-title').textContent = 'Edit Shortcut';
        document.getElementById('shortcut-keyword').value = keyword;
        document.getElementById('shortcut-name').value = shortcut.name;
        document.getElementById('save-btn').textContent = 'Update';

        // Handle shortcut type
        const isAdvanced = shortcut.type === 'advanced';
        const simpleRadio = document.querySelector('input[name="shortcut-type"][value="simple"]');
        const advancedRadio = document.querySelector('input[name="shortcut-type"][value="advanced"]');
        
        if (isAdvanced) {
            advancedRadio.checked = true;
            document.getElementById('advanced-url').value = shortcut.url || '';
            document.getElementById('input-selector').value = shortcut.inputSelector || '';
            document.getElementById('button-selector').value = shortcut.buttonSelector || '';
        } else {
            simpleRadio.checked = true;
            document.getElementById('shortcut-url').value = shortcut.url || '';
        }

        // Trigger type change to show/hide appropriate fields
        handleShortcutTypeChange();

        // Enable keyword field for editing (allow editing default shortcuts)
        document.getElementById('shortcut-keyword').disabled = false;

        openModal();
    } catch (error) {
        console.error('Error editing shortcut:', error);
        alert('Failed to open edit dialog. Please try again.');
    }
}

async function deleteShortcut(keyword) {
    console.log('Delete shortcut called for:', keyword);
    try {
        const shortcut = shortcuts[keyword];

        if (!shortcut) {
            console.error('Shortcut not found:', keyword);
            alert('Shortcut not found. Please refresh and try again.');
            return;
        }

        if (confirm(`Are you sure you want to delete the "${shortcut.name}" shortcut?`)) {
            delete shortcuts[keyword];
            await saveShortcuts();
            renderShortcuts();
            renderKeywordsHelp();

            // Show success feedback
            showSuccessFeedback(`Deleted "${shortcut.name}" shortcut`);
        }
    } catch (error) {
        console.error('Error deleting shortcut:', error);
        alert('Failed to delete shortcut. Please try again.');
    }
}

// Make functions globally available early (before any HTML generation)
window.toggleShortcut = toggleShortcut;
window.editShortcut = editShortcut;
window.deleteShortcut = deleteShortcut;

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const shortcutsList = document.getElementById('shortcuts-list');
const addShortcutBtn = document.getElementById('add-shortcut-btn');
const modal = document.getElementById('add-shortcut-modal');
const closeModalBtn = document.getElementById('close-modal');
const shortcutForm = document.getElementById('shortcut-form');
const cancelBtn = document.getElementById('cancel-btn');
const keywordsHelp = document.getElementById('keywords-help');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await loadShortcuts();
    renderShortcuts();
    renderKeywordsHelp();
    setupEventListeners();
    await checkFirstTime();
    await initializeSmartDetection();
    await checkPendingElementSelection();
});

// Load shortcuts from background script
async function loadShortcuts() {
    return new Promise((resolve) => {
        console.log('Popup: Requesting shortcuts from background script');
        chrome.runtime.sendMessage({ action: 'getShortcuts' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Popup: Error communicating with background script:', chrome.runtime.lastError);
                // Don't reset to empty - keep existing shortcuts if any
                if (Object.keys(shortcuts).length === 0) {
                    shortcuts = {};
                }
                console.warn('Popup: Using fallback shortcuts due to communication error');
            } else if (response && response.shortcuts) {
                console.log('Popup: Received shortcuts:', response);
                shortcuts = response.shortcuts;
            } else {
                console.warn('Popup: Invalid response from background script:', response);
                // Don't overwrite existing shortcuts with empty object
                if (Object.keys(shortcuts).length === 0) {
                    shortcuts = {};
                }
            }
            resolve();
        });
    });
}

// Save shortcuts to storage
async function saveShortcuts() {
    return new Promise((resolve) => {
        // Validate that we have shortcuts to save
        if (!shortcuts || Object.keys(shortcuts).length === 0) {
            console.warn('Popup: Attempting to save empty shortcuts - this may be a bug');
            // Try to reload shortcuts first
            loadShortcuts().then(() => {
                if (Object.keys(shortcuts).length === 0) {
                    console.error('Popup: No shortcuts to save after reload');
                    resolve(false);
                    return;
                }
                // Retry save after reload
                chrome.runtime.sendMessage({
                    action: 'updateShortcuts',
                    shortcuts: shortcuts
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Popup: Error saving shortcuts after reload:', chrome.runtime.lastError);
                        resolve(false);
                    } else {
                        console.log('Popup: Shortcuts saved successfully after reload:', response);
                        resolve(response.success);
                    }
                });
            });
            return;
        }

        console.log('Popup: Saving shortcuts to background script');
        console.log('Popup: Shortcut count:', Object.keys(shortcuts).length);
        console.log('Popup: Shortcuts being saved:', Object.keys(shortcuts).join(', '));
        
        chrome.runtime.sendMessage({
            action: 'updateShortcuts',
            shortcuts: shortcuts
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Popup: Error saving shortcuts:', chrome.runtime.lastError);
                resolve(false);
            } else {
                console.log('Popup: Shortcuts saved successfully:', response);
                resolve(response.success);
            }
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });

    // Add shortcut button
    addShortcutBtn.addEventListener('click', () => {
        openModal();
    });

    // Modal close buttons
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Form submission
    shortcutForm.addEventListener('submit', handleFormSubmit);

    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Smart detection buttons
    const addDetectedBtn = document.getElementById('add-detected-shortcut');
    const editDetectedBtn = document.getElementById('edit-detected-shortcut');
    const manualAddBtn = document.getElementById('manual-add-btn');

    if (addDetectedBtn) {
        addDetectedBtn.addEventListener('click', addDetectedShortcut);
    }

    if (editDetectedBtn) {
        editDetectedBtn.addEventListener('click', editDetectedShortcut);
    }

    if (manualAddBtn) {
        manualAddBtn.addEventListener('click', () => {
            openModal();
        });
    }

    // Advanced shortcut type radio buttons
    const typeRadios = document.querySelectorAll('input[name="shortcut-type"]');
    typeRadios.forEach(radio => {
        radio.addEventListener('change', handleShortcutTypeChange);
    });

    // Element selection buttons
    const selectInputBtn = document.getElementById('select-input-btn');
    const selectButtonBtn = document.getElementById('select-button-btn');

    if (selectInputBtn) {
        selectInputBtn.addEventListener('click', () => selectElement('input'));
    }

    if (selectButtonBtn) {
        selectButtonBtn.addEventListener('click', () => selectElement('button'));
    }
}

// Switch between tabs
function switchTab(tabName) {
    // Update tab buttons
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    tabContents.forEach(content => {
        content.classList.toggle('hidden', content.id !== `${tabName}-tab`);
    });
}

// Render shortcuts list
function renderShortcuts() {
    shortcutsList.innerHTML = '';

    Object.entries(shortcuts).forEach(([keyword, shortcut]) => {
        const shortcutElement = createShortcutElement(keyword, shortcut);
        shortcutsList.appendChild(shortcutElement);
    });
}

// Create shortcut element
function createShortcutElement(keyword, shortcut) {
    const div = document.createElement('div');
    div.className = `shortcut-item${shortcut.type === 'advanced' ? ' advanced' : ''}`;

    const isCustom = !isDefaultShortcut(keyword);

    div.innerHTML = `
        <img src="${shortcut.icon || 'icons/icon16.png'}" alt="${shortcut.name}" class="shortcut-icon" onerror="this.src='icons/icon16.png'">
        <div class="shortcut-info">
            <div class="shortcut-name">${shortcut.name}</div>
            <div class="shortcut-keyword">${keyword}</div>
        </div>
        <div class="shortcut-actions">
            <label class="toggle-switch">
                <input type="checkbox" ${shortcut.enabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
            </label>
            <button class="btn btn-edit" data-keyword="${keyword}">Edit</button>
            <button class="btn btn-danger" data-keyword="${keyword}">Delete</button>
        </div>
    `;

    // Add event listeners for better reliability
    const toggleInput = div.querySelector('input[type="checkbox"]');
    if (toggleInput) {
        toggleInput.addEventListener('change', () => {
            console.log('Toggle shortcut:', keyword);
            toggleShortcut(keyword);
        });
    }

    const editBtn = div.querySelector('.btn-edit');
    const deleteBtn = div.querySelector('.btn-danger');

    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Edit button clicked for:', keyword);
            editShortcut(keyword);
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Delete button clicked for:', keyword);
            deleteShortcut(keyword);
        });
    }

    return div;
}

// Check if shortcut is a default one
function isDefaultShortcut(keyword) {
    const defaultKeywords = ['drive', 'gmail', 'youtube', 'amazon', 'wikipedia', 'imdb', 'spotify', 'github', 'twitter'];
    return defaultKeywords.includes(keyword);
}

// These functions are now defined at the top of the file

// Open modal
function openModal() {
    modal.classList.remove('hidden');
    document.getElementById('shortcut-keyword').focus();
}

// Close modal
function closeModal() {
    modal.classList.add('hidden');
    shortcutForm.reset();
    editingShortcut = null;
    
    // Reset modal state
    document.getElementById('modal-title').textContent = 'Add Custom Shortcut';
    document.getElementById('save-btn').textContent = 'Save';
    document.getElementById('shortcut-keyword').disabled = false;
    
    // Reset shortcut type to simple
    document.querySelector('input[name="shortcut-type"][value="simple"]').checked = true;
    handleShortcutTypeChange();
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();

    try {
        const keyword = document.getElementById('shortcut-keyword').value.toLowerCase().trim();
        const name = document.getElementById('shortcut-name').value.trim();
        const shortcutType = document.querySelector('input[name="shortcut-type"]:checked').value;

        // Basic validation
        if (!keyword || !name) {
            alert('Please fill in keyword and name fields.');
            return;
        }

        if (!/^[a-z0-9]+$/.test(keyword)) {
            alert('Keyword can only contain lowercase letters and numbers.');
            return;
        }

        // Check for keyword conflicts
        if (editingShortcut) {
            // When editing, only check for conflict if the keyword has changed
            if (keyword !== editingShortcut && shortcuts[keyword]) {
                alert(`A shortcut with keyword "${keyword}" already exists. Please choose a different keyword.`);
                return;
            }
        } else {
            // When adding new shortcut, check for any existing keyword
            if (shortcuts[keyword]) {
                alert(`A shortcut with keyword "${keyword}" already exists. Please choose a different keyword.`);
                return;
            }
        }

        let shortcutData = {
            name: name,
            enabled: true
        };

        if (shortcutType === 'simple') {
            const url = document.getElementById('shortcut-url').value.trim();
            
            if (!url) {
                alert('Please enter a search URL.');
                return;
            }

            if (!url.includes('%s')) {
                alert('URL must contain %s as a placeholder for the search query.');
                return;
            }

            // Validate URL format
            try {
                new URL(url.replace('%s', 'test'));
            } catch (urlError) {
                alert('Please enter a valid URL.');
                return;
            }

            shortcutData.url = url;
            shortcutData.type = 'simple';
            shortcutData.icon = `https://www.google.com/s2/favicons?domain=${new URL(url.replace('%s', '')).hostname}`;

        } else if (shortcutType === 'advanced') {
            const pageUrl = document.getElementById('advanced-url').value.trim();
            const inputSelector = document.getElementById('input-selector').value.trim();
            const buttonSelector = document.getElementById('button-selector').value.trim();

            if (!pageUrl || !inputSelector || !buttonSelector) {
                alert('Please fill in all advanced configuration fields.');
                return;
            }

            // Validate page URL format
            try {
                new URL(pageUrl);
            } catch (urlError) {
                alert('Please enter a valid page URL.');
                return;
            }

            shortcutData.url = pageUrl;
            shortcutData.type = 'advanced';
            shortcutData.inputSelector = inputSelector;
            shortcutData.buttonSelector = buttonSelector;
            shortcutData.icon = `https://www.google.com/s2/favicons?domain=${new URL(pageUrl).hostname}`;
        }

        // Determine if this is an edit or new shortcut
        const isEditing = editingShortcut !== null;
        const actionText = isEditing ? 'updated' : 'added';

        // Safety check: ensure we have shortcuts loaded before saving
        if (!shortcuts || Object.keys(shortcuts).length === 0) {
            console.warn('Popup: No shortcuts loaded, reloading before save...');
            await loadShortcuts();
            
            // If still no shortcuts, this might be a first-time user
            if (!shortcuts || Object.keys(shortcuts).length === 0) {
                console.log('Popup: No existing shortcuts found, this appears to be first custom shortcut');
                shortcuts = {};
            }
        }

        console.log(`Popup: Adding ${actionText} shortcut "${keyword}" to ${Object.keys(shortcuts).length} existing shortcuts`);
        console.log('Popup: Existing shortcuts before save:', Object.keys(shortcuts).join(', '));

        // If editing and keyword changed, remove the old entry
        if (isEditing && keyword !== editingShortcut) {
            delete shortcuts[editingShortcut];
        }

        // Save shortcut
        shortcuts[keyword] = shortcutData;

        console.log('Popup: Shortcuts after adding new one:', Object.keys(shortcuts).join(', '));

        await saveShortcuts();
        renderShortcuts();
        renderKeywordsHelp();
        closeModal();

        // Show success feedback
        showSuccessFeedback(`Shortcut "${name}" ${actionText} successfully`);

    } catch (error) {
        console.error('Error saving shortcut:', error);
        alert('Failed to save shortcut. Please try again.');
    }
}

// Render keywords help
function renderKeywordsHelp() {
    keywordsHelp.innerHTML = '';
    
    Object.entries(shortcuts)
        .filter(([_, shortcut]) => shortcut.enabled)
        .forEach(([keyword, shortcut]) => {
            const div = document.createElement('div');
            div.className = 'keyword-item';
            div.innerHTML = `
                <code>${keyword}</code>
                <small>${shortcut.name}</small>
            `;
            keywordsHelp.appendChild(div);
        });
}

// Check if this is first time and show helpful hint
async function checkFirstTime() {
    const result = await chrome.storage.sync.get(['firstTime']);
    if (result.firstTime) {
        showFirstTimeHint();
    }
}

// Show first time hint
function showFirstTimeHint() {
    const hint = document.createElement('div');
    hint.className = 'first-time-hint';
    hint.innerHTML = `
        <div class="hint-content">
            <h3>🎉 Welcome to OmniSearch!</h3>
            <p>Try typing <code>os</code> in Chrome's address bar, then press Tab to get started!</p>
            <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">Got it!</button>
        </div>
    `;

    // Add styles
    hint.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px;
        text-align: center;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;

    document.body.insertBefore(hint, document.body.firstChild);

    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (hint.parentNode) {
            hint.remove();
        }
    }, 10000);
}

// Smart Detection Variables
let currentDetectionResult = null;

// Initialize smart detection
async function initializeSmartDetection() {
    try {
        // Get current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            // Hide smart detection for chrome pages
            return;
    
        }

        // Show smart detection section
        const smartSection = document.getElementById('smart-detection-section');
        smartSection.style.display = 'block';

        // Start detection
        await performSmartDetection(tab.id);

    } catch (error) {
        console.error('Popup: Error initializing smart detection:', error);
    }
}

// Perform smart detection on current tab
async function performSmartDetection(tabId) {
    const loadingEl = document.getElementById('detection-loading');
    const resultEl = document.getElementById('detection-result');
    const errorEl = document.getElementById('detection-error');

    // Show loading state
    loadingEl.style.display = 'flex';
    resultEl.style.display = 'none';
    errorEl.style.display = 'none';

    try {
        // Add timeout for content script response
        const response = await Promise.race([
            chrome.tabs.sendMessage(tabId, { action: 'detectSearch' }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Detection timeout')), 5000)
            )
        ]);

        if (response && response.hasSearch && response.bestSearchUrl) {
            // Validate the detected URL
            if (isValidSearchUrl(response.bestSearchUrl)) {
                currentDetectionResult = response;
                showDetectionResult(response);
            } else {
                console.warn('Popup: Invalid search URL detected:', response.bestSearchUrl);
                showDetectionError('Invalid search pattern detected');
            }
        } else {
            showDetectionError();
        }

    } catch (error) {
        console.error('Popup: Error performing smart detection:', error);

        // Handle specific error types
        if (error.message === 'Detection timeout') {
            showDetectionError('Detection timed out - website may not support search');
        } else if (error.message.includes('Could not establish connection')) {
            showDetectionError('Unable to analyze this page type');
        } else {
            showDetectionError();
        }
    }
}

// Validate detected search URL
function isValidSearchUrl(url) {
    try {
        const urlObj = new URL(url);

        // Check if URL contains %s placeholder
        if (!url.includes('%s')) {
            return false;
        }

        // Check if it's a valid HTTP/HTTPS URL
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return false;
        }

        // Check if hostname is valid
        if (!urlObj.hostname || urlObj.hostname.length < 3) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

// Show detection result
function showDetectionResult(result) {
    const loadingEl = document.getElementById('detection-loading');
    const resultEl = document.getElementById('detection-result');
    const errorEl = document.getElementById('detection-error');

    // Hide loading, show result
    loadingEl.style.display = 'none';
    resultEl.style.display = 'block';
    errorEl.style.display = 'none';

    // Populate result data
    document.getElementById('detection-title').textContent = result.websiteName || 'Current Website';
    document.getElementById('detection-description').textContent =
        `Search functionality detected with ${Math.round(result.confidence * 100)}% confidence`;

    document.getElementById('suggested-keyword').textContent = result.suggestedKeyword;
    document.getElementById('detected-url').textContent = result.bestSearchUrl || 'Pattern detected';
    document.getElementById('detected-url').title = result.bestSearchUrl || '';

    // Set confidence bar
    const confidencePercent = Math.round(result.confidence * 100);
    document.getElementById('confidence-fill').style.width = `${confidencePercent}%`;
    document.getElementById('confidence-text').textContent = `${confidencePercent}%`;

    // Set favicon
    const iconEl = document.getElementById('detection-icon');
    iconEl.src = `https://www.google.com/s2/favicons?domain=${new URL(result.bestSearchUrl || window.location.href).hostname}`;
    iconEl.onerror = () => {
        iconEl.src = 'icons/icon16.png';
    };
}

// Show detection error
function showDetectionError(customMessage = null) {
    const loadingEl = document.getElementById('detection-loading');
    const resultEl = document.getElementById('detection-result');
    const errorEl = document.getElementById('detection-error');

    // Hide loading and result, show error
    loadingEl.style.display = 'none';
    resultEl.style.display = 'none';
    errorEl.style.display = 'block';

    // Update error message if custom message provided
    if (customMessage) {
        const errorContent = errorEl.querySelector('.error-content p');
        if (errorContent) {
            errorContent.textContent = customMessage;
        }
    }
}

// Add detected shortcut directly
async function addDetectedShortcut() {
    if (!currentDetectionResult || !currentDetectionResult.bestSearchUrl) {
        alert('No valid search pattern detected');
        return;
    }

    const keyword = currentDetectionResult.suggestedKeyword;
    const name = currentDetectionResult.websiteName;
    const url = currentDetectionResult.bestSearchUrl;

    // Validate inputs
    if (!keyword || !name || !url) {
        alert('Invalid detection data. Please try manual creation.');
        return;
    }

    // Validate keyword format
    if (!/^[a-z0-9]+$/.test(keyword)) {
        alert('Invalid keyword format. Please use the "Edit & Add" option to customize.');
        return;
    }

    // Validate URL
    if (!isValidSearchUrl(url)) {
        alert('Invalid search URL detected. Please use the "Edit & Add" option to fix.');
        return;
    }

    // Check if keyword already exists
    if (shortcuts[keyword]) {
        const overwrite = confirm(`A shortcut with keyword "${keyword}" already exists. Do you want to replace it?`);
        if (!overwrite) return;
    }

    try {
        // Add the shortcut
        shortcuts[keyword] = {
            name: name,
            url: url,
            enabled: true,
            icon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`
        };

        await saveShortcuts();
        renderShortcuts();
        renderKeywordsHelp();

        // Show success feedback
        showSuccessFeedback(`Added "${name}" shortcut with keyword "${keyword}"`);

        // Hide smart detection section
        document.getElementById('smart-detection-section').style.display = 'none';

    } catch (error) {
        console.error('Error adding detected shortcut:', error);
        alert('Failed to add shortcut. Please try again or use manual creation.');
    }
}

// Edit detected shortcut before adding
function editDetectedShortcut() {
    if (!currentDetectionResult || !currentDetectionResult.bestSearchUrl) {
        alert('No valid search pattern detected');
        return;
    }

    // Pre-populate the form with detected values
    document.getElementById('shortcut-keyword').value = currentDetectionResult.suggestedKeyword;
    document.getElementById('shortcut-name').value = currentDetectionResult.websiteName;
    document.getElementById('shortcut-url').value = currentDetectionResult.bestSearchUrl;

    // Open the modal
    openModal();

    // Hide smart detection section
    document.getElementById('smart-detection-section').style.display = 'none';
}

// Show success feedback
function showSuccessFeedback(message) {
    // Create temporary success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: #4caf50;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideDown 0.3s ease;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Functions are already made globally available at the top of the file

// Handle shortcut type change
function handleShortcutTypeChange() {
    const shortcutType = document.querySelector('input[name="shortcut-type"]:checked').value;
    const simpleGroup = document.getElementById('simple-url-group');
    const advancedGroup = document.getElementById('advanced-config-group');

    if (shortcutType === 'simple') {
        simpleGroup.classList.remove('hidden');
        advancedGroup.classList.add('hidden');
        
        // Make simple URL required
        document.getElementById('shortcut-url').required = true;
        document.getElementById('advanced-url').required = false;
        document.getElementById('input-selector').required = false;
        document.getElementById('button-selector').required = false;
    } else {
        simpleGroup.classList.add('hidden');
        advancedGroup.classList.remove('hidden');
        
        // Make advanced fields required
        document.getElementById('shortcut-url').required = false;
        document.getElementById('advanced-url').required = true;
        document.getElementById('input-selector').required = true;
        document.getElementById('button-selector').required = true;
    }
}

// Select element on current tab
async function selectElement(elementType) {
    try {
        // Get current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            alert('Element selection is not available on this page. Please navigate to the target website first.');
            return;
        }

        // Store the element selection state for when popup reopens
        await chrome.storage.local.set({
            pendingElementSelection: {
                type: elementType,
                tabId: tab.id,
                timestamp: Date.now(),
                formData: getCurrentFormData() // Save current form state
            }
        });

        // Disable the button to prevent multiple clicks
        const button = elementType === 'input' ? 
            document.getElementById('select-input-btn') : 
            document.getElementById('select-button-btn');
        
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Click on page...';

        try {
            // Send message to content script to start element selection
            // Note: We don't wait for response here because popup will close
            chrome.tabs.sendMessage(tab.id, {
                action: 'startElementSelection',
                type: elementType
            });

            // Inform user what to do
            showSuccessFeedback(`Click on a ${elementType} element on the webpage, then reopen this popup to continue.`);
            
            // Don't auto-close popup, let user close it manually
            // They need to understand they must reopen it after element selection

        } catch (error) {
            console.error('Error selecting element:', error);
            
            // Clear pending selection on error
            await chrome.storage.local.remove('pendingElementSelection');
            
            if (error.message.includes('Could not establish connection')) {
                alert('Please switch to the target website tab and try again.');
            } else {
                alert('Failed to select element. Please ensure the page is fully loaded and try again.');
            }
            
            // Re-enable the button
            button.disabled = false;
            button.textContent = originalText;
        }

    } catch (error) {
        console.error('Error in selectElement:', error);
        alert('Failed to start element selection. Please try again.');
    }
}

// Validate selector by testing it
async function validateSelector(selector, elementType) {
    if (!selector) return false;

    try {
        // Test if selector is valid CSS
        document.querySelector(selector);
        return true;
    } catch (error) {
        console.warn(`Invalid ${elementType} selector:`, selector, error);
        return false;
    }
}

// Get current form data for element selection persistence
function getCurrentFormData() {
    return {
        keyword: document.getElementById('shortcut-keyword').value,
        name: document.getElementById('shortcut-name').value,
        shortcutType: document.querySelector('input[name="shortcut-type"]:checked')?.value,
        simpleUrl: document.getElementById('shortcut-url').value,
        advancedUrl: document.getElementById('advanced-url').value,
        inputSelector: document.getElementById('input-selector').value,
        buttonSelector: document.getElementById('button-selector').value,
        isEditing: editingShortcut
    };
}

// Restore form data for element selection persistence
function restoreFormData(formData) {
    if (!formData) return;
    
    // Restore basic fields
    document.getElementById('shortcut-keyword').value = formData.keyword || '';
    document.getElementById('shortcut-name').value = formData.name || '';
    document.getElementById('shortcut-url').value = formData.simpleUrl || '';
    document.getElementById('advanced-url').value = formData.advancedUrl || '';
    document.getElementById('input-selector').value = formData.inputSelector || '';
    document.getElementById('button-selector').value = formData.buttonSelector || '';
    
    // Restore editing state
    editingShortcut = formData.isEditing;
    
    // Restore shortcut type
    if (formData.shortcutType) {
        const radio = document.querySelector(`input[name="shortcut-type"][value="${formData.shortcutType}"]`);
        if (radio) {
            radio.checked = true;
            handleShortcutTypeChange();
        }
    }
    
    // Open modal if form had data
    if (formData.keyword || formData.name) {
        openModal();
        
        // Update modal title if editing
        if (formData.isEditing) {
            document.getElementById('modal-title').textContent = 'Edit Shortcut';
            document.getElementById('save-btn').textContent = 'Update';
        }
    }
}

// Check for pending element selection when popup opens
async function checkPendingElementSelection() {
    try {
        const result = await chrome.storage.local.get('pendingElementSelection');
        const pending = result.pendingElementSelection;
        
        if (!pending) return;
        
        // Check if selection is recent (within 30 seconds)
        const timeDiff = Date.now() - pending.timestamp;
        if (timeDiff > 30000) {
            // Clean up old pending selection
            await chrome.storage.local.remove('pendingElementSelection');
            return;
        }
        
        console.log('Found pending element selection:', pending);
        
        // Restore form state
        if (pending.formData) {
            restoreFormData(pending.formData);
        }
        
        // Check for completed selection result
        const selectionResult = await chrome.storage.local.get('elementSelectionResult');
        if (selectionResult.elementSelectionResult) {
            const result = selectionResult.elementSelectionResult;
            console.log('Found completed element selection result:', result);
            
            // Fill in the selector field
            const selectorField = pending.type === 'input' ? 
                document.getElementById('input-selector') : 
                document.getElementById('button-selector');
            
            selectorField.value = result.selector;
            
            // Show success feedback
            showSuccessFeedback(`Selected ${pending.type} element: ${result.description}`);
            
            // Clean up both pending selection and result
            await chrome.storage.local.remove(['pendingElementSelection', 'elementSelectionResult']);
        }
        
    } catch (error) {
        console.error('Error checking pending element selection:', error);
    }
}
