// OmniSearch side panel (also used as the options page).

import {
  loadShortcuts, loadUsage, saveShortcut, deleteShortcut, writeShortcuts, isShortcutChange,
  defaultShortcuts, catalog, cleanShortcutMap, validateShortcut, normalizeKeyword, isValidKeyword,
  templateFromResultsUrl, hasPlaceholder, hostLabel, siteOrigin, originPattern, uiLanguage, rankKeywords,
} from './lib/shortcuts.js';
import { loadRate, saveRate, shouldAsk, later, finish, totalUses, reviewUrl } from './lib/rate.js';
import { catchErrors } from './lib/telemetry.js';

catchErrors('sidepanel');

const $ = (id) => document.getElementById(id);
const lang = uiLanguage();

let shortcuts = {};
let usage = {};
let editing = null; // keyword being edited, or null when adding
let blocked = new Set(); // advanced shortcuts' URLs that lack site access

// ---------------------------------------------------------------------------
// Small DOM helper: h('div', { className: 'x', onclick }, child, ...)

function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key in el && key !== 'list') el[key] = value;
    else el.setAttribute(key, value);
  }
  el.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false));
  return el;
}

const ICONS = {
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  delete: 'M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
};

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', ICONS[name]);
  svg.append(path);
  return svg;
}

// Letter tile with the site's own favicon on top when it loads.
function avatar(name, url) {
  const box = h('span', { className: 'avatar', 'aria-hidden': 'true' }, (name || '?').trim().charAt(0).toUpperCase());
  const origin = siteOrigin(url);
  if (origin) {
    const img = h('img', { alt: '', src: `${origin}/favicon.ico`, referrerPolicy: 'no-referrer' });
    img.addEventListener('error', () => img.remove());
    box.append(img);
  }
  return box;
}

// ---------------------------------------------------------------------------
// Views

function show(view) {
  for (const id of ['view-list', 'view-form', 'view-catalog']) $(id).hidden = id !== view;
  $('menu').hidden = true;
  window.scrollTo(0, 0);
}

let rate = null;

async function reload() {
  [shortcuts, usage, rate] = await Promise.all([loadShortcuts(), loadUsage(), loadRate()]);
  $('rate').hidden = !shouldAsk(rate, totalUses(usage));
  blocked = new Set();
  await Promise.all(Object.values(shortcuts).filter((s) => s.type === 'advanced').map(async (s) => {
    const pattern = originPattern(s.url);
    if (!pattern || !await chrome.permissions.contains({ origins: [pattern] })) blocked.add(s.url);
  }));
  renderList();
  if (!$('view-catalog').hidden) renderCatalog();
}

function needsAccess(shortcut) {
  return shortcut.type === 'advanced' && blocked.has(shortcut.url);
}

function renderList() {
  const filter = $('filter').value.trim().toLowerCase();
  const keywords = Object.keys(shortcuts)
    .filter((k) => !filter || k.includes(filter) || shortcuts[k].name.toLowerCase().includes(filter)
      || hostLabel(shortcuts[k].url).includes(filter))
    .sort((a, b) => shortcuts[a].name.localeCompare(shortcuts[b].name, lang) || a.localeCompare(b));

  $('list').replaceChildren(...keywords.map((k) => listItem(k, shortcuts[k])));

  const total = Object.keys(shortcuts).length;
  $('empty').hidden = keywords.length > 0;
  $('empty').textContent = total ? `No shortcuts match "${filter}".` : 'No shortcuts yet. Add one, or browse the suggested ones.';

  // Use the user's most-used search shortcut in the example.
  const top = rankKeywords(shortcuts, usage).find((k) => shortcuts[k].type !== 'advanced');
  $('tip-example').textContent = `os ${top || 'youtube'} cats`;
}

function listItem(keyword, shortcut) {
  const advanced = shortcut.type === 'advanced';
  const uses = usage[keyword] || 0;
  const toggle = h('input', {
    type: 'checkbox',
    checked: shortcut.enabled,
    'aria-label': `Use ${shortcut.name}`,
    onchange: () => saveShortcut(keyword, { ...shortcut, enabled: toggle.checked }),
  });
  const access = advanced && needsAccess(shortcut)
    ? h('div', { className: 'warn' }, `Needs access to ${hostLabel(shortcut.url)}`,
      h('button', { className: 'btn link small', onclick: () => requestAccess(shortcut.url) }, 'Allow'))
    : null;

  return h('li', { className: `item${shortcut.enabled ? '' : ' off'}` },
    avatar(shortcut.name, shortcut.url),
    h('div', { className: 'meta', title: 'Edit', onclick: () => openForm(keyword) },
      h('div', { className: 'name' }, shortcut.name, advanced ? h('span', { className: 'tag' }, 'types into page') : null),
      h('div', { className: 'sub' }, h('code', {}, keyword), ` · ${hostLabel(shortcut.url)}`,
        uses ? ` · used ${uses}×` : ''),
      access),
    h('label', { className: 'switch', title: shortcut.enabled ? 'On' : 'Off' }, toggle, h('span')),
    h('button', { className: 'icon-btn', 'aria-label': `Edit ${shortcut.name}`, title: 'Edit', onclick: () => openForm(keyword) }, icon('edit')),
    h('button', { className: 'icon-btn', 'aria-label': `Delete ${shortcut.name}`, title: 'Delete', onclick: () => remove(keyword) }, icon('delete')));
}

