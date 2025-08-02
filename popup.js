// OmniSearch Popup Script
// Handles the settings interface and shortcut management

let shortcuts = {};
let editingShortcut = null;

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
                <input type="checkbox" ${shortcut.enabled ? 'checked' : ''} onchange="toggleShortcut('${keyword}')">
                <span class="toggle-slider"></span>
            </label>
            ${isCustom ? `
                <button class="btn btn-edit" onclick="editShortcut('${keyword}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteShortcut('${keyword}')">Delete</button>
            ` : ''}
        </div>
    `;
    
    return div;
}

// Check if shortcut is a default one
function isDefaultShortcut(keyword) {
    const defaultKeywords = ['drive', 'gmail', 'youtube', 'amazon', 'wikipedia', 'imdb', 'spotify', 'github', 'twitter'];
    return defaultKeywords.includes(keyword);
}

// Toggle shortcut enabled/disabled
async function toggleShortcut(keyword) {
    if (shortcuts[keyword]) {
        shortcuts[keyword].enabled = !shortcuts[keyword].enabled;
        await saveShortcuts();
    }
}

// Edit shortcut
function editShortcut(keyword) {
    editingShortcut = keyword;
    const shortcut = shortcuts[keyword];
    
    document.getElementById('modal-title').textContent = 'Edit Shortcut';
    document.getElementById('shortcut-keyword').value = keyword;
    document.getElementById('shortcut-name').value = shortcut.name;
    document.getElementById('shortcut-url').value = shortcut.url;
    document.getElementById('save-btn').textContent = 'Update';
    
    // Disable keyword field for editing
    document.getElementById('shortcut-keyword').disabled = true;
    
    openModal();
}

// Delete shortcut
async function deleteShortcut(keyword) {
    if (confirm(`Are you sure you want to delete the "${shortcuts[keyword].name}" shortcut?`)) {
        delete shortcuts[keyword];
        await saveShortcuts();
        renderShortcuts();
        renderKeywordsHelp();
    }
}

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
    
    if (!editingShortcut && shortcuts[keyword]) {
        alert('A shortcut with this keyword already exists.');
        return;
    }
    
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

// Make functions globally available
window.toggleShortcut = toggleShortcut;
window.editShortcut = editShortcut;
window.deleteShortcut = deleteShortcut;
