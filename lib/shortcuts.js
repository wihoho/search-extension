// Shortcut model, defaults, parsing and storage shared by the service worker,
// the side panel and the welcome page. Pure helpers don't touch `chrome`.

export const SCHEMA = 2;
const KEY_PREFIX = 'sc:';
const MAX_KEYWORD = 32;

// Words in a search URL that mark where the query goes.
const PLACEHOLDERS = /%s|\{searchTerms\}/g;

// ---------------------------------------------------------------------------
// Defaults and catalog

const AMAZON_DOMAINS = {
  'en-GB': 'amazon.co.uk', 'en-IN': 'amazon.in', 'en-CA': 'amazon.ca', 'en-AU': 'amazon.com.au',
  'es-MX': 'amazon.com.mx', 'pt-BR': 'amazon.com.br',
  de: 'amazon.de', fr: 'amazon.fr', it: 'amazon.it', es: 'amazon.es', ja: 'amazon.co.jp',
  tr: 'amazon.com.tr', nl: 'amazon.nl', pl: 'amazon.pl', sv: 'amazon.se',
};

function amazonDomain(lang) {
  return AMAZON_DOMAINS[lang] || AMAZON_DOMAINS[lang.split('-')[0]] || 'amazon.com';
}

function wikiLang(lang) {
  const base = lang.split('-')[0].toLowerCase();
  return /^[a-z]{2,3}$/.test(base) ? base : 'en';
}

// `lang` is a BCP 47 tag such as "en-US" or "pt-BR" (chrome.i18n.getUILanguage()).
export function defaultShortcuts(lang = 'en') {
  const s = (name, url) => ({ name, url, type: 'simple', enabled: true });
  return {
    youtube: s('YouTube', 'https://www.youtube.com/results?search_query=%s'),
    drive: s('Google Drive', 'https://drive.google.com/drive/search?q=%s'),
    gmail: s('Gmail', 'https://mail.google.com/mail/u/0/#search/%s'),
    amazon: s('Amazon', `https://www.${amazonDomain(lang)}/s?k=%s`),
    wikipedia: s('Wikipedia', `https://${wikiLang(lang)}.wikipedia.org/wiki/Special:Search?search=%s`),
    imdb: s('IMDb', 'https://www.imdb.com/find/?q=%s'),
    spotify: s('Spotify', 'https://open.spotify.com/search/%s'),
    github: s('GitHub', 'https://github.com/search?q=%s'),
    x: s('X (Twitter)', 'https://x.com/search?q=%s'),
    ai: s('ChatGPT', 'https://chatgpt.com/?q=%s'),
  };
}