async function remove(keyword) {
  const removed = shortcuts[keyword];
  await deleteShortcut(keyword);
  toast(`Deleted ${removed.name}`, () => saveShortcut(keyword, removed));
}

// ---------------------------------------------------------------------------
// Add / edit form

const field = {
  url: $('f-url'), name: $('f-name'), keyword: $('f-keyword'),
  adv: $('f-adv'), input: $('f-input'), button: $('f-button'), sample: $('f-sample'),
};

function openForm(keyword = null, prefill = {}, note = null) {
  editing = keyword;
  const s = keyword ? shortcuts[keyword] : { name: '', url: '', type: 'simple', ...prefill };
  $('form-title').textContent = keyword ? `Edit ${s.name}` : 'Add shortcut';
  field.url.value = s.url || '';
  field.name.value = s.name || '';
  field.keyword.value = keyword || prefill.keyword || (s.url ? suggestKeyword(s.url) : '');
  field.adv.checked = s.type === 'advanced';
  field.input.value = s.inputSelector || '';
  field.button.value = s.buttonSelector || '';
  $('f-advanced').open = s.type === 'advanced';
  $('f-sample-row').hidden = true;
  field.sample.value = '';
  setNote(note);
  $('form-error').textContent = '';
  syncFormMode();
  show('view-form');
  (field.url.value ? field.name : field.url).focus();
}

function setNote(note) {
  $('form-note').hidden = !note;
  if (note) {
    $('form-note').textContent = note.text;
    $('form-note').className = `note ${note.kind || ''}`;
  }
}

function syncFormMode() {
  const adv = field.adv.checked;
  $('f-url-label').textContent = adv ? 'Page URL' : 'Search URL';
  field.url.placeholder = adv ? 'https://example.com/chat' : 'https://example.com/search?q=%s';
  $('f-url-help').hidden = adv;
  field.input.disabled = !adv;
  field.button.disabled = !adv;
  updateExample();
}

function updateExample() {
  const keyword = normalizeKeyword(field.keyword.value) || 'keyword';
  $('f-example').textContent = `os ${keyword} your search`;
}

// "stackoverflow.com" -> "stackoverflow", made unique if needed.
function suggestKeyword(url) {
  const host = hostLabel(url).split('.');
  let base = (host.length > 2 && host[0].length <= 3 ? host[1] : host[0]).toLowerCase().replace(/[^\p{L}\p{N}_-]/gu, '').slice(0, 16);
  if (!isValidKeyword(base)) base = 'site';
  let keyword = base;
  for (let i = 2; shortcuts[keyword] && keyword !== editing; i++) keyword = `${base}${i}`;
  return keyword;
}

function suggestName(url) {
  const host = hostLabel(url);
  const parts = host.split('.');
  const main = parts.length > 2 && parts[0].length <= 3 ? parts[1] : parts[0];
  return main ? main.charAt(0).toUpperCase() + main.slice(1) : host;
}

// Paste a results page URL and we find the search words in it.
function detectTemplate(sample = '') {
  const value = field.url.value.trim();
  if (!value || field.adv.checked) return;
  if (!field.name.value) field.name.value = suggestName(value);
  if (!field.keyword.value) {
    field.keyword.value = suggestKeyword(value);
    updateExample();
  }
  if (hasPlaceholder(value)) {
    $('f-sample-row').hidden = true;
    return;
  }
  const found = templateFromResultsUrl(value, sample);
  if (found) {
    field.url.value = found.url;
    $('f-sample-row').hidden = true;
    setNote({ kind: 'ok', text: `Found ${found.found} and replaced it with %s, where your search words will go.` });
  } else {
    $('f-sample-row').hidden = false;
    setNote(sample
      ? { kind: 'warn', text: `Couldn't find "${sample}" in that address. Replace your search words with %s yourself.` }
      : null);
    field.sample.focus();
  }
}

field.url.addEventListener('change', () => detectTemplate());
field.url.addEventListener('paste', () => setTimeout(() => detectTemplate(), 0));
$('f-sample-btn').addEventListener('click', () => detectTemplate(field.sample.value));
field.sample.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    detectTemplate(field.sample.value);
  }
});
field.keyword.addEventListener('input', updateExample);
field.adv.addEventListener('change', syncFormMode);

