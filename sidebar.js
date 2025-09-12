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

/* Shortcut Type Label */
.omnisearch-shortcut-type {
    font-size: 10px !important;
    color: #6c757d !important;
    background: #f8f9fa !important;
    padding: 2px 6px !important;
    border-radius: 3px !important;
    margin-top: 2px !important;
}

.omnisearch-advanced-shortcut .omnisearch-shortcut-type {
    background: #e3f2fd !important;
    color: #1976d2 !important;
}

/* Toggle Switch */
.omnisearch-toggle-switch {
    position: relative !important;
    display: inline-block !important;
    width: 40px !important;
    height: 20px !important;
}

.omnisearch-toggle-switch input {
    opacity: 0 !important;
    width: 0 !important;
    height: 0 !important;
}

.omnisearch-toggle-slider {
    position: absolute !important;
    cursor: pointer !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background-color: #ccc !important;
    transition: .4s !important;
    border-radius: 20px !important;
}

.omnisearch-toggle-slider:before {
    position: absolute !important;
    content: "" !important;
    height: 16px !important;
    width: 16px !important;
    left: 2px !important;
    bottom: 2px !important;
    background-color: white !important;
    transition: .4s !important;
    border-radius: 50% !important;
}

input:checked + .omnisearch-toggle-slider {
    background-color: #667eea !important;
}

input:checked + .omnisearch-toggle-slider:before {
    transform: translateX(20px) !important;
}

/* Edit/Delete Buttons */
.omnisearch-btn-edit {
    background: #f8f9fa !important;
    color: #495057 !important;
    border: 1px solid #dee2e6 !important;
    padding: 4px 8px !important;
    font-size: 12px !important;
}

.omnisearch-btn-edit:hover {
    background: #e9ecef !important;
    color: #495057 !important;
}

.omnisearch-btn-danger {
    background: #dc3545 !important;
    color: white !important;
    border: 1px solid #dc3545 !important;
    padding: 4px 8px !important;
    font-size: 12px !important;
}

.omnisearch-btn-danger:hover {
    background: #c82333 !important;
    border-color: #bd2130 !important;
}

/* Modal Styles */
.omnisearch-modal-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: rgba(0, 0, 0, 0.5) !important;
    z-index: 2147483647 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    opacity: 0 !important;
    transition: opacity 0.3s ease !important;
    pointer-events: auto !important;
}

.omnisearch-modal-overlay.omnisearch-modal-show {
    opacity: 1 !important;
}

.omnisearch-modal {
    background: white !important;
    border-radius: 8px !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
    width: 90% !important;
    max-width: 400px !important;
    max-height: 90vh !important;
    overflow-y: auto !important;
    transform: scale(0.8) !important;
    transition: transform 0.3s ease !important;
    color: #333 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
}

.omnisearch-modal-show .omnisearch-modal {
    transform: scale(1) !important;
}

.omnisearch-modal-wide {
    max-width: 500px !important;
}

.omnisearch-modal-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 16px 20px !important;
    border-bottom: 1px solid #e9ecef !important;
}

.omnisearch-modal-header h3 {
    margin: 0 !important;
    font-size: 18px !important;
    font-weight: 600 !important;
    color: #333 !important;
}

.omnisearch-modal-close {
    background: none !important;
    border: none !important;
    font-size: 24px !important;
    cursor: pointer !important;
    color: #6c757d !important;
    padding: 0 !important;
    width: 30px !important;
    height: 30px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 4px !important;
}

.omnisearch-modal-close:hover {
    background: #f8f9fa !important;
    color: #495057 !important;
}

.omnisearch-modal-body {
    padding: 20px !important;
}

.omnisearch-form-group {
    margin-bottom: 16px !important;
}

.omnisearch-form-group:last-child {
    margin-bottom: 0 !important;
}