// Suggested shortcuts users can add with one click from the side panel.
export function catalog(lang = 'en') {
  const wl = wikiLang(lang);
  const c = (category, keyword, name, url) => ({ category, keyword, name, url });
  return [
    c('Search', 'g', 'Google', 'https://www.google.com/search?q=%s'),
    c('Search', 'img', 'Google Images', 'https://www.google.com/search?udm=2&q=%s'),
    c('Search', 'news', 'Google News', 'https://news.google.com/search?q=%s'),
    c('Search', 'maps', 'Google Maps', 'https://www.google.com/maps/search/%s'),
    c('Search', 'ddg', 'DuckDuckGo', 'https://duckduckgo.com/?q=%s'),
    c('Search', 'bing', 'Bing', 'https://www.bing.com/search?q=%s'),
    c('AI', 'ai', 'ChatGPT', 'https://chatgpt.com/?q=%s'),
    c('AI', 'pplx', 'Perplexity', 'https://www.perplexity.ai/search?q=%s'),
    c('AI', 'claude', 'Claude', 'https://claude.ai/new?q=%s'),
    c('Google', 'drive', 'Google Drive', 'https://drive.google.com/drive/search?q=%s'),
    c('Google', 'gmail', 'Gmail', 'https://mail.google.com/mail/u/0/#search/%s'),
    c('Google', 'cal', 'Google Calendar', 'https://calendar.google.com/calendar/r/search?q=%s'),
    c('Google', 'photos', 'Google Photos', 'https://photos.google.com/search/%s'),
    c('Google', 'tr', 'Google Translate', 'https://translate.google.com/?sl=auto&text=%s&op=translate'),
    c('Shopping', 'amazon', 'Amazon', `https://www.${amazonDomain(lang)}/s?k=%s`),
    c('Shopping', 'ebay', 'eBay', 'https://www.ebay.com/sch/i.html?_nkw=%s'),
    c('Shopping', 'etsy', 'Etsy', 'https://www.etsy.com/search?q=%s'),
    c('Shopping', 'walmart', 'Walmart', 'https://www.walmart.com/search?q=%s'),
    c('Shopping', 'ali', 'AliExpress', 'https://www.aliexpress.com/wholesale?SearchText=%s'),
    c('Video & music', 'youtube', 'YouTube', 'https://www.youtube.com/results?search_query=%s'),
    c('Video & music', 'spotify', 'Spotify', 'https://open.spotify.com/search/%s'),
    c('Video & music', 'imdb', 'IMDb', 'https://www.imdb.com/find/?q=%s'),
    c('Video & music', 'netflix', 'Netflix', 'https://www.netflix.com/search?q=%s'),
    c('Video & music', 'twitch', 'Twitch', 'https://www.twitch.tv/search?term=%s'),
    c('Video & music', 'steam', 'Steam', 'https://store.steampowered.com/search/?term=%s'),
    c('Reference', 'wikipedia', 'Wikipedia', `https://${wl}.wikipedia.org/wiki/Special:Search?search=%s`),
    c('Reference', 'wikt', 'Wiktionary', `https://${wl}.wiktionary.org/wiki/Special:Search?search=%s`),
    c('Reference', 'mw', 'Merriam-Webster', 'https://www.merriam-webster.com/dictionary/%s'),
    c('Reference', 'scholar', 'Google Scholar', 'https://scholar.google.com/scholar?q=%s'),
    c('Reference', 'arxiv', 'arXiv', 'https://arxiv.org/search/?query=%s&searchtype=all'),
    c('Reference', 'unsplash', 'Unsplash', 'https://unsplash.com/s/photos/%s'),
    c('Developer', 'github', 'GitHub', 'https://github.com/search?q=%s'),
    c('Developer', 'so', 'Stack Overflow', 'https://stackoverflow.com/search?q=%s'),
    c('Developer', 'mdn', 'MDN Web Docs', 'https://developer.mozilla.org/en-US/search?q=%s'),
    c('Developer', 'npm', 'npm', 'https://www.npmjs.com/search?q=%s'),
    c('Developer', 'pypi', 'PyPI', 'https://pypi.org/search/?q=%s'),
    c('Developer', 'crates', 'crates.io', 'https://crates.io/search?q=%s'),
    c('Developer', 'docker', 'Docker Hub', 'https://hub.docker.com/search?q=%s'),
    c('Developer', 'hn', 'Hacker News', 'https://hn.algolia.com/?q=%s'),
    c('Social', 'x', 'X (Twitter)', 'https://x.com/search?q=%s'),
    c('Social', 'reddit', 'Reddit', 'https://www.reddit.com/search/?q=%s'),
    c('Social', 'linkedin', 'LinkedIn', 'https://www.linkedin.com/search/results/all/?keywords=%s'),
    c('Social', 'pin', 'Pinterest', 'https://www.pinterest.com/search/pins/?q=%s'),
    c('Social', 'tiktok', 'TikTok', 'https://www.tiktok.com/search?q=%s'),
    c('Regional', 'baidu', 'Baidu', 'https://www.baidu.com/s?wd=%s'),
    c('Regional', 'bili', 'Bilibili', 'https://search.bilibili.com/all?keyword=%s'),
    c('Regional', 'zhihu', 'Zhihu', 'https://www.zhihu.com/search?q=%s'),
    c('Regional', 'taobao', 'Taobao', 'https://s.taobao.com/search?q=%s'),
    c('Regional', 'yandex', 'Yandex', 'https://yandex.ru/search/?text=%s'),
    c('Regional', 'naver', 'Naver', 'https://search.naver.com/search.naver?query=%s'),
    c('Regional', 'rakuten', 'Rakuten', 'https://search.rakuten.co.jp/search/mall/%s/'),
  ];
}

// ---------------------------------------------------------------------------
// Validation

export function normalizeKeyword(keyword) {
  return String(keyword || '').trim().toLowerCase();
}

// Letters (any script), digits, dot, dash and underscore. "+" is reserved for
// searching several shortcuts at once.
export function isValidKeyword(keyword) {
  return /^[\p{L}\p{N}._-]+$/u.test(keyword) && keyword.length <= MAX_KEYWORD;
}

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function hasPlaceholder(url) {
  return /%s|\{searchTerms\}/.test(url);
}

// Returns an error message, or null when the shortcut can be saved.
export function validateShortcut(keyword, shortcut, existing = {}, originalKeyword = null) {
  if (!keyword) return 'Enter a keyword.';
  if (!isValidKeyword(keyword)) return 'Keywords can use letters, numbers, ".", "-" and "_", with no spaces.';
  if (keyword !== originalKeyword && existing[keyword]) return `"${keyword}" is already used by ${existing[keyword].name}.`;
  if (!shortcut.name) return 'Enter a name.';
  if (!isHttpUrl(shortcut.url.replace(PLACEHOLDERS, 'test'))) return 'Enter a web address that starts with https://';
  if (shortcut.type === 'advanced') {
    if (!shortcut.inputSelector) return 'Enter the selector of the text box to type into.';
  } else if (!hasPlaceholder(shortcut.url)) {
    return 'The search URL needs %s where your search words go.';
  }
  return null;
}