function formShortcut() {
  const adv = field.adv.checked;
  const shortcut = {
    name: field.name.value.trim(),
    url: field.url.value.trim(),
    type: adv ? 'advanced' : 'simple',
    enabled: editing ? shortcuts[editing].enabled : true,
  };
  if (adv) {
    shortcut.inputSelector = field.input.value.trim();
    shortcut.buttonSelector = field.button.value.trim();
  }
  return shortcut;
}

// Must run inside a click handler: Chrome only shows the prompt for a user action.
function requestAccess(url) {
  const pattern = originPattern(url);
  return pattern ? chrome.permissions.request({ origins: [pattern] }) : Promise.resolve(false);
}

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const keyword = normalizeKeyword(field.keyword.value);
  const shortcut = formShortcut();
  const error = validateShortcut(keyword, shortcut, shortcuts, editing);
  $('form-error').textContent = error || '';
  if (error) return;

  let message = editing ? `Saved ${shortcut.name}` : `Added ${shortcut.name}. Try: os ${keyword} …`;
  if (shortcut.type === 'advanced') {
    // Resolves at once, with no prompt, when access was already granted.
    const granted = await requestAccess(shortcut.url).catch(() => false);
    if (!granted) message = `Saved. OmniSearch can open ${hostLabel(shortcut.url)} but can't type into it until you click Allow.`;
  }
  await saveShortcut(keyword, shortcut, editing);
  toast(message);
  show('view-list');
});

$('try-btn').addEventListener('click', async () => {
  const shortcut = formShortcut();
  const error = validateShortcut('test', shortcut);
  if (error) {
    $('form-error').textContent = error;
    return;
  }
  if (shortcut.type === 'advanced') await requestAccess(shortcut.url).catch(() => false);
  const result = await chrome.runtime.sendMessage({ action: 'run', shortcut, query: 'OmniSearch' });
  $('form-error').textContent = result?.ok ? '' : result?.error || '';
});

// ---------------------------------------------------------------------------
// Suggested shortcuts

function renderCatalog() {
  const urls = new Set(Object.values(shortcuts).map((s) => s.url));
  const groups = new Map();
  for (const entry of catalog(lang)) {
    if (!groups.has(entry.category)) groups.set(entry.category, []);
    groups.get(entry.category).push(entry);
  }
  $('catalog').replaceChildren(...[...groups].map(([category, entries]) => h('div', { className: 'cat' },
    h('h3', {}, category),
    h('ul', { className: 'list' }, entries.map((entry) => {
      const added = urls.has(entry.url);
      return h('li', { className: 'item' },
        avatar(entry.name, entry.url),
        h('div', { className: 'meta' },
          h('div', { className: 'name' }, entry.name),
          h('div', { className: 'sub' }, h('code', {}, entry.keyword), ` · ${hostLabel(entry.url)}`)),
        h('button', { className: 'btn small', disabled: added, onclick: () => addFromCatalog(entry) }, added ? 'Added' : 'Add'));
    })))));
}

async function addFromCatalog(entry) {
  const shortcut = { name: entry.name, url: entry.url, type: 'simple', enabled: true };
  if (shortcuts[entry.keyword]) {
    // Keyword taken by another site: let the user pick a different one.
    openForm(null, { ...shortcut, keyword: '' },
      { kind: 'warn', text: `The keyword "${entry.keyword}" is already used by ${shortcuts[entry.keyword].name}. Choose another one.` });
    return;
  }
  await saveShortcut(entry.keyword, shortcut);
  toast(`Added ${entry.name}. Try: os ${entry.keyword} …`, () => deleteShortcut(entry.keyword));
}

// ---------------------------------------------------------------------------
// Menu: import, export, reset

$('menu-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  $('menu').hidden = !$('menu').hidden;
  $('menu-btn').setAttribute('aria-expanded', String(!$('menu').hidden));
});
document.addEventListener('click', () => {
  $('menu').hidden = true;
});

$('menu').addEventListener('click', async (e) => {
  const cmd = e.target.dataset.cmd;
  $('menu').hidden = true;
  if (cmd === 'browse') openCatalog();
  if (cmd === 'export') exportShortcuts();
  if (cmd === 'import') $('import-file').click();
  if (cmd === 'keys') openKeyboardSettings();
  if (cmd === 'help') chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  if (cmd === 'reset' && await confirmDialog('Replace all your shortcuts with the 10 default ones? Shortcuts you added will be removed. Export them first if you want a copy.', 'Restore defaults')) {
    await writeShortcuts(defaultShortcuts(lang), { replace: true });
    toast('Restored the default shortcuts');
  }
});

