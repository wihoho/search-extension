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
        document.getElementById('shortcut-url').value = shortcut.url;
        document.getElementById('save-btn').textContent = 'Update';

        // Disable keyword field for editing
        document.getElementById('shortcut-keyword').disabled = true;

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
});

// Load shortcuts from background script
async function loadShortcuts() {
    return new Promise((resolve) => {
        console.log('Popup: Requesting shortcuts from background script');
        chrome.runtime.sendMessage({ action: 'getShortcuts' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Popup: Error communicating with background script:', chrome.runtime.lastError);
                shortcuts = {};
            } else {
                console.log('Popup: Received shortcuts:', response);
                shortcuts = response.shortcuts || {};
            }
            resolve();
        });
    });
}

// Save shortcuts to storage
async function saveShortcuts() {
    return new Promise((resolve) => {
        console.log('Popup: Saving shortcuts to background script');
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
    div.className = 'shortcut-item';

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
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();

    try {
        const keyword = document.getElementById('shortcut-keyword').value.toLowerCase().trim();
        const name = document.getElementById('shortcut-name').value.trim();
        const url = document.getElementById('shortcut-url').value.trim();

        // Validation
        if (!keyword || !name || !url) {
            alert('Please fill in all fields.');
            return;
        }

        if (!/^[a-z0-9]+$/.test(keyword)) {
            alert('Keyword can only contain lowercase letters and numbers.');
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

        if (!editingShortcut && shortcuts[keyword]) {
            alert('A shortcut with this keyword already exists.');
            return;
        }

        // Determine if this is an edit or new shortcut
        const isEditing = editingShortcut !== null;
        const actionText = isEditing ? 'updated' : 'added';

        // Save shortcut
        shortcuts[keyword] = {
            name: name,
            url: url,
            enabled: true,
            icon: `https://www.google.com/s2/favicons?domain=${new URL(url.replace('%s', '')).hostname}`
        };

        await saveShortcuts();
        renderShortcuts();
        renderKeywordsHelp();
        closeModal();

        // Show success feedback
        showSuccessFeedback(`Successfully ${actionText} "${name}" shortcut with keyword "${keyword}"`);

    } catch (error) {
        console.error('Error saving shortcut:', error);
        alert('Failed to save shortcut. Please check your inputs and try again.');
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
