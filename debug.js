// OmniSearch Debug Console

let autoRefresh = false;
let refreshInterval;

document.addEventListener('DOMContentLoaded', () => {
    checkExtensionStatus();
    refreshShortcuts();
    startLogCapture();
});

async function checkExtensionStatus() {
    // Check background script
    try {
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'getShortcuts' }, resolve);
        });
        
        if (chrome.runtime.lastError) {
            setStatus('bg-status', 'error', 'Error: ' + chrome.runtime.lastError.message);
        } else {
            setStatus('bg-status', 'ok', 'Active');
        }
    } catch (error) {
        setStatus('bg-status', 'error', 'Inactive');
    }

    // Check storage access
    try {
        await chrome.storage.sync.get(['shortcuts']);
        setStatus('storage-status', 'ok', 'Working');
    } catch (error) {
        setStatus('storage-status', 'error', 'Failed');
    }

    // Check omnibox registration
    try {
        const manifest = chrome.runtime.getManifest();
        if (manifest.omnibox && manifest.omnibox.keyword) {
            setStatus('omnibox-status', 'ok', `Keyword: ${manifest.omnibox.keyword}`);
        } else {
            setStatus('omnibox-status', 'error', 'Not configured');
        }
    } catch (error) {
        setStatus('omnibox-status', 'error', 'Failed to check');
    }
}

function setStatus(elementId, type, text) {
    const element = document.getElementById(elementId);
    element.className = `status ${type}`;
    element.textContent = text;
}

async function refreshShortcuts() {
    try {
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'getShortcuts' }, resolve);
        });

        if (chrome.runtime.lastError) {
            console.error('Error getting shortcuts:', chrome.runtime.lastError);
            return;
        }

        const shortcuts = response.shortcuts || {};
        const total = Object.keys(shortcuts).length;
        const enabled = Object.values(shortcuts).filter(s => s.enabled).length;

        document.getElementById('shortcuts-count').textContent = total;
        document.getElementById('enabled-count').textContent = enabled;

        // Display shortcuts
        const shortcutsList = document.getElementById('shortcuts-list');
        shortcutsList.innerHTML = '';

        Object.entries(shortcuts).forEach(([keyword, shortcut]) => {
            const div = document.createElement('div');
            div.className = 'shortcut-item';
            div.innerHTML = `
                <div><strong>${keyword}</strong></div>
                <div>${shortcut.name}</div>
                <div class="${shortcut.enabled ? 'shortcut-enabled' : 'shortcut-disabled'}">
                    ${shortcut.enabled ? '✓ Enabled' : '✗ Disabled'}
                </div>
                <div style="font-size: 11px; color: #888; margin-top: 5px;">
                    ${shortcut.url}
                </div>
            `;
            shortcutsList.appendChild(div);
        });

    } catch (error) {
        console.error('Error refreshing shortcuts:', error);
    }
}

async function testSearch() {
    const keyword = document.getElementById('test-keyword').value.trim();
    const query = document.getElementById('test-query').value.trim();
    const resultDiv = document.getElementById('test-result');

    if (!keyword || !query) {
        resultDiv.innerHTML = '<div style="color: #f44336;">Please enter both keyword and query</div>';
        return;
    }

    try {
        // Get shortcuts to validate
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'getShortcuts' }, resolve);
        });

        const shortcuts = response.shortcuts || {};
        const shortcut = shortcuts[keyword];

        if (!shortcut) {
            resultDiv.innerHTML = `<div style="color: #f44336;">Keyword "${keyword}" not found</div>`;
            return;
        }

        if (!shortcut.enabled) {
            resultDiv.innerHTML = `<div style="color: #ff9800;">Keyword "${keyword}" is disabled</div>`;
            return;
        }

        const searchUrl = shortcut.url.replace('%s', encodeURIComponent(query));
        resultDiv.innerHTML = `
            <div style="color: #4caf50;">✓ Test successful!</div>
            <div style="margin-top: 5px;">
                <strong>Generated URL:</strong><br>
                <a href="${searchUrl}" target="_blank" style="color: #569cd6; word-break: break-all;">
                    ${searchUrl}
                </a>
            </div>
            <div style="margin-top: 10px;">
                <button onclick="window.open('${searchUrl}', '_blank')" style="background: #4caf50;">
                    Open Test Search
                </button>
            </div>
        `;

    } catch (error) {
        resultDiv.innerHTML = `<div style="color: #f44336;">Error: ${error.message}</div>`;
    }
}

async function clearStorage() {
    if (confirm('This will clear all OmniSearch data. Continue?')) {
        try {
            await chrome.storage.sync.clear();
            alert('Storage cleared successfully');
            refreshShortcuts();
        } catch (error) {
            alert('Error clearing storage: ' + error.message);
        }
    }
}

async function resetToDefaults() {
    if (confirm('This will reset all shortcuts to defaults. Continue?')) {
        try {
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: 'resetToDefaults' }, resolve);
            });
            
            if (response && response.success) {
                alert('Reset to defaults successfully');
            } else {
                // Fallback: reload the extension
                chrome.runtime.reload();
            }
            refreshShortcuts();
        } catch (error) {
            alert('Error resetting: ' + error.message);
        }
    }
}

async function exportSettings() {
    try {
        const result = await chrome.storage.sync.get(null);
        const dataStr = JSON.stringify(result, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'omnisearch-settings.json';
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        alert('Error exporting settings: ' + error.message);
    }
}

function reloadExtension() {
    if (confirm('This will reload the extension. Continue?')) {
        chrome.runtime.reload();
    }
}

function clearLogs() {
    document.getElementById('console-logs').textContent = 'Logs cleared...';
}

function toggleAutoRefresh() {
    autoRefresh = !autoRefresh;
    
    if (autoRefresh) {
        refreshInterval = setInterval(() => {
            checkExtensionStatus();
            refreshShortcuts();
        }, 2000);
        alert('Auto-refresh enabled (every 2 seconds)');
    } else {
        clearInterval(refreshInterval);
        alert('Auto-refresh disabled');
    }
}

function startLogCapture() {
    const logsDiv = document.getElementById('console-logs');
    
    // Override console methods to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    function addLog(type, args) {
        const timestamp = new Date().toLocaleTimeString();
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        
        const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}\n`;
        logsDiv.textContent += logEntry;
        logsDiv.scrollTop = logsDiv.scrollHeight;
        
        // Keep only last 100 lines
        const lines = logsDiv.textContent.split('\n');
        if (lines.length > 100) {
            logsDiv.textContent = lines.slice(-100).join('\n');
        }
    }
    
    console.log = function(...args) {
        originalLog.apply(console, args);
        if (args.some(arg => String(arg).includes('OmniSearch'))) {
            addLog('log', args);
        }
    };
    
    console.error = function(...args) {
        originalError.apply(console, args);
        if (args.some(arg => String(arg).includes('OmniSearch'))) {
            addLog('error', args);
        }
    };
    
    console.warn = function(...args) {
        originalWarn.apply(console, args);
        if (args.some(arg => String(arg).includes('OmniSearch'))) {
            addLog('warn', args);
        }
    };
    
    logsDiv.textContent = 'Log capture started. OmniSearch logs will appear here...\n';
}