function exportShortcuts() {
  const data = { format: 'omnisearch', version: 1, exported: new Date().toISOString(), shortcuts };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  h('a', { href: url, download: `omnisearch-shortcuts-${new Date().toISOString().slice(0, 10)}.json` }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('import-file').addEventListener('change', async () => {
  const file = $('import-file').files[0];
  $('import-file').value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const imported = cleanShortcutMap(data.shortcuts || data);
    const count = Object.keys(imported).length;
    if (!count) throw new Error('no shortcuts');
    await writeShortcuts(imported);
    toast(`Imported ${count} shortcut${count === 1 ? '' : 's'}`);
  } catch {
    toast("That file doesn't contain OmniSearch shortcuts");
  }
});

function openKeyboardSettings() {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
}

function openCatalog() {
  renderCatalog();
  show('view-catalog');
}

// ---------------------------------------------------------------------------
// Toast and confirm dialog

let toastTimer;
function toast(text, undo = null) {
  clearTimeout(toastTimer);
  $('toast-text').textContent = text;
  $('toast-undo').hidden = !undo;
  $('toast-undo').onclick = async () => {
    $('toast').hidden = true;
    await undo();
  };
  $('toast').hidden = false;
  toastTimer = setTimeout(() => {
    $('toast').hidden = true;
  }, undo ? 6000 : 3500);
}

function confirmDialog(text, okLabel) {
  const dialog = $('confirm');
  $('confirm-text').textContent = text;
  $('confirm-ok').textContent = okLabel;
  dialog.showModal();
  return new Promise((resolve) => {
    $('confirm-ok').onclick = () => { dialog.close(); resolve(true); };
    $('confirm-cancel').onclick = () => { dialog.close(); resolve(false); };
    dialog.oncancel = () => resolve(false);
  });
}

// ---------------------------------------------------------------------------
// Review request

async function answerRate(next) {
  rate = next;
  $('rate').hidden = true;
  await saveRate(rate);
}
$('rate-yes').addEventListener('click', () => {
  chrome.tabs.create({ url: reviewUrl() });
  answerRate(finish(rate));
});
$('rate-later').addEventListener('click', () => answerRate(later(rate, totalUses(usage))));
$('rate-never').addEventListener('click', () => answerRate(finish(rate)));

// ---------------------------------------------------------------------------
// Wiring

$('filter').addEventListener('input', renderList);
$('add-btn').addEventListener('click', () => openForm());
$('browse-btn').addEventListener('click', openCatalog);
$('keys-btn').addEventListener('click', openKeyboardSettings);
for (const back of document.querySelectorAll('[data-back]')) back.addEventListener('click', () => show('view-list'));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('view-list').hidden && !$('confirm').open) show('view-list');
});

chrome.permissions.onAdded.addListener(reload);
chrome.permissions.onRemoved.addListener(reload);
chrome.storage.onChanged.addListener((changes, area) => {
  if ((area === 'sync' && isShortcutChange(changes)) || (area === 'local' && (changes.usage || changes.rate))) reload();
  if (area === 'session' && changes.pendingAdd?.newValue) takePendingAdd();
});

// Context menu "Add a keyword for this search" leaves the detected site here.
async function takePendingAdd() {
  const { pendingAdd } = await chrome.storage.session.get('pendingAdd');
  if (!pendingAdd || Date.now() - pendingAdd.at > 60000) return;
  await chrome.storage.session.remove('pendingAdd');
  const how = { form: "this page's search box", opensearch: "this site's search settings" }[pendingAdd.how];
  const note = pendingAdd.url
    ? { kind: 'ok', text: `Found the search address from ${how}. Pick a keyword and save.` }
    : { kind: 'warn', text: pendingAdd.error || "Couldn't find a search address on this page. Search the site once, then paste the results page address below." };
  const url = pendingAdd.url || '';
  openForm(null, { name: pendingAdd.name, url, keyword: url ? suggestKeyword(url) : '' }, note);
}

async function showCommandKey() {
  const commands = await chrome.commands.getAll();
  const cmd = commands.find((c) => c.name === 'toggle-sidebar');
  $('cmd-key').textContent = cmd?.shortcut || 'not set';
}

// Let the service worker know this window's panel is open, so the keyboard
// shortcut can close it. Not needed when shown as the options page in a tab.
async function connectPanel() {
  if (await chrome.tabs.getCurrent()) return;
  const { id: windowId } = await chrome.windows.getCurrent();
  const port = chrome.runtime.connect({ name: 'sidepanel' });
  port.postMessage({ windowId });
  port.onMessage.addListener((msg) => msg.action === 'close' && window.close());
  port.onDisconnect.addListener(() => setTimeout(connectPanel, 500));
}

reload().then(takePendingAdd);
showCommandKey();
connectPanel();