.omnisearch-form-group label {
    display: block !important;
    margin-bottom: 6px !important;
    font-weight: 500 !important;
    color: #333 !important;
    font-size: 14px !important;
}

.omnisearch-form-group input {
    width: 100% !important;
    padding: 8px 12px !important;
    border: 1px solid #dee2e6 !important;
    border-radius: 4px !important;
    font-size: 14px !important;
    color: #495057 !important;
    box-sizing: border-box !important;
}

.omnisearch-form-group input:focus {
    outline: none !important;
    border-color: #667eea !important;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1) !important;
}

.omnisearch-form-group small {
    display: block !important;
    margin-top: 4px !important;
    font-size: 12px !important;
    color: #6c757d !important;
}

.omnisearch-modal-footer {
    display: flex !important;
    gap: 8px !important;
    justify-content: flex-end !important;
    padding: 16px 20px !important;
    border-top: 1px solid #e9ecef !important;
    background: #f8f9fa !important;
}

/* Notification Styles */
.omnisearch-notification {
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    padding: 12px 16px !important;
    border-radius: 6px !important;
    color: white !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    z-index: 2147483648 !important;
    transform: translateX(100%) !important;
    transition: transform 0.3s ease !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
    max-width: 300px !important;
}

.omnisearch-notification-show {
    transform: translateX(0) !important;
}

.omnisearch-notification-success {
    background: #28a745 !important;
}

.omnisearch-notification-error {
    background: #dc3545 !important;
}

