// OmniSearch Welcome Page Script

import { loadShortcuts, hostLabel, siteOrigin } from './lib/shortcuts.js';

// Module scripts run after the document is parsed.
let windowId = null;
chrome.windows.getCurrent().then((win) => { windowId = win.id; });
setupEventListeners();
renderShortcuts();
addInteractiveAnimations();

async function renderShortcuts() {
    const grid = document.getElementById('shortcuts-grid');
    const shortcuts = await loadShortcuts();
    for (const [keyword, shortcut] of Object.entries(shortcuts)) {
        if (!shortcut.enabled) continue;
        const card = document.createElement('div');
        card.className = 'shortcut-card';
        const img = document.createElement('img');
        img.alt = '';
        img.src = `${siteOrigin(shortcut.url)}/favicon.ico`;
        img.addEventListener('error', () => { img.src = 'icons/icon16.png'; }, { once: true });
        const info = document.createElement('div');
        info.className = 'shortcut-info';
        const strong = document.createElement('strong');
        strong.textContent = keyword;
        const span = document.createElement('span');
        span.textContent = `${shortcut.name} · ${hostLabel(shortcut.url)}`;
        info.append(strong, span);
        card.append(img, info);
        grid.append(card);
    }
}

function setupEventListeners() {
    // Open Settings button
    const openSettingsBtn = document.getElementById('open-settings');
    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', () => {
            // Call open() straight from the click (no await first), or Chrome refuses it.
            const opening = windowId === null ? Promise.reject() : chrome.sidePanel.open({ windowId });
            opening.catch(() => chrome.runtime.openOptionsPage());
        });
    }

    // Try Now button
    const tryNowBtn = document.getElementById('try-now');
    if (tryNowBtn) {
        tryNowBtn.addEventListener('click', () => {
            // Focus the address bar and add some helpful text
            focusAddressBar();
        });
    }

    // Close Welcome button
    const closeWelcomeBtn = document.getElementById('close-welcome');
    if (closeWelcomeBtn) {
        closeWelcomeBtn.addEventListener('click', () => {
            window.close();
        });
    }

    // Add click handlers for example commands
    const examples = document.querySelectorAll('.example code');
    examples.forEach(example => {
        example.addEventListener('click', () => {
            copyToClipboard(example.textContent);
            showCopyFeedback(example);
        });
    });
}

function focusAddressBar() {
    // We can't directly focus the address bar from a web page for security reasons
    // But we can provide instructions
    showInstructions();
}

function showInstructions() {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #667eea;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        font-weight: 500;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="margin-bottom: 8px;">💡 Ready to try OmniSearch?</div>
        <div style="font-size: 14px; opacity: 0.9;">
            1. Click in Chrome's address bar (Ctrl+L)<br>
            2. Type "os" and press Tab<br>
            3. Try "youtube cats"
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function copyToClipboard(text) {
    // Extract just the command part (remove "os " prefix for easier copying)
    const command = text.replace('os ', '');
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(command).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = command;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        
        document.body.removeChild(textArea);
    }
}

function showCopyFeedback(element) {
    const originalText = element.textContent;
    const originalStyle = element.style.cssText;
    
    // Show feedback
    element.style.cssText = originalStyle + `
        background: #28a745 !important;
        color: white !important;
        transform: scale(1.05);
        transition: all 0.2s ease;
    `;
    
    // Create a small tooltip
    const tooltip = document.createElement('div');
    tooltip.textContent = 'Copied search term!';
    tooltip.style.cssText = `
        position: absolute;
        background: #333;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
        transform: translateY(-100%);
        margin-top: -8px;
        white-space: nowrap;
    `;
    
    element.style.position = 'relative';
    element.appendChild(tooltip);
    
    // Reset after 1.5 seconds
    setTimeout(() => {
        element.style.cssText = originalStyle;
        if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
        }
    }, 1500);
}

// Add some interactive animations
function addInteractiveAnimations() {
    // Animate step numbers on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'pulse 0.6s ease';
            }
        });
    });
    
    document.querySelectorAll('.step-number').forEach(el => {
        observer.observe(el);
    });
    
    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
}

// Add keyboard shortcut hint
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        // User pressed Ctrl+L (focus address bar)
        setTimeout(() => {
            showInstructions();
        }, 100);
    }
});