// Keep only known fields with the right types. Used for storage migration and import.
export function cleanShortcut(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.url !== 'string') return null;
  const type = raw.type === 'advanced' ? 'advanced' : 'simple';
  const out = {
    name: String(raw.name || '').trim().slice(0, 80),
    url: raw.url.trim(),
    type,
    enabled: raw.enabled !== false,
  };
  if (type === 'advanced') {
    out.inputSelector = String(raw.inputSelector || '').trim();
    out.buttonSelector = String(raw.buttonSelector || '').trim();
  }
  if (!out.name) out.name = hostLabel(out.url);
  return out;
}

export function cleanShortcutMap(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, value] of Object.entries(raw)) {
    const keyword = normalizeKeyword(key);
    const shortcut = cleanShortcut(value);
    if (shortcut && isValidKeyword(keyword) && !validateShortcut(keyword, shortcut)) {
      out[keyword] = shortcut;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// URLs

export function siteOrigin(url) {
  try {
    return new URL(url.replace(PLACEHOLDERS, 'x')).origin;
  } catch {
    return null;
  }
}

export function hostLabel(url) {
  try {
    return new URL(url.replace(PLACEHOLDERS, 'x')).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Where to go for a shortcut. With no query, a simple shortcut opens the site's
// home page; an advanced one opens its page as is.
export function targetUrl(shortcut, query) {
  if (shortcut.type === 'advanced') return shortcut.url;
  if (!query) return siteOrigin(shortcut.url) + '/';
  return shortcut.url.replace(PLACEHOLDERS, encodeURIComponent(query));
}

// Query-string names sites commonly use for the search words.
const QUERY_PARAMS = ['q', 'query', 'search_query', 'search', 'searchtext', 'searchterm', 'keyword',
  'keywords', 'k', 's', 'term', 'text', 'wd', 'p', '_nkw', 'field-keywords', 'kw', 'qs'];

// Turn a search results URL (copied after searching the site once) into a
// template with %s. If `sample` (the words the user searched for) is given, it
// is located directly, which also works for path-style URLs like /search/cats.
// Returns { url, found } where `found` describes what was replaced, or null.
export function templateFromResultsUrl(input, sample = '') {
  let u;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (hasPlaceholder(input)) return { url: input.trim(), found: null };

  const words = sample.trim();
  if (words) {
    for (const [name, value] of u.searchParams) {
      if (value.trim().toLowerCase() === words.toLowerCase()) {
        return { url: replaceParam(u, name), found: `the "${name}" parameter` };
      }
    }
    const encodedVariants = [encodeURIComponent(words), encodeURIComponent(words).replace(/%20/g, '+'),
      words.replace(/ /g, '+'), words.replace(/ /g, '-')];
    for (const variant of encodedVariants) {
      const idx = u.pathname.toLowerCase().indexOf(variant.toLowerCase());
      if (idx >= 0) {
        const path = u.pathname.slice(0, idx) + '%s' + u.pathname.slice(idx + variant.length);
        return { url: u.origin + path + u.search, found: 'your search words in the address' };
      }
    }
  }

  const lower = new Map([...u.searchParams.keys()].map((k) => [k.toLowerCase(), k]));
  for (const name of QUERY_PARAMS) {
    const real = lower.get(name);
    if (real && u.searchParams.get(real)) {
      return { url: replaceParam(u, real), found: `the "${real}" parameter` };
    }
  }
  return null;
}

function replaceParam(u, name) {
  const copy = new URL(u.href);
  copy.searchParams.set(name, '__OMNISEARCH__');
  // Drop pagination so the template always lands on the first page.
  for (const p of ['page', 'start', 'offset', 'first', 'pn']) copy.searchParams.delete(p);
  return copy.href.replace('__OMNISEARCH__', '%s');
}

// ---------------------------------------------------------------------------
// Address bar input

// "yt+amazon red shoes" -> { token: "yt+amazon", parts: ["yt", "amazon"], query: "red shoes" }
export function parseInput(text) {
  const trimmed = text.replace(/^\s+/, '');
  const space = trimmed.search(/\s/);
  const token = (space < 0 ? trimmed : trimmed.slice(0, space)).toLowerCase();
  const query = space < 0 ? '' : trimmed.slice(space + 1).trim();
  const parts = token.split('+').filter(Boolean);
  return { token, parts, query, hasSpace: space >= 0 };
}

// Enabled shortcuts sorted by use count, then keyword.
export function rankKeywords(shortcuts, usage = {}) {
  return Object.keys(shortcuts)
    .filter((k) => shortcuts[k].enabled)
    .sort((a, b) => (usage[b] || 0) - (usage[a] || 0) || a.localeCompare(b));
}

// Keywords whose keyword starts with, or whose name contains, `partial`.
export function matchKeywords(shortcuts, partial, usage = {}) {
  const p = partial.toLowerCase();
  const ranked = rankKeywords(shortcuts, usage);
  const byKeyword = ranked.filter((k) => k.startsWith(p));
  const byName = ranked.filter((k) => !k.startsWith(p) && shortcuts[k].name.toLowerCase().includes(p));
  return [...byKeyword, ...byName];
}

// Resolve one keyword part: exact match first, then the best prefix match.
// One letter is too little to guess from ("os i love cats" is a web search).
export function resolveKeyword(shortcuts, part, usage = {}) {
  if (shortcuts[part]?.enabled) return part;
  if ([...part].length < 2) return null;
  return rankKeywords(shortcuts, usage).find((k) => k.startsWith(part)) || null;
}

// Resolve every part of the token. Returns null unless all parts resolve.
export function resolveInput(shortcuts, text, usage = {}) {
  const parsed = parseInput(text);
  if (!parsed.parts.length) return { ...parsed, keywords: null };
  const keywords = [];
  for (const part of parsed.parts) {
    const k = resolveKeyword(shortcuts, part, usage);
    if (!k) return { ...parsed, keywords: null };
    if (!keywords.includes(k)) keywords.push(k);
  }
  return { ...parsed, keywords };
}

// Omnibox descriptions are XML.
export function escapeXml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

// ---------------------------------------------------------------------------
// Storage. Each shortcut is its own chrome.storage.sync item ("sc:<keyword>"),
// so the list isn't capped by the 8 KB per-item limit. Use counts live in
// storage.local so searching doesn't burn the sync write quota.

export async function loadShortcuts() {
  const all = await chrome.storage.sync.get(null);
  if (all.schema !== SCHEMA) return migrate(all);
  const out = {};
  for (const [key, value] of Object.entries(all)) {
    if (key.startsWith(KEY_PREFIX)) out[key.slice(KEY_PREFIX.length)] = value;
  }
  return out;
}

// Convert the 2.0 format (one "shortcuts" object) or install the defaults.
async function migrate(all) {
  const legacy = cleanShortcutMap(all.shortcuts);
  const shortcuts = Object.keys(legacy).length ? legacy : defaultShortcuts(uiLanguage());
  const items = { schema: SCHEMA };
  for (const [k, v] of Object.entries(shortcuts)) items[KEY_PREFIX + k] = v;
  await chrome.storage.sync.set(items);
  await chrome.storage.sync.remove(['shortcuts', 'firstTime']);
  return shortcuts;
}

export async function saveShortcut(keyword, shortcut, originalKeyword = null) {
  await chrome.storage.sync.set({ [KEY_PREFIX + keyword]: cleanShortcut(shortcut) });
  if (originalKeyword && originalKeyword !== keyword) {
    await chrome.storage.sync.remove(KEY_PREFIX + originalKeyword);
  }
}

export async function deleteShortcut(keyword) {
  await chrome.storage.sync.remove(KEY_PREFIX + keyword);
}

// Replace the whole list (restore defaults) or merge into it (import).
export async function writeShortcuts(shortcuts, { replace = false } = {}) {
  if (replace) {
    const all = await chrome.storage.sync.get(null);
    await chrome.storage.sync.remove(Object.keys(all).filter((k) => k.startsWith(KEY_PREFIX)));
  }
  const items = { schema: SCHEMA };
  for (const [k, v] of Object.entries(shortcuts)) items[KEY_PREFIX + k] = cleanShortcut(v);
  await chrome.storage.sync.set(items);
}

export function isShortcutChange(changes) {
  return Object.keys(changes).some((k) => k.startsWith(KEY_PREFIX));
}

export async function loadUsage() {
  const { usage } = await chrome.storage.local.get('usage');
  return usage || {};
}

export async function recordUse(keywords) {
  const usage = await loadUsage();
  for (const k of keywords) usage[k] = (usage[k] || 0) + 1;
  await chrome.storage.local.set({ usage });
}

export function uiLanguage() {
  try {
    return chrome.i18n.getUILanguage();
  } catch {
    return 'en';
  }
}

// Host permission pattern for an advanced shortcut's site.
export function originPattern(url) {
  const origin = siteOrigin(url);
  return origin ? origin + '/*' : null;
}
