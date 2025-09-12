// OmniSearch Sidebar Script
// Injects and manages the sidebar interface on web pages

(function() {
    'use strict';

    // Prevent multiple injections
    if (window.omniSearchSidebarInjected) {
        return;
    }
    window.omniSearchSidebarInjected = true;

    let sidebarContainer = null;
    let isOpen = false;
    let shortcuts = {};

    // Create sidebar HTML
    function createSidebarHTML() {
        return `
            <div id="omnisearch-sidebar" class="omnisearch-sidebar-hidden">
                <div class="omnisearch-sidebar-content">
                    <div class="omnisearch-header">
                        <div class="omnisearch-logo">
                            <img src="${chrome.runtime.getURL('icons/icon48.png')}" alt="OmniSearch" class="omnisearch-logo-icon">
                            <h1>OmniSearch</h1>
                        </div>
                        <button class="omnisearch-close-btn" id="omnisearch-close-btn">&times;</button>
                    </div>

                    <div class="omnisearch-tabs">
                        <button class="omnisearch-tab-button omnisearch-active" data-tab="shortcuts">Shortcuts</button>
                        <button class="omnisearch-tab-button" data-tab="help">Help</button>
                    </div>

                    <div class="omnisearch-tab-content" id="omnisearch-shortcuts-tab">
                        <div class="omnisearch-section">
                            <h2>Quick Start</h2>
                            <div class="omnisearch-quick-start">
                                <div class="omnisearch-step">
                                    <span class="omnisearch-step-number">1</span>
                                    <span>Type <code>os</code> in address bar</span>
                                </div>
                                <div class="omnisearch-step">
                                    <span class="omnisearch-step-number">2</span>
                                    <span>Press <kbd>Tab</kbd> or <kbd>Space</kbd></span>
                                </div>
                                <div class="omnisearch-step">
                                    <span class="omnisearch-step-number">3</span>
                                    <span>Type keyword + search term</span>
                                </div>
                            </div>
                        </div>

                        <div class="omnisearch-section">
                            <div class="omnisearch-section-header">
                                <h2>Search Shortcuts</h2>
                                <button class="omnisearch-btn omnisearch-btn-primary" id="omnisearch-add-shortcut-btn">+ Add Custom</button>
                            </div>
                            <div class="omnisearch-shortcuts-list" id="omnisearch-shortcuts-list">
                                <!-- Shortcuts will be populated by JavaScript -->
                            </div>
                        </div>
                    </div>

                    <div class="omnisearch-tab-content omnisearch-hidden" id="omnisearch-help-tab">
                        <div class="omnisearch-section">
                            <h2>How to Use OmniSearch</h2>
                            <div class="omnisearch-help-content">
                                <div class="omnisearch-help-item">
                                    <h3>Basic Usage</h3>
                                    <p>Type <code>os</code> in Chrome's address bar, then press Tab or Space to activate OmniSearch.</p>
                                </div>
                                
                                <div class="omnisearch-help-item">
                                    <h3>Search Examples</h3>
                                    <ul>
                                        <li><code>os youtube cats</code> - Search YouTube for "cats"</li>
                                        <li><code>os drive quarterly report</code> - Search Google Drive for "quarterly report"</li>
                                        <li><code>os amazon laptop</code> - Search Amazon for "laptop"</li>
                                    </ul>
                                </div>

                                <div class="omnisearch-help-item">
                                    <h3>Available Keywords</h3>
                                    <div class="omnisearch-keywords-grid" id="omnisearch-keywords-help">
                                        <!-- Keywords will be populated by JavaScript -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Add Custom Shortcut Modal -->
                <div class="omnisearch-modal omnisearch-hidden" id="omnisearch-add-shortcut-modal">
                    <div class="omnisearch-modal-content">
                        <div class="omnisearch-modal-header">
                            <h3 id="omnisearch-modal-title">Add Custom Shortcut</h3>
                            <button class="omnisearch-close-btn" id="omnisearch-close-modal">&times;</button>
                        </div>
                        <form id="omnisearch-shortcut-form">
                            <div class="omnisearch-form-group">
                                <label for="omnisearch-shortcut-keyword">Keyword</label>
                                <input type="text" id="omnisearch-shortcut-keyword" placeholder="e.g., reddit" required>
                                <small>Short, memorable keyword to trigger the search</small>
                            </div>
                            <div class="omnisearch-form-group">
                                <label for="omnisearch-shortcut-name">Website Name</label>
                                <input type="text" id="omnisearch-shortcut-name" placeholder="e.g., Reddit" required>
                            </div>
                            <div class="omnisearch-form-group">
                                <label for="omnisearch-shortcut-url">Search URL</label>
                                <input type="url" id="omnisearch-shortcut-url" placeholder="https://www.reddit.com/search/?q=%s" required>
                                <small>Use %s where the search query should be inserted</small>
                            </div>
                            
                            <div class="omnisearch-form-actions">
                                <button type="button" class="omnisearch-btn omnisearch-btn-secondary" id="omnisearch-cancel-btn">Cancel</button>
                                <button type="submit" class="omnisearch-btn omnisearch-btn-primary" id="omnisearch-save-btn">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    // Inject sidebar into page
    function injectSidebar() {
        if (sidebarContainer) {
            return; // Already injected
        }

        // Create container
        sidebarContainer = document.createElement('div');
        sidebarContainer.id = 'omnisearch-sidebar-container';
        sidebarContainer.innerHTML = createSidebarHTML();
        
        // Inject CSS
        injectCSS();
        
        // Add to page
        document.body.appendChild(sidebarContainer);
        
        // Setup event listeners
        setupSidebarEventListeners();
        
        // Load shortcuts
        loadShortcuts();
    }

    // Inject CSS styles
    function injectCSS() {
        if (document.getElementById('omnisearch-sidebar-styles')) {
            return; // Already injected
        }

        const link = document.createElement('link');
        link.id = 'omnisearch-sidebar-styles';
        link.rel = 'stylesheet';
        link.href = chrome.runtime.getURL('sidebar.css');
        document.head.appendChild(link);
    }

    // Setup event listeners for sidebar
    function setupSidebarEventListeners() {
        const sidebar = document.getElementById('omnisearch-sidebar');
        const closeBtn = document.getElementById('omnisearch-close-btn');
        const addShortcutBtn = document.getElementById('omnisearch-add-shortcut-btn');
        const modal = document.getElementById('omnisearch-add-shortcut-modal');
        const closeModalBtn = document.getElementById('omnisearch-close-modal');
        const cancelBtn = document.getElementById('omnisearch-cancel-btn');
        const shortcutForm = document.getElementById('omnisearch-shortcut-form');

        // Close sidebar
        closeBtn.addEventListener('click', closeSidebar);

        // Tab switching
        const tabButtons = document.querySelectorAll('.omnisearch-tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                switchTab(tabName);
            });
        });

        // Add shortcut
        addShortcutBtn.addEventListener('click', openModal);

        // Modal controls
        closeModalBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        shortcutForm.addEventListener('submit', handleFormSubmit);

        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Prevent sidebar from closing when clicking inside
        sidebar.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (isOpen && !sidebar.contains(e.target)) {
                closeSidebar();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ESC to close
            if (e.key === 'Escape' && isOpen) {
                closeSidebar();
            }
        });
    }

    // Open sidebar
    function openSidebar() {
        if (!sidebarContainer) {
            injectSidebar();
        }
        
        const sidebar = document.getElementById('omnisearch-sidebar');
        sidebar.classList.remove('omnisearch-sidebar-hidden');
        sidebar.classList.add('omnisearch-sidebar-visible');
        isOpen = true;
        
        // Refresh shortcuts when opening
        loadShortcuts();
    }

    // Close sidebar
    function closeSidebar() {
        const sidebar = document.getElementById('omnisearch-sidebar');
        if (sidebar) {
            sidebar.classList.remove('omnisearch-sidebar-visible');
            sidebar.classList.add('omnisearch-sidebar-hidden');
        }
        isOpen = false;
    }

    // Toggle sidebar
    function toggleSidebar() {
        if (isOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    // Switch tabs
    function switchTab(tabName) {
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.omnisearch-tab-button');
        tabButtons.forEach(btn => {
            btn.classList.toggle('omnisearch-active', btn.dataset.tab === tabName);
        });

        // Update tab content
        const tabContents = document.querySelectorAll('.omnisearch-tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('omnisearch-hidden', content.id !== `omnisearch-${tabName}-tab`);
        });
    }

    // Load shortcuts from background script
    function loadShortcuts() {
        chrome.runtime.sendMessage({ action: 'getShortcuts' }, (response) => {
            if (response && response.shortcuts) {
                shortcuts = response.shortcuts;
                renderShortcuts();
                renderKeywordsHelp();
            }
        });
    }

    // Render shortcuts list
    function renderShortcuts() {
        const shortcutsList = document.getElementById('omnisearch-shortcuts-list');
        if (!shortcutsList) return;

        shortcutsList.innerHTML = '';

        Object.entries(shortcuts).forEach(([keyword, shortcut]) => {
            const shortcutElement = createShortcutElement(keyword, shortcut);
            shortcutsList.appendChild(shortcutElement);
        });
    }

    // Create shortcut element
    function createShortcutElement(keyword, shortcut) {
        const div = document.createElement('div');
        div.className = 'omnisearch-shortcut-item';

        div.innerHTML = `
            <img src="${shortcut.icon || chrome.runtime.getURL('icons/icon16.png')}" alt="${shortcut.name}" class="omnisearch-shortcut-icon" onerror="this.src='${chrome.runtime.getURL('icons/icon16.png')}'">
            <div class="omnisearch-shortcut-info">
                <div class="omnisearch-shortcut-name">${shortcut.name}</div>
                <div class="omnisearch-shortcut-keyword">${keyword}</div>
            </div>
            <div class="omnisearch-shortcut-actions">
                <label class="omnisearch-toggle-switch">
                    <input type="checkbox" ${shortcut.enabled ? 'checked' : ''}>
                    <span class="omnisearch-toggle-slider"></span>
                </label>
                <button class="omnisearch-btn omnisearch-btn-edit" onclick="editShortcut('${keyword}')">Edit</button>
                <button class="omnisearch-btn omnisearch-btn-danger" onclick="deleteShortcut('${keyword}')">Delete</button>
            </div>
        `;

        // Add toggle functionality
        const toggle = div.querySelector('input[type="checkbox"]');
        toggle.addEventListener('change', () => {
            toggleShortcut(keyword);
        });

        return div;
    }

    // Render keywords help
    function renderKeywordsHelp() {
        const keywordsHelp = document.getElementById('omnisearch-keywords-help');
        if (!keywordsHelp) return;

        keywordsHelp.innerHTML = '';

        Object.entries(shortcuts).forEach(([keyword, shortcut]) => {
            if (shortcut.enabled) {
                const keywordItem = document.createElement('div');
                keywordItem.className = 'omnisearch-keyword-item';
                keywordItem.innerHTML = `
                    <code>${keyword}</code>
                    <small>${shortcut.name}</small>
                `;
                keywordsHelp.appendChild(keywordItem);
            }
        });
    }

    // Modal functions
    function openModal() {
        const modal = document.getElementById('omnisearch-add-shortcut-modal');
        modal.classList.remove('omnisearch-hidden');
    }

    function closeModal() {
        const modal = document.getElementById('omnisearch-add-shortcut-modal');
        modal.classList.add('omnisearch-hidden');
        
        // Reset form
        const form = document.getElementById('omnisearch-shortcut-form');
        form.reset();
    }

    // Handle form submission
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const keyword = document.getElementById('omnisearch-shortcut-keyword').value.trim();
        const name = document.getElementById('omnisearch-shortcut-name').value.trim();
        const url = document.getElementById('omnisearch-shortcut-url').value.trim();

        if (!keyword || !name || !url) {
            alert('Please fill in all fields');
            return;
        }

        if (!url.includes('%s')) {
            alert('URL must contain %s placeholder for the search term');
            return;
        }

        // Add shortcut
        const newShortcut = {
            name: name,
            url: url,
            enabled: true,
            icon: null
        };

        shortcuts[keyword] = newShortcut;
        
        // Save to storage
        chrome.runtime.sendMessage({
            action: 'updateShortcuts',
            shortcuts: shortcuts
        }, (response) => {
            if (response && response.success) {
                renderShortcuts();
                renderKeywordsHelp();
                closeModal();
            } else {
                alert('Failed to save shortcut');
            }
        });
    }

    // Shortcut management functions (global scope)
    window.toggleShortcut = function(keyword) {
        if (shortcuts[keyword]) {
            shortcuts[keyword].enabled = !shortcuts[keyword].enabled;
            
            chrome.runtime.sendMessage({
                action: 'updateShortcuts',
                shortcuts: shortcuts
            }, (response) => {
                if (response && response.success) {
                    renderKeywordsHelp();
                }
            });
        }
    };

    window.editShortcut = function(keyword) {
        // Simple edit - just show current values
        const shortcut = shortcuts[keyword];
        if (shortcut) {
            document.getElementById('omnisearch-modal-title').textContent = 'Edit Shortcut';
            document.getElementById('omnisearch-shortcut-keyword').value = keyword;
            document.getElementById('omnisearch-shortcut-name').value = shortcut.name;
            document.getElementById('omnisearch-shortcut-url').value = shortcut.url;
            openModal();
        }
    };

    window.deleteShortcut = function(keyword) {
        const shortcut = shortcuts[keyword];
        if (shortcut && confirm(`Delete "${shortcut.name}" shortcut?`)) {
            delete shortcuts[keyword];
            
            chrome.runtime.sendMessage({
                action: 'updateShortcuts',
                shortcuts: shortcuts
            }, (response) => {
                if (response && response.success) {
                    renderShortcuts();
                    renderKeywordsHelp();
                }
            });
        }
    };

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggleSidebar') {
            toggleSidebar();
        } else if (request.action === 'openSidebar') {
            openSidebar();
        } else if (request.action === 'closeSidebar') {
            closeSidebar();
        }
    });

})();