.omnisearch-notification-info {
    background: #17a2b8 !important;
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

.omnisearch-btn-small {
    padding: 6px 12px !important;
    font-size: 12px !important;
}

.omnisearch-add-button-group {
    display: flex !important;
    gap: 8px !important;
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
        const logoIconUrl = typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.getURL('icons/icon48.png') : './icons/icon48.png';
        
        return `
            <div id="omnisearch-sidebar" class="omnisearch-sidebar-hidden">
                <div class="omnisearch-sidebar-content">
                    <div class="omnisearch-header">
                        <div class="omnisearch-logo">
                            <img src="${logoIconUrl}" alt="OmniSearch" class="omnisearch-logo-icon">
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
                                <div class="omnisearch-add-button-group">
                                    <button class="omnisearch-btn omnisearch-btn-primary omnisearch-btn-small" id="omnisearch-add-simple-btn">+ Simple</button>
                                    <button class="omnisearch-btn omnisearch-btn-secondary omnisearch-btn-small" id="omnisearch-add-advanced-btn">+ Advanced</button>
                                </div>
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

        // Add shortcut buttons
        const addSimpleBtn = document.getElementById('omnisearch-add-simple-btn');
        const addAdvancedBtn = document.getElementById('omnisearch-add-advanced-btn');

        if (addSimpleBtn) {
            addSimpleBtn.addEventListener('click', () => addNewShortcut('simple'));
        }

        if (addAdvancedBtn) {
            addAdvancedBtn.addEventListener('click', () => addNewShortcut('advanced'));
        }

        // Event delegation for shortcut actions (edit, delete, toggle)
        const shortcutsList = document.getElementById('omnisearch-shortcuts-list');
        if (shortcutsList) {
            shortcutsList.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const keyword = e.target.dataset.keyword;
                
                if (action && keyword) {
                    switch (action) {
                        case 'edit':
                            editShortcut(keyword);
                            break;
                        case 'delete':
                            deleteShortcut(keyword);
                            break;
                    }
                }
            });

            shortcutsList.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox' && e.target.dataset.action === 'toggle') {
                    const keyword = e.target.dataset.keyword;
                    if (keyword) {
                        toggleShortcut(keyword);
                    }
                }
            });
        }

        // Global event delegation for modal actions
        document.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                switch (action) {
                    case 'close-modal':
                        closeModal(e.target);
                        break;
                    case 'save-simple-edit':
                        const originalKeyword = e.target.dataset.originalKeyword;
                        saveSimpleEdit(originalKeyword, e.target);
                        break;
                    case 'save-advanced-edit':
                        const originalKeywordAdv = e.target.dataset.originalKeyword;
                        saveAdvancedEdit(originalKeywordAdv, e.target);
                        break;
                    case 'save-new-simple':
                        saveNewSimple(e.target);
                        break;
                    case 'save-new-advanced':
                        saveNewAdvanced(e.target);
                        break;
                }
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
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: 'getShortcuts' }, (response) => {
                if (response && response.shortcuts) {
                    shortcuts = response.shortcuts;
                    renderShortcuts();
                    renderKeywordsHelp();
                }
            });
        } else {
            // For testing environments, use mock data
            console.log('Loading mock shortcuts for testing');
            shortcuts = {
                'ai': {
                    name: 'AI Studio',
                    keyword: 'ai',
                    type: 'advanced',
                    url: 'https://aistudio.google.com/prompts/new_chat',
                    inputSelector: 'textarea',
                    buttonSelector: 'button[aria-label*="Run"]:not([disabled])',
                    enabled: true,
                    icon: 'https://www.gstatic.com/a/images/brand/project-wordmark/bard-64.png'
                },
                'youtube': {
                    name: 'YouTube',
                    url: 'https://www.youtube.com/results?search_query=%s',
                    enabled: true,
                    type: 'simple',
                    icon: 'https://www.youtube.com/favicon.ico'
                },
                'drive': {
                    name: 'Google Drive',
                    url: 'https://drive.google.com/drive/search?q=%s',
                    enabled: true,
                    type: 'simple',
                    icon: 'https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png'
                },
                'gmail': {
                    name: 'Gmail',
                    url: 'https://mail.google.com/mail/u/0/#search/%s',
                    enabled: false,
                    type: 'simple',
                    icon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico'
                }
            };
            renderShortcuts();
            renderKeywordsHelp();
        }
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
        div.className = `omnisearch-shortcut-item${shortcut.type === 'advanced' ? ' omnisearch-advanced-shortcut' : ''}`;
        div.dataset.keyword = keyword; // Store keyword in data attribute

        const typeLabel = shortcut.type === 'advanced' ? 'Advanced' : 'Simple';
        
        // Get icon URL with fallback
        const iconUrl = shortcut.icon || (typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.getURL('icons/icon16.png') : './icons/icon16.png');
        const fallbackIcon = typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.getURL('icons/icon16.png') : './icons/icon16.png';
        
        div.innerHTML = `
            <img src="${iconUrl}" alt="${shortcut.name}" class="omnisearch-shortcut-icon" onerror="this.src='${fallbackIcon}'">
            <div class="omnisearch-shortcut-info">
                <div class="omnisearch-shortcut-name">${shortcut.name}</div>
                <div class="omnisearch-shortcut-keyword">${keyword}</div>
                <div class="omnisearch-shortcut-type">${typeLabel}</div>
            </div>
            <div class="omnisearch-shortcut-actions">
                <label class="omnisearch-toggle-switch">
                    <input type="checkbox" ${shortcut.enabled ? 'checked' : ''} data-action="toggle" data-keyword="${keyword}">
                    <span class="omnisearch-toggle-slider"></span>
                </label>
                <button class="omnisearch-btn omnisearch-btn-edit" data-action="edit" data-keyword="${keyword}">Edit</button>
                <button class="omnisearch-btn omnisearch-btn-danger" data-action="delete" data-keyword="${keyword}">Delete</button>
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

    // Toggle shortcut enabled/disabled
    function toggleShortcut(keyword) {
        if (shortcuts[keyword]) {
            shortcuts[keyword].enabled = !shortcuts[keyword].enabled;
            saveShortcuts();
            renderShortcuts();
            renderKeywordsHelp();
        }
    }

    // Edit shortcut - open a simple edit modal
    function editShortcut(keyword) {
        const shortcut = shortcuts[keyword];
        if (!shortcut) return;

        if (shortcut.type === 'advanced') {
            openAdvancedEditModal(keyword, shortcut);
        } else {
            openSimpleEditModal(keyword, shortcut);
        }
    }

    // Delete shortcut with confirmation
    function deleteShortcut(keyword) {
        const shortcut = shortcuts[keyword];
        if (!shortcut) return;

        if (confirm(`Are you sure you want to delete the "${shortcut.name}" shortcut?`)) {
            delete shortcuts[keyword];
            saveShortcuts();
            renderShortcuts();
            renderKeywordsHelp();
            showNotification(`Deleted "${shortcut.name}" shortcut`, 'success');
        }
    }

    // Save shortcuts to background script
    function saveShortcuts() {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
                action: 'updateShortcuts',
                shortcuts: shortcuts
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error saving shortcuts:', chrome.runtime.lastError);
                    showNotification('Failed to save changes', 'error');
                }
            });
        } else {
            // For testing environments, just log the action
            console.log('Mock save shortcuts:', shortcuts);
            showNotification('Changes saved (test mode)', 'success');
        }
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `omnisearch-notification omnisearch-notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('omnisearch-notification-show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('omnisearch-notification-show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Open simple edit modal
    function openSimpleEditModal(keyword, shortcut) {
        const modal = createSimpleEditModal(keyword, shortcut);
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('omnisearch-modal-show');
            modal.querySelector('input').focus();
        }, 10);
    }

    // Open advanced edit modal  
    function openAdvancedEditModal(keyword, shortcut) {
        const modal = createAdvancedEditModal(keyword, shortcut);
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('omnisearch-modal-show');
            modal.querySelector('input').focus();
        }, 10);
    }

    // Create simple edit modal
    function createSimpleEditModal(keyword, shortcut) {
        const modal = document.createElement('div');
        modal.className = 'omnisearch-modal-overlay';
        
        modal.innerHTML = `
            <div class="omnisearch-modal">
                <div class="omnisearch-modal-header">
                    <h3>Edit Simple Shortcut</h3>
                    <button class="omnisearch-modal-close">&times;</button>
                </div>
                <div class="omnisearch-modal-body">
                    <div class="omnisearch-form-group">
                        <label>Keyword:</label>
                        <input type="text" id="edit-keyword" value="${keyword}" placeholder="e.g., youtube">
                    </div>
                    <div class="omnisearch-form-group">
                        <label>Name:</label>
                        <input type="text" id="edit-name" value="${shortcut.name}" placeholder="e.g., YouTube">
                    </div>
                    <div class="omnisearch-form-group">
                        <label>Search URL:</label>
                        <input type="text" id="edit-url" value="${shortcut.url}" placeholder="e.g., https://youtube.com/results?search_query=%s">
                        <small>Use %s as placeholder for search terms</small>
                    </div>
                </div>
                <div class="omnisearch-modal-footer">
                    <button class="omnisearch-btn omnisearch-btn-secondary" data-action="close-modal">Cancel</button>
                    <button class="omnisearch-btn omnisearch-btn-primary" data-action="save-simple-edit" data-original-keyword="${keyword}">Save</button>
                </div>
            </div>
        `;

        // Add event listeners
        const closeBtn = modal.querySelector('.omnisearch-modal-close');
        closeBtn.addEventListener('click', () => closeModal(closeBtn));
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(closeBtn);
            }
        });

        return modal;
    }

    // Create advanced edit modal
    function createAdvancedEditModal(keyword, shortcut) {
        const modal = document.createElement('div');
        modal.className = 'omnisearch-modal-overlay';
        
        modal.innerHTML = `
            <div class="omnisearch-modal omnisearch-modal-wide">
                <div class="omnisearch-modal-header">
                    <h3>Edit Advanced Shortcut</h3>
                    <button class="omnisearch-modal-close">&times;</button>
                </div>
                <div class="omnisearch-modal-body">
                    <div class="omnisearch-form-group">
                        <label>Keyword:</label>
                        <input type="text" id="edit-keyword" value="${keyword}" placeholder="e.g., ai">
                    </div>
                    <div class="omnisearch-form-group">
                        <label>Name:</label>
                        <input type="text" id="edit-name" value="${shortcut.name}" placeholder="e.g., AI Studio">
                    </div>
                    <div class="omnisearch-form-group">
                        <label>Page URL:</label>
                        <input type="text" id="edit-url" value="${shortcut.url}" placeholder="e.g., https://aistudio.google.com/prompts/new_chat">
                    </div>
                    <div class="omnisearch-form-group">
                        <label>Input Selector:</label>
                        <input type="text" id="edit-input-selector" value="${shortcut.inputSelector}" placeholder="e.g., textarea">
                        <small>CSS selector for the input field</small>
                    </div>
                    <div class="omnisearch-form-group">
                        <label>Button Selector:</label>
                        <input type="text" id="edit-button-selector" value="${shortcut.buttonSelector}" placeholder="e.g., button[aria-label*='Run']">
                        <small>CSS selector for the submit button</small>
                    </div>
                </div>
                <div class="omnisearch-modal-footer">
                    <button class="omnisearch-btn omnisearch-btn-secondary" data-action="close-modal">Cancel</button>
                    <button class="omnisearch-btn omnisearch-btn-primary" data-action="save-advanced-edit" data-original-keyword="${keyword}">Save</button>
                </div>
            </div>
        `;

        // Add event listeners
        const closeBtn = modal.querySelector('.omnisearch-modal-close');
        closeBtn.addEventListener('click', () => closeModal(closeBtn));
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(closeBtn);
            }
        });

        return modal;
    }

    // Close modal
    function closeModal(button) {
        const modal = button.closest('.omnisearch-modal-overlay');
        modal.classList.remove('omnisearch-modal-show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    // Save simple edit
    function saveSimpleEdit(originalKeyword, button) {
        const modal = button.closest('.omnisearch-modal');
        const newKeyword = modal.querySelector('#edit-keyword').value.toLowerCase().trim();
        const name = modal.querySelector('#edit-name').value.trim();
        const url = modal.querySelector('#edit-url').value.trim();

        if (!newKeyword || !name || !url) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!url.includes('%s')) {
            showNotification('URL must contain %s placeholder', 'error');
            return;
        }

        // Check for keyword conflicts
        if (newKeyword !== originalKeyword && shortcuts[newKeyword]) {
            showNotification('Keyword already exists', 'error');
            return;
        }

        // Remove old shortcut if keyword changed
        if (newKeyword !== originalKeyword) {
            delete shortcuts[originalKeyword];
        }

        // Save updated shortcut
        shortcuts[newKeyword] = {
            ...shortcuts[originalKeyword] || {},
            name: name,
            url: url,
            icon: `https://www.google.com/s2/favicons?domain=${new URL(url.replace('%s', 'test')).hostname}`
        };

        saveShortcuts();
        renderShortcuts();
        renderKeywordsHelp();
        closeModal(button);
        showNotification('Shortcut updated successfully', 'success');
    }

    // Save advanced edit
    function saveAdvancedEdit(originalKeyword, button) {
        const modal = button.closest('.omnisearch-modal');
        const newKeyword = modal.querySelector('#edit-keyword').value.toLowerCase().trim();
        const name = modal.querySelector('#edit-name').value.trim();
        const url = modal.querySelector('#edit-url').value.trim();
        const inputSelector = modal.querySelector('#edit-input-selector').value.trim();
        const buttonSelector = modal.querySelector('#edit-button-selector').value.trim();

        if (!newKeyword || !name || !url || !inputSelector || !buttonSelector) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        // Check for keyword conflicts
        if (newKeyword !== originalKeyword && shortcuts[newKeyword]) {
            showNotification('Keyword already exists', 'error');
            return;
        }

        // Remove old shortcut if keyword changed
        if (newKeyword !== originalKeyword) {
            delete shortcuts[originalKeyword];
        }

        // Save updated shortcut
        shortcuts[newKeyword] = {
            ...shortcuts[originalKeyword] || {},
            name: name,
            url: url,
            type: 'advanced',
            inputSelector: inputSelector,
            buttonSelector: buttonSelector,
            icon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`
        };

        saveShortcuts();
        renderShortcuts();
        renderKeywordsHelp();
        closeModal(button);
        showNotification('Advanced shortcut updated successfully', 'success');
    }

    // Add new shortcut
    function addNewShortcut(type) {
        if (type === 'simple') {
            const modal = createAddSimpleModal();
            document.body.appendChild(modal);
            setTimeout(() => {
                modal.classList.add('omnisearch-modal-show');
                modal.querySelector('input').focus();
            }, 10);
        } else if (type === 'advanced') {
            const modal = createAddAdvancedModal();
            document.body.appendChild(modal);
            setTimeout(() => {
                modal.classList.add('omnisearch-modal-show');
                modal.querySelector('input').focus();
            }, 10);
        }
    }

    // Create add simple modal
    function createAddSimpleModal() {
        const modal = document.createElement('div');
        modal.className = 'omnisearch-modal-overlay';
        
        modal.innerHTML = `
            <div class="omnisearch-modal">
                <div class="omnisearch-modal-header">
                    <h3>Add Simple Shortcut</h3>
                    <button class="omnisearch-modal-close">&times;</button>
                </div>
                <div class="omnisearch-modal-body">
                    <div class="omnisearch-form-group">
                        <label>Keyword:</label>
                        <input type="text" id="add-keyword" placeholder="e.g., youtube">
                    </div>
                    <div class="omnisearch-form-group">
                        <label>Name:</label>
                        <input type="text" id="add-name" placeholder="e.g., YouTube">
                    </div>
                    <div class="omnisearch-form-group">
                        <label>Search URL:</label>
                        <input type="text" id="add-url" placeholder="e.g., https://youtube.com/results?search_query=%s">
                        <small>Use %s as placeholder for search terms</small>
                    </div>
                </div>
                <div class="omnisearch-modal-footer">
                    <button class="omnisearch-btn omnisearch-btn-secondary" data-action="close-modal">Cancel</button>
                    <button class="omnisearch-btn omnisearch-btn-primary" data-action="save-new-simple">Add Shortcut</button>
                </div>
            </div>
        `;

        // Add event listeners
        const closeBtn = modal.querySelector('.omnisearch-modal-close');
        closeBtn.addEventListener('click', () => closeModal(closeBtn));
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(closeBtn);
            }
        });

        return modal;
    }

    // Create add advanced modal
    function createAddAdvancedModal() {
        const modal = document.createElement('div');
        modal.className = 'omnisearch-modal-overlay';
        
        modal.innerHTML = `
            <div class="omnisearch-modal omnisearch-modal-wide">
                <div class="omnisearch-modal-header">
                    <h3>Add Advanced Shortcut</h3>
                    <button class="omnisearch-modal-close">&times;</button>
                </div>
                <div class="omnisearch-modal-body">
                    <div class="omnisearch-form-group">
                        <label>Keyword:</label>
                        <input type="text" id="add-keyword" placeholder="e.g., ai">
                    </div>
                    <div class="omnisearch-form-group">
                        <label>Name:</label>
                        <input type="text" id="add-name" placeholder="e.g., AI Studio">
                    </div>
                    <div class="omnisearch-form-group">
                        <label>Page URL:</label>
                        <input type="text" id="add-url" placeholder="e.g., https://aistudio.google.com/prompts/new_chat">
                    </div>
                    <div class="omnisearch-form-group">
                        <label>Input Selector:</label>
                        <input type="text" id="add-input-selector" placeholder="e.g., textarea">
                        <small>CSS selector for the input field</small>
                    </div>
                    <div class="omnisearch-form-group">
                        <label>Button Selector:</label>
                        <input type="text" id="add-button-selector" placeholder="e.g., button[aria-label*='Run']">
                        <small>CSS selector for the submit button</small>
                    </div>
                </div>
                <div class="omnisearch-modal-footer">
                    <button class="omnisearch-btn omnisearch-btn-secondary" data-action="close-modal">Cancel</button>
                    <button class="omnisearch-btn omnisearch-btn-primary" data-action="save-new-advanced">Add Shortcut</button>
                </div>
            </div>
        `;

        // Add event listeners
        const closeBtn = modal.querySelector('.omnisearch-modal-close');
        closeBtn.addEventListener('click', () => closeModal(closeBtn));
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(closeBtn);
            }
        });

        return modal;
    }

    // Save new simple shortcut
    function saveNewSimple(button) {
        const modal = button.closest('.omnisearch-modal');
        const keyword = modal.querySelector('#add-keyword').value.toLowerCase().trim();
        const name = modal.querySelector('#add-name').value.trim();
        const url = modal.querySelector('#add-url').value.trim();

        if (!keyword || !name || !url) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!url.includes('%s')) {
            showNotification('URL must contain %s placeholder', 'error');
            return;
        }

        // Check for keyword conflicts
        if (shortcuts[keyword]) {
            showNotification('Keyword already exists', 'error');
            return;
        }

        // Validate keyword format
        if (!/^[a-z0-9]+$/.test(keyword)) {
            showNotification('Keyword can only contain lowercase letters and numbers', 'error');
            return;
        }

        // Save new shortcut
        shortcuts[keyword] = {
            name: name,
            url: url,
            enabled: true,
            type: 'simple',
            icon: `https://www.google.com/s2/favicons?domain=${new URL(url.replace('%s', 'test')).hostname}`
        };

        saveShortcuts();
        renderShortcuts();
        renderKeywordsHelp();
        closeModal(button);
        showNotification(`Added "${name}" shortcut successfully`, 'success');
    }

    // Save new advanced shortcut
    function saveNewAdvanced(button) {
        const modal = button.closest('.omnisearch-modal');
        const keyword = modal.querySelector('#add-keyword').value.toLowerCase().trim();
        const name = modal.querySelector('#add-name').value.trim();
        const url = modal.querySelector('#add-url').value.trim();
        const inputSelector = modal.querySelector('#add-input-selector').value.trim();
        const buttonSelector = modal.querySelector('#add-button-selector').value.trim();

        if (!keyword || !name || !url || !inputSelector || !buttonSelector) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        // Check for keyword conflicts
        if (shortcuts[keyword]) {
            showNotification('Keyword already exists', 'error');
            return;
        }

        // Validate keyword format
        if (!/^[a-z0-9]+$/.test(keyword)) {
            showNotification('Keyword can only contain lowercase letters and numbers', 'error');
            return;
        }

        // Save new shortcut
        shortcuts[keyword] = {
            name: name,
            url: url,
            enabled: true,
            type: 'advanced',
            inputSelector: inputSelector,
            buttonSelector: buttonSelector,
            icon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`
        };

        saveShortcuts();
        renderShortcuts();
        renderKeywordsHelp();
        closeModal(button);
        showNotification(`Added advanced "${name}" shortcut successfully`, 'success');
    }

    // Note: Using event delegation instead of global functions for better encapsulation

    // Listen for messages from background script
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'toggleSidebar') {
                toggleSidebar();
            } else if (request.action === 'openSidebar') {
                openSidebar();
            } else if (request.action === 'closeSidebar') {
                closeSidebar();
            }
        });
    }

})();