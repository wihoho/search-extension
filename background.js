// OmniSearch service worker: address bar ("os" keyword), context menus,
// keyboard shortcut and advanced (fill-in-the-page) shortcuts.

import {
  loadShortcuts, loadUsage, recordUse, isShortcutChange, resolveInput, matchKeywords,
  rankKeywords, targetUrl, siteOrigin, hostLabel, originPattern, escapeXml, cleanShortcut,
} from './lib/shortcuts.js';
import { fillAndSubmit, detectSearchUrl } from './lib/page-scripts.js';

let shortcuts = {};
let usage = {};
let ready = refresh();

async function refresh() {
  [shortcuts, usage] = await Promise.all([loadShortcuts(), loadUsage()]);
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && isShortcutChange(changes)) ready = refresh();
  if (area === 'local' && changes.usage) usage = changes.usage.newValue || {};
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  ready = refresh(); // migrates 2.0 storage, or installs the defaults
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'add-from-field', title: 'Add a keyword for this search…', contexts: ['editable'],
      documentUrlPatterns: ['https://*/*', 'http://*/*'],
    });
    chrome.contextMenus.create({ id: 'add-from-page', title: 'Add this site to OmniSearch…', contexts: ['action'] });
  });
  if (reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
});

// ---------------------------------------------------------------------------
// Address bar

const keywordLine = (k) => `<match>${escapeXml(k)}</match> <dim>${escapeXml(shortcuts[k].name)}</dim>`;

chrome.omnibox.onInputStarted.addListener(() => {
  ready = refresh();
});

chrome.omnibox.onInputChanged.addListener(onInputChanged);
chrome.omnibox.onInputEntered.addListener(onInputEntered);

// Also reachable as `omnisearch.onInputChanged('yt cats', console.log)` from the
// service worker console, which is how the end-to-end test drives the address bar.
globalThis.omnisearch = { onInputChanged, onInputEntered };

async function onInputChanged(text, suggest) {
  await ready;
  const input = resolveInput(shortcuts, text, usage);
  const { query, keywords } = input;
  const suggestions = [];
  let description;

  if (!input.token) {
    const top = rankKeywords(shortcuts, usage);
    description = top.length
      ? `Type a keyword, then your search. For example: <match>${escapeXml(top[0])}</match> <dim>your search</dim>`
      : 'No shortcuts yet. Click the OmniSearch icon to add some.';
    for (const k of top.slice(0, 5)) suggestions.push({ content: `${k} `, description: keywordLine(k) });
  } else if (keywords) {
    const names = escapeXml(keywords.map((k) => shortcuts[k].name).join(', '));
    description = query
      ? `Search <match>${names}</match> for <match>${escapeXml(query)}</match>`
      : `Open <match>${names}</match> <url>${escapeXml(hostLabel(shortcuts[keywords[0]].url))}</url>`;

    if (!input.hasSpace && input.parts.length === 1) {
      // Still typing the keyword: offer the other matches.
      for (const k of matchKeywords(shortcuts, input.parts[0], usage).filter((k) => k !== keywords[0]).slice(0, 5)) {
        suggestions.push({ content: `${k} `, description: keywordLine(k) });
      }
    } else if (query) {
      // Same words on another site: arrow down and press Enter.
      for (const k of rankKeywords(shortcuts, usage).filter((k) => !keywords.includes(k)).slice(0, 5)) {
        suggestions.push({
          content: `${k} ${query}`,
          description: `Search ${escapeXml(shortcuts[k].name)} for <match>${escapeXml(query)}</match> <dim>${escapeXml(k)}</dim>`,
        });
      }
    }
  } else {
    description = `Search the web for <match>${escapeXml(text.trim())}</match> <dim>(no shortcut "${escapeXml(input.parts.join('+'))}")</dim>`;
    for (const k of matchKeywords(shortcuts, input.parts[0] || '', usage).slice(0, 5)) {
      suggestions.push({ content: query ? `${k} ${query}` : `${k} `, description: keywordLine(k) });
    }
  }

  chrome.omnibox.setDefaultSuggestion({ description });
  suggest(suggestions);
  return { description, suggestions };
}

async function onInputEntered(text, disposition) {
  await ready;
  const { keywords, query } = resolveInput(shortcuts, text, usage);
  if (!keywords) {
    const words = text.trim();
    if (words) {
      chrome.search.query({ text: words, disposition: disposition === 'currentTab' ? 'CURRENT_TAB' : 'NEW_TAB' });
    }
    return;
  }
  recordUse(keywords);
  for (const [i, keyword] of keywords.entries()) {
    // The first site opens where the user asked; the rest open in background tabs.
    run(shortcuts[keyword], query, i === 0 ? disposition : 'newBackgroundTab');
  }
}

