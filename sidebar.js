// OmniSearch Sidebar Script - Simplified and Reliable
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

    // Complete CSS as a string - this ensures it's always available
    const COMPLETE_CSS = `
/* OmniSearch Sidebar Styles - Complete Inline */

/* Body transition for smooth page shifting */
body.omnisearch-sidebar-open {
    margin-right: 400px !important;
    transition: margin-right 0.3s ease-in-out !important;
}

@media (max-width: 768px) {
    body.omnisearch-sidebar-open {
        margin-right: 320px !important;
    }
}

@media (max-width: 480px) {
    body.omnisearch-sidebar-open {
        margin-right: 0 !important;
    }
}

/* Sidebar Container */
#omnisearch-sidebar-container {
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    width: 0 !important;
    height: 100vh !important;
    z-index: 2147483647 !important;
    pointer-events: none !important;
}

/* Sidebar */
#omnisearch-sidebar {
    position: absolute !important;
    top: 0 !important;
    right: 0 !important;
    width: 400px !important;
    height: 100vh !important;
    background: #ffffff !important;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1) !important;
    transform: translateX(100%) !important;
    transition: transform 0.3s ease-in-out !important;
    pointer-events: auto !important;
    overflow: hidden !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 14px !important;
    line-height: 1.4 !important;
    color: #333 !important;
    border: none !important;
    margin: 0 !important;
    padding: 0 !important;
}

#omnisearch-sidebar.omnisearch-sidebar-visible {
    transform: translateX(0) !important;
}

#omnisearch-sidebar.omnisearch-sidebar-hidden {
    transform: translateX(100%) !important;
}

/* Sidebar Content */
.omnisearch-sidebar-content {
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
}

/* Header */
.omnisearch-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 16px 20px !important;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    color: white !important;
    flex-shrink: 0 !important;
}

.omnisearch-logo {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
}

.omnisearch-logo-icon {
    width: 24px !important;
    height: 24px !important;
}

.omnisearch-logo h1 {
    font-size: 18px !important;
    font-weight: 600 !important;
    margin: 0 !important;
    color: white !important;
}

.omnisearch-close-btn {
    background: none !important;
    border: none !important;
    color: white !important;
    font-size: 24px !important;
    cursor: pointer !important;
    padding: 4px 8px !important;
    border-radius: 4px !important;
    transition: background-color 0.2s !important;
}

.omnisearch-close-btn:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
}

/* Tabs */
.omnisearch-tabs {
    display: flex !important;
    background: #f8f9fa !important;
    border-bottom: 1px solid #e9ecef !important;
    flex-shrink: 0 !important;
}

.omnisearch-tab-button {
    flex: 1 !important;
    padding: 12px 16px !important;
    border: none !important;
    background: transparent !important;
    cursor: pointer !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    color: #6c757d !important;
    transition: all 0.2s !important;
}

.omnisearch-tab-button:hover {
    background: #e9ecef !important;
    color: #495057 !important;
}

.omnisearch-tab-button.omnisearch-active {
    background: white !important;
    color: #667eea !important;
    border-bottom: 2px solid #667eea !important;
}

/* Tab Content */
.omnisearch-tab-content {
    flex: 1 !important;
    padding: 20px !important;
    overflow-y: auto !important;
}

.omnisearch-tab-content.omnisearch-hidden {
    display: none !important;
}

/* Sections */
.omnisearch-section {
    margin-bottom: 24px !important;
}

.omnisearch-section:last-child {
    margin-bottom: 0 !important;
}

.omnisearch-section h2 {
    font-size: 16px !important;
    font-weight: 600 !important;
    margin-bottom: 12px !important;
    color: #333 !important;
}

.omnisearch-section-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    margin-bottom: 12px !important;
}

/* Quick Start */
.omnisearch-quick-start {
    background: #f8f9fa !important;
    border-radius: 8px !important;
    padding: 16px !important;
    border-left: 4px solid #667eea !important;
}

.omnisearch-step {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    margin-bottom: 8px !important;
}

.omnisearch-step:last-child {
    margin-bottom: 0 !important;
}

.omnisearch-step-number {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 24px !important;
    height: 24px !important;
    background: #667eea !important;
    color: white !important;
    border-radius: 50% !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    flex-shrink: 0 !important;
}

.omnisearch-step code {
    background: #e9ecef !important;
    padding: 2px 6px !important;
    border-radius: 4px !important;
    font-family: 'Monaco', 'Consolas', monospace !important;
    font-size: 12px !important;
}

.omnisearch-step kbd {
    background: #f8f9fa !important;
    border: 1px solid #dee2e6 !important;
    border-radius: 4px !important;
    padding: 2px 6px !important;
    font-family: inherit !important;
    font-size: 12px !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
}

/* Shortcuts List */
.omnisearch-shortcuts-list {
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
}

.omnisearch-shortcut-item {
    display: flex !important;
    align-items: center !important;
    padding: 12px !important;
    background: #f8f9fa !important;
    border-radius: 8px !important;
    border: 1px solid #e9ecef !important;
    transition: all 0.2s !important;
}

.omnisearch-shortcut-item:hover {
    background: #e9ecef !important;
}

.omnisearch-shortcut-icon {
    width: 20px !important;
    height: 20px !important;
    margin-right: 12px !important;
    border-radius: 4px !important;
}

.omnisearch-shortcut-info {
    flex: 1 !important;
}

.omnisearch-shortcut-name {
    font-weight: 500 !important;
    color: #333 !important;
    margin-bottom: 2px !important;
}

.omnisearch-shortcut-keyword {
    font-size: 12px !important;
    color: #6c757d !important;
    font-family: 'Monaco', 'Consolas', monospace !important;
}

.omnisearch-shortcut-actions {
    display: flex !important;
    gap: 8px !important;
    align-items: center !important;
}

/* Buttons */
.omnisearch-btn {
    padding: 8px 16px !important;
    border: none !important;
    border-radius: 6px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: all 0.2s !important;
    text-decoration: none !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
}

.omnisearch-btn-primary {
    background: #667eea !important;
    color: white !important;
}

.omnisearch-btn-primary:hover {
    background: #5a6fd8 !important;
}

.omnisearch-btn-secondary {
    background: #6c757d !important;
    color: white !important;
}

.omnisearch-btn-secondary:hover {
    background: #5a6268 !important;
}

/* Help Content */
.omnisearch-help-content {
    line-height: 1.6 !important;
}

.omnisearch-help-item {
    margin-bottom: 20px !important;
}

.omnisearch-help-item h3 {
    font-size: 14px !important;
    font-weight: 600 !important;
    margin-bottom: 8px !important;
    color: #333 !important;
}

.omnisearch-help-item ul {
    list-style: none !important;
    padding-left: 0 !important;
    margin: 0 !important;
}

.omnisearch-help-item li {
    padding: 4px 0 !important;
    padding-left: 16px !important;
    position: relative !important;
}

.omnisearch-help-item li:before {
    content: "→" !important;
    position: absolute !important;
    left: 0 !important;
    color: #667eea !important;
    font-weight: bold !important;
}

.omnisearch-keywords-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)) !important;
    gap: 8px !important;
    margin-top: 8px !important;
}

.omnisearch-keyword-item {
    background: #f8f9fa !important;
    padding: 8px !important;
    border-radius: 6px !important;
    text-align: center !important;
    border: 1px solid #e9ecef !important;
}

.omnisearch-keyword-item code {
    display: block !important;
    margin-bottom: 4px !important;
    font-weight: 600 !important;
    background: #e9ecef !important;
    padding: 2px 6px !important;
    border-radius: 4px !important;
    font-family: 'Monaco', 'Consolas', monospace !important;
    font-size: 12px !important;
}

.omnisearch-keyword-item small {
    color: #6c757d !important;
    font-size: 11px !important;
}

/* Reset all potential inherited styles */
#omnisearch-sidebar * {
    box-sizing: border-box !important;
    font-family: inherit !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    #omnisearch-sidebar {
        width: 320px !important;
    }
}

@media (max-width: 480px) {
    #omnisearch-sidebar {
        width: 100vw !important;
    }
}
    `;

    // Inject CSS immediately
    function injectCSS() {
        if (document.getElementById('omnisearch-sidebar-styles-complete')) {
            return; // Already injected
        }
        
        const style = document.createElement('style');
        style.id = 'omnisearch-sidebar-styles-complete';
        style.textContent = COMPLETE_CSS;
        document.head.appendChild(style);
        
        console.log('OmniSearch: CSS injected successfully');
    }

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
            </div>
        `;
    }

    // Inject sidebar into page
    function injectSidebar() {
        if (sidebarContainer) {
            return; // Already injected
        }

        // Inject CSS first
        injectCSS();
        
        // Create container
        sidebarContainer = document.createElement('div');
        sidebarContainer.id = 'omnisearch-sidebar-container';
        sidebarContainer.innerHTML = createSidebarHTML();
        
        // Add to page
        document.body.appendChild(sidebarContainer);
        
        // Setup event listeners
        setupSidebarEventListeners();
        
        // Load shortcuts
        loadShortcuts();
        
        console.log('OmniSearch: Sidebar injected successfully');
    }

    // Setup event listeners for sidebar
    function setupSidebarEventListeners() {
        const sidebar = document.getElementById('omnisearch-sidebar');
        const closeBtn = document.getElementById('omnisearch-close-btn');

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
        
        // Add body class to shift page content
        document.body.classList.add('omnisearch-sidebar-open');
        
        isOpen = true;
        
        // Refresh shortcuts when opening
        loadShortcuts();
        
        console.log('OmniSearch: Sidebar opened');
    }

    // Close sidebar
    function closeSidebar() {
        const sidebar = document.getElementById('omnisearch-sidebar');
        if (sidebar) {
            sidebar.classList.remove('omnisearch-sidebar-visible');
            sidebar.classList.add('omnisearch-sidebar-hidden');
        }
        
        // Remove body class to restore page content
        document.body.classList.remove('omnisearch-sidebar-open');
        
        isOpen = false;
        
        console.log('OmniSearch: Sidebar closed');
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
        `;

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