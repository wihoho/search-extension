// Run: node --test tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultShortcuts, catalog, parseInput, resolveInput, matchKeywords, targetUrl, templateFromResultsUrl,
  validateShortcut, cleanShortcutMap, escapeXml, isValidKeyword, originPattern,
} from '../lib/shortcuts.js';

const sc = defaultShortcuts('en-US');

test('defaults: 10 valid shortcuts, localized stores', () => {
  assert.equal(Object.keys(sc).length, 10);
  for (const [k, v] of Object.entries(sc)) assert.equal(validateShortcut(k, v), null, k);
  assert.match(defaultShortcuts('de-DE').amazon.url, /amazon\.de/);
  assert.match(defaultShortcuts('pt-BR').amazon.url, /amazon\.com\.br/);
  assert.match(defaultShortcuts('ja').wikipedia.url, /^https:\/\/ja\.wikipedia/);
  assert.match(defaultShortcuts('ko').amazon.url, /www\.amazon\.com\//);
});

test('catalog entries are valid and keywords unique', () => {
  const entries = catalog('en');
  assert.equal(new Set(entries.map((e) => e.keyword)).size, entries.length);
  for (const e of entries) assert.equal(validateShortcut(e.keyword, { ...e, type: 'simple' }), null, e.keyword);
});

test('parseInput splits keyword, multi-keyword and query', () => {
  assert.deepEqual(parseInput('YouTube  red shoes '), { token: 'youtube', parts: ['youtube'], query: 'red shoes', hasSpace: true });
  assert.deepEqual(parseInput('yt+amazon cats').parts, ['yt', 'amazon']);
  assert.equal(parseInput('youtube').hasSpace, false);
  assert.equal(parseInput('').token, '');
});

test('resolveInput: exact, prefix, usage ranking, multi, unknown', () => {
  assert.deepEqual(resolveInput(sc, 'youtube cats').keywords, ['youtube']);
  assert.deepEqual(resolveInput(sc, 'you cats').keywords, ['youtube']);
  // "gi" prefixes github and gitlab: the more used one wins.
  const git = { ...sc, gitlab: { name: 'GitLab', url: 'https://gitlab.com/search?search=%s', type: 'simple', enabled: true } };
  assert.deepEqual(resolveInput(git, 'gi x', { github: 5 }).keywords, ['github']);
  assert.deepEqual(resolveInput(git, 'gi x', { gitlab: 5 }).keywords, ['gitlab']);
  // A single letter is never guessed, but an exact one-letter keyword works.
  assert.equal(resolveInput(sc, 'i love cats').keywords, null);
  assert.deepEqual(resolveInput(sc, 'x news').keywords, ['x']);
  assert.deepEqual(resolveInput(sc, 'youtube+amazon cats').keywords, ['youtube', 'amazon']);
  assert.equal(resolveInput(sc, 'pizza near me').keywords, null);
  assert.equal(resolveInput(sc, 'youtube+pizza cats').keywords, null);
  const off = { ...sc, youtube: { ...sc.youtube, enabled: false } };
  assert.equal(resolveInput(off, 'youtube cats').keywords, null);
});

test('matchKeywords finds by keyword prefix then name', () => {
  assert.deepEqual(matchKeywords(sc, 'g').slice(0, 2).sort(), ['github', 'gmail']);
  assert.ok(matchKeywords(sc, 'twitter').includes('x'));
});

test('targetUrl encodes the query, replaces every %s, opens home page without a query', () => {
  assert.equal(targetUrl(sc.youtube, 'a&b c'), 'https://www.youtube.com/results?search_query=a%26b%20c');
  assert.equal(targetUrl({ type: 'simple', url: 'https://x.test/%s?again=%s' }, 'q'), 'https://x.test/q?again=q');
  assert.equal(targetUrl({ type: 'simple', url: 'https://x.test/s?q={searchTerms}' }, 'q'), 'https://x.test/s?q=q');
  assert.equal(targetUrl(sc.youtube, ''), 'https://www.youtube.com/');
  assert.equal(targetUrl({ type: 'advanced', url: 'https://chat.test/new' }, 'hi'), 'https://chat.test/new');
});

test('templateFromResultsUrl finds the search words', () => {
  assert.equal(templateFromResultsUrl('https://shop.test/search?q=red+shoes&page=3').url, 'https://shop.test/search?q=%s');
  assert.equal(templateFromResultsUrl('https://www.ebay.com/sch/i.html?_nkw=lamp&_sacat=0').url, 'https://www.ebay.com/sch/i.html?_nkw=%s&_sacat=0');
  assert.equal(templateFromResultsUrl('https://site.test/find?foo=1&xyz=lamp', 'lamp').url, 'https://site.test/find?foo=1&xyz=%s');
  assert.equal(templateFromResultsUrl('https://unsplash.com/s/photos/red-car', 'red car').url, 'https://unsplash.com/s/photos/%s');
  assert.equal(templateFromResultsUrl('https://site.test/a/b'), null);
  assert.equal(templateFromResultsUrl('not a url'), null);
  assert.equal(templateFromResultsUrl('https://s.test/?q=%s').url, 'https://s.test/?q=%s');
});

test('validateShortcut', () => {
  const ok = { name: 'S', url: 'https://s.test/?q=%s', type: 'simple' };
  assert.equal(validateShortcut('s', ok), null);
  assert.match(validateShortcut('has space', ok), /no spaces/);
  assert.match(validateShortcut('a+b', ok), /no spaces/);
  assert.match(validateShortcut('youtube', ok, sc), /already used/);
  assert.equal(validateShortcut('youtube', ok, sc, 'youtube'), null);
  assert.match(validateShortcut('s', { ...ok, url: 'https://s.test/' }), /%s/);
  assert.match(validateShortcut('s', { ...ok, url: 'javascript:alert(1)//%s' }), /https/);
  assert.match(validateShortcut('s', { ...ok, type: 'advanced', url: 'https://s.test/' }), /selector/);
  assert.equal(validateShortcut('s', { ...ok, type: 'advanced', url: 'https://s.test/', inputSelector: 'textarea' }), null);
  assert.ok(isValidKeyword('维基'));
});

test('cleanShortcutMap migrates the 2.0 format and drops junk', () => {
  const legacy = {
    ai: { name: 'AI Studio', keyword: 'ai', type: 'advanced', url: 'https://aistudio.google.com/prompts/new_chat',
      inputSelector: 'textarea', buttonSelector: 'button', enabled: true, icon: 'https://x/icon.png' },
    YouTube: { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=%s', enabled: false, icon: 'x' },
    bad: { name: 'Bad', url: 'ftp://x/%s' },
    'two words': { name: 'X', url: 'https://x.test/?q=%s' },
    nourl: { name: 'N' },
  };
  const out = cleanShortcutMap(legacy);
  assert.deepEqual(Object.keys(out).sort(), ['ai', 'youtube']);
  assert.deepEqual(out.ai, { name: 'AI Studio', url: 'https://aistudio.google.com/prompts/new_chat', type: 'advanced',
    enabled: true, inputSelector: 'textarea', buttonSelector: 'button' });
  assert.equal(out.youtube.enabled, false);
  assert.equal(out.youtube.icon, undefined);
});

test('escapeXml and originPattern', () => {
  assert.equal(escapeXml(`<b>&"'`), '&lt;b&gt;&amp;&quot;&apos;');
  assert.equal(originPattern('https://chat.test/new?x=%s'), 'https://chat.test/*');
});