// ---------------------------------------------------------------------------
// Opening shortcuts

async function openTab(url, disposition) {
  if (disposition === 'currentTab') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) return chrome.tabs.update(tab.id, { url });
  }
  return chrome.tabs.create({ url, active: disposition !== 'newBackgroundTab' });
}

async function run(shortcut, query, disposition) {
  if (shortcut.type !== 'advanced' || !query) {
    await openTab(targetUrl(shortcut, query), disposition);
    return { ok: true };
  }
  const pattern = originPattern(shortcut.url);
  const allowed = pattern && await chrome.permissions.contains({ origins: [pattern] });
  const tab = await openTab(shortcut.url, disposition);
  const origin = siteOrigin(shortcut.url);
  if (!allowed) {
    return flagTab(tab.id, origin, `OmniSearch needs access to ${hostLabel(shortcut.url)} to type your search. Open OmniSearch and click "Allow" on ${shortcut.name}.`);
  }
  if (!await tabLoaded(tab.id, origin)) {
    return flagTab(tab.id, origin, `${shortcut.name} didn't finish loading.`);
  }
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillAndSubmit,
      args: [query, shortcut.inputSelector, shortcut.buttonSelector || ''],
    });
    return result.ok ? result : flagTab(tab.id, origin, result.error);
  } catch (error) {
    return flagTab(tab.id, origin, `Couldn't type into ${shortcut.name}: ${error.message}`);
  }
}

function tabLoaded(tabId, origin, timeout = 30000) {
  return new Promise((resolve) => {
    const isDone = (tab) => tab.status === 'complete' && (tab.url || '').startsWith(origin);
    const finish = (ok) => {
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve(ok);
    };
    const listener = (id, _info, tab) => {
      if (id === tabId && isDone(tab)) finish(true);
    };
    const timer = setTimeout(() => finish(false), timeout);
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.get(tabId).then((tab) => isDone(tab) && finish(true), () => finish(false));
  });
}

// Problems with advanced shortcuts show as a red "!" on the toolbar icon for
// that tab, with the reason in the tooltip, until the tab leaves the site.
const flagged = new Map(); // tabId -> origin

function flagTab(tabId, origin, message) {
  flagged.set(tabId, origin);
  chrome.action.setBadgeBackgroundColor({ tabId, color: '#d93025' });
  chrome.action.setBadgeText({ tabId, text: '!' });
  chrome.action.setTitle({ tabId, title: message });
  return { ok: false, error: message };
}

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (!info.url || !flagged.has(tabId) || info.url.startsWith(flagged.get(tabId))) return;
  flagged.delete(tabId);
  chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {});
  chrome.action.setTitle({ tabId, title: 'OmniSearch' }).catch(() => {});
});
chrome.tabs.onRemoved.addListener((tabId) => flagged.delete(tabId));

// ---------------------------------------------------------------------------
// Side panel: the keyboard shortcut toggles it, context menus prefill its add form

const openPanels = new Map(); // windowId -> port

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'sidepanel') return;
  port.onMessage.addListener(({ windowId }) => {
    openPanels.set(windowId, port);
    port.onDisconnect.addListener(() => openPanels.delete(windowId));
  });
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== 'toggle-sidebar' || !tab) return;
  const port = openPanels.get(tab.windowId);
  if (port) port.postMessage({ action: 'close' });
  else chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab) return;
  // Open the panel first, while Chrome still counts this as a user action.
  chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
  let found;
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id, frameIds: [info.frameId || 0] },
      func: detectSearchUrl,
      args: [info.menuItemId === 'add-from-field'],
    });
    found = result;
  } catch {
    found = { name: hostLabel(tab.url || ''), url: null, error: "Chrome doesn't let extensions read this page." };
  }
  await chrome.storage.session.set({ pendingAdd: { ...found, at: Date.now() } });
});

// The side panel's "Try it" button runs the form's (possibly unsaved) shortcut.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action !== 'run' || sender.id !== chrome.runtime.id) return false;
  const shortcut = cleanShortcut(message.shortcut);
  if (!shortcut) return false;
  run(shortcut, String(message.query || ''), 'newForegroundTab').then(sendResponse);
  return true;
});
