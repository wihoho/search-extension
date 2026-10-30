// End-to-end test: loads the extension in Chromium and drives the address bar
// handlers, the side panel page and the in-page scripts against a local site.
//
// Run: PLAYWRIGHT=/path/to/node_modules/playwright node tests/e2e.cjs [screenshot-dir]

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const assert = require('assert/strict');
const { pathToFileURL } = require('url');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

const ROOT = path.resolve(__dirname, '..');
const shotDir = process.argv[2];

const PAGES = {
  '/': `<form action="/search"><input type="hidden" name="src" value="box">
        <input name="q" id="q"><select name="cat"><option value="all" selected>All</option></select>
        <input type="checkbox" name="exact" value="1"><button>Go</button></form>`,
  '/os': `<link rel="search" type="application/opensearchdescription+xml" href="/osd.xml"><p>No form here</p>`,
  '/chat': `<textarea id="box"></textarea><button id="send" disabled>Send</button>
        <script>
          box.addEventListener('input', () => { send.disabled = !box.value; });
          send.addEventListener('click', () => { document.title = 'sent:' + box.value; });
        </script>`,
  '/rich': `<div id="ed" contenteditable="true"></div>
        <script>
          ed.addEventListener('keydown', (e) => { if (e.key === 'Enter') document.title = 'sent:' + ed.textContent; });
        </script>`,
};

function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/osd.xml') {
      res.setHeader('Content-Type', 'application/opensearchdescription+xml');
      return res.end(`<?xml version="1.0"?><OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
        <ShortName>Local</ShortName>
        <Url type="text/html" template="http://localhost:${server.address().port}/find?term={searchTerms}&amp;page={startPage?}"/>
        </OpenSearchDescription>`);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const body = PAGES[url.pathname] ?? `<title>results:${url.searchParams.get('q') ?? url.searchParams.get('term')}</title>`;
    res.end(`<!doctype html><meta charset="utf-8"><body>${body}</body>`);
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

// Copy of the extension that is already allowed on localhost, because tests
// can't click Chrome's permission prompt for the advanced shortcuts.
function extensionCopy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'omnisearch-ext-'));
  for (const entry of ['manifest.json', 'background.js', 'sidepanel.html', 'sidepanel.css', 'sidepanel.js',
    'welcome.html', 'welcome.css', 'welcome.js', 'lib', 'icons', '_locales']) {
    fs.cpSync(path.join(ROOT, entry), path.join(dir, entry), { recursive: true });
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  manifest.host_permissions = ['http://localhost/*'];
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
  return dir;
}

let passed = 0;
async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`ok - ${name}`);
  } catch (error) {
    console.log(`FAIL - ${name}\n  ${error.stack.split('\n').slice(0, 4).join('\n  ')}`);
    process.exitCode = 1;
  }
}

const until = async (check, ms = 8000) => {
  const start = Date.now();
  for (;;) {
    const value = await check();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${check}`);
    await new Promise((r) => setTimeout(r, 100));
  }
};

(async () => {
  const server = await startServer();
  const site = `http://localhost:${server.address().port}`;
  const ext = extensionCopy();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'omnisearch-profile-'));
  const ctx = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    acceptDownloads: true,
    viewport: { width: 400, height: 900 },
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
  const sw = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker');
  const extUrl = (p) => sw.url().replace('background.js', p);
  const storage = () => sw.evaluate(() => chrome.storage.sync.get(null));
  const scKeys = (all) => Object.keys(all).filter((k) => k.startsWith('sc:')).map((k) => k.slice(3)).sort();
  const pageWith = (match) => until(() => ctx.pages().find((p) => match(p.url())));
  const { detectSearchUrl, fillAndSubmit } = await import(pathToFileURL(path.join(ROOT, 'lib/page-scripts.js')));

  await step('fresh install: welcome page and 10 default shortcuts', async () => {
    const welcome = await pageWith((u) => u.endsWith('/welcome.html'));
    await until(async () => (await welcome.locator('.shortcut-card').count()) === 10);
    const all = await until(async () => { const s = await storage(); return s.schema === 2 && s; });
    assert.equal(scKeys(all).length, 10);
    assert.equal(all['sc:ai'].url, 'https://chatgpt.com/?q=%s');
  });

  await sw.evaluate(async (site) => {
    await chrome.storage.sync.set({
      'sc:loc': { name: 'Local', url: `${site}/search?q=%s`, type: 'simple', enabled: true },
      'sc:loc2': { name: 'Local Two', url: `${site}/search?q=two+%s`, type: 'simple', enabled: true },
      'sc:chat': { name: 'Chat', url: `${site}/chat`, type: 'advanced', enabled: true, inputSelector: '#box', buttonSelector: '#send' },
      'sc:rich': { name: 'Rich', url: `${site}/rich`, type: 'advanced', enabled: true, inputSelector: '#ed', buttonSelector: '' },
      'sc:broken': { name: 'Broken', url: `${site}/chat`, type: 'advanced', enabled: true, inputSelector: '#nope', buttonSelector: '' },
    });
  }, site);
  const changed = (text) => sw.evaluate((t) => omnisearch.onInputChanged(t, () => {}), text);
  const entered = (text, disposition = 'newForegroundTab') => sw.evaluate(([t, d]) => omnisearch.onInputEntered(t, d), [text, disposition]);

  await step('address bar suggestions', async () => {
    let r = await changed('you cats');
    assert.match(r.description, /Search <match>YouTube<\/match> for <match>cats<\/match>/);
    assert.equal(r.suggestions.length, 5);
    assert.ok(r.suggestions.every((s) => s.content.endsWith(' cats')));
    r = await changed('youtube');
    assert.match(r.description, /Open <match>YouTube<\/match> <url>youtube.com<\/url>/);
    r = await changed('g');
    assert.match(r.description, /Search the web for <match>g<\/match>/);
    assert.ok(r.suggestions.some((s) => /gmail|github/.test(s.content)));
    r = await changed('gm');
    assert.match(r.description, /Open <match>Gmail<\/match>/);
    r = await changed('pizza <near> & me');
    assert.match(r.description, /Search the web for <match>pizza &lt;near&gt; &amp; me<\/match>/);
    r = await changed('');
    assert.match(r.description, /Type a keyword/);
    r = await changed('loc+loc2 red');
    assert.match(r.description, /Local, Local Two/);
  });

  await step('Enter: search, open site, several sites, current tab', async () => {
    await entered('loc red shoes');
    await pageWith((u) => u === `${site}/search?q=red%20shoes`);
    await entered('loc');
    await pageWith((u) => u === `${site}/`);
    await entered('loc+loc2 lamp');
    await pageWith((u) => u === `${site}/search?q=lamp`);
    await pageWith((u) => u === `${site}/search?q=two+lamp`);
    const page = await ctx.newPage();
    await page.goto(`${site}/start`);
    await page.bringToFront();
    const before = ctx.pages().length;
    await entered('loc here', 'currentTab');
    await page.waitForURL(`${site}/search?q=here`);
    assert.equal(ctx.pages().length, before);
    const usage = await sw.evaluate(() => chrome.storage.local.get('usage'));
    assert.ok(usage.usage.loc >= 4);
  });

  await step('Enter with no matching keyword runs a web search', async () => {
    const pagePromise = ctx.waitForEvent('page');
    await entered('zzqx omnisearch');
    const page = await pagePromise;
    await until(() => /zzqx/.test(page.url()));
  });

  await step('advanced shortcuts type into the page (textarea + button, contenteditable + Enter)', async () => {
    await entered('chat hello world');
    const chat = await pageWith((u) => u === `${site}/chat`);
    await until(async () => (await chat.title()) === 'sent:hello world');
    await entered('rich hi there');
    const rich = await pageWith((u) => u === `${site}/rich`);
    await until(async () => (await rich.title()) === 'sent:hi there');
  });

  await step('advanced shortcut that fails shows a red ! on the toolbar icon', async () => {
    const pagePromise = ctx.waitForEvent('page');
    await entered('broken test');
    const page = await pagePromise;
    await page.waitForLoadState();
    const badge = await until(() => sw.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const text = await chrome.action.getBadgeText({ tabId: tab.id });
      return text && { text, title: await chrome.action.getTitle({ tabId: tab.id }) };
    }), 20000);
    assert.equal(badge.text, '!');
    assert.match(badge.title, /Couldn't find the text box "#nope"/);
  });

  await step('detect search URL from a form field and from OpenSearch', async () => {
    const page = await ctx.newPage();
    await page.goto(`${site}/`);
    await page.focus('#q');
    assert.deepEqual(await page.evaluate(detectSearchUrl, true),
      { name: 'localhost', url: `${site}/search?src=box&q=%s&cat=all`, how: 'form' });
    await page.goto(`${site}/os`);
    assert.deepEqual(await page.evaluate(detectSearchUrl, false),
      { name: 'localhost', url: `${site}/find?term=%s`, how: 'opensearch' });
    await page.close();
  });

  await step('fillAndSubmit reports a missing text box', async () => {
    const page = await ctx.newPage();
    await page.goto(`${site}/chat`);
    const result = await page.evaluate(([f, ...args]) => eval(`(${f})`)(...args), [fillAndSubmit.toString(), 'x', '#missing', '']);
    // eval'd copy uses a 15 s timeout; just check the shape.
    assert.equal(result.ok, false);
    await page.close();
  });

  await step('asks for a review after the 5th search: one address bar row, once per session', async () => {
    await sw.evaluate(() => chrome.storage.local.set({ usage: { loc: 5 }, rate: { askAt: 5, done: false, omniboxShown: 0 } }));
    await sw.evaluate(() => omnisearch.onInputChanged('', () => {})); // nothing changes without a session start
    const r = await changed('loc cats');
    const row = r.suggestions.at(-1);
    assert.equal(row.content, '★ review OmniSearch');
    assert.ok(r.suggestions.length <= 5);
    const pagePromise = ctx.waitForEvent('page');
    await entered('★ review OmniSearch');
    const page = await pagePromise;
    await until(() => /\/reviews/.test(page.url()));
    const { rate } = await sw.evaluate(() => chrome.storage.local.get('rate'));
    assert.equal(rate.done, true);
    assert.ok(!(await changed('loc cats')).suggestions.some((s) => s.content === '★ review OmniSearch'));
    await page.close();
  });

  const panel = await ctx.newPage();
  await panel.goto(extUrl('sidepanel.html'));
  const items = () => panel.locator('#list .item').count();

  await step('side panel review banner: shows after 5 searches, "Later" hides it', async () => {
    await sw.evaluate(() => chrome.storage.local.set({ rate: { askAt: 5, done: false, omniboxShown: 0 } }));
    await until(async () => panel.isVisible('#rate'));
    await panel.click('#rate-later');
    await until(async () => panel.isHidden('#rate'));
    const { rate, usage } = await sw.evaluate(() => chrome.storage.local.get(['rate', 'usage']));
    const uses = Object.values(usage).reduce((a, b) => a + b, 0);
    assert.equal(rate.askAt, uses + 20);
    await sw.evaluate(() => chrome.storage.local.set({ rate: { askAt: 5, done: true, omniboxShown: 0 } }));
  });

  await step('side panel lists shortcuts and filters', async () => {
    await until(async () => (await items()) === 15);
    // localhost access is granted in this test build, so no "Needs access" warning.
    assert.equal(await panel.locator('.item .warn').count(), 0);
    await panel.fill('#filter', 'two'); // name
    await until(async () => (await items()) === 1);
    await panel.fill('#filter', 'localhost'); // site address
    await until(async () => (await items()) === 5);
    await panel.fill('#filter', 'nothing-matches');
    await until(async () => panel.isVisible('#empty'));
    await panel.fill('#filter', '');
    await until(async () => (await items()) === 15);
  });

  await step('add a shortcut by pasting a results page address', async () => {
    await panel.click('#add-btn');
    await panel.fill('#f-url', `${site}/search?q=lamp&page=2`);
    await panel.locator('#f-url').dispatchEvent('change');
    assert.equal(await panel.inputValue('#f-url'), `${site}/search?q=%s`);
    assert.match(await panel.textContent('#form-note'), /"q" parameter/);
    assert.equal(await panel.inputValue('#f-name'), 'Localhost');
    await panel.fill('#f-keyword', 'Lamp');
    assert.equal(await panel.textContent('#f-example'), 'os lamp your search');
    await panel.click('button[type=submit]');
    await until(async () => (await storage())['sc:lamp']?.url === `${site}/search?q=%s`);
    await until(async () => !(await panel.isHidden('#view-list')));
  });

  await step('form validation: duplicate keyword and missing %s', async () => {
    await panel.click('#add-btn');
    await panel.fill('#f-url', 'https://example.com/');
    await panel.fill('#f-name', 'Ex');
    await panel.fill('#f-keyword', 'youtube');
    await panel.click('button[type=submit]');
    assert.match(await panel.textContent('#form-error'), /already used by YouTube/);
    await panel.fill('#f-keyword', 'ex');
    await panel.click('button[type=submit]');
    assert.match(await panel.textContent('#form-error'), /needs %s/);
    await panel.keyboard.press('Escape');
  });

  await step('turn off, delete and undo', async () => {
    await panel.locator('.item', { hasText: 'YouTube' }).locator('.switch').click();
    await until(async () => (await storage())['sc:youtube'].enabled === false);
    await panel.locator('.item', { has: panel.locator('code', { hasText: /^lamp$/ }) }).getByLabel(/Delete/).click();
    await until(async () => !(await storage())['sc:lamp']);
    await panel.click('#toast-undo');
    await until(async () => !!(await storage())['sc:lamp']);
  });

  await step('suggested shortcuts', async () => {
    await panel.click('#browse-btn');
    const row = panel.locator('#catalog .item', { hasText: 'Perplexity' });
    await row.getByRole('button', { name: 'Add' }).click();
    await until(async () => (await storage())['sc:pplx']?.url === 'https://www.perplexity.ai/search?q=%s');
    await until(async () => (await row.getByRole('button').textContent()) === 'Added');
    if (shotDir) await panel.screenshot({ path: path.join(shotDir, 'catalog.png') });
    await panel.locator('#view-catalog [data-back]').click();
  });

  await step('context menu result opens a prefilled form', async () => {
    await sw.evaluate((url) => chrome.storage.session.set({ pendingAdd: { name: 'Local Docs', url, how: 'opensearch', at: Date.now() } }),
      `${site}/find?term=%s`);
    await until(async () => (await panel.inputValue('#f-url')) === `${site}/find?term=%s`);
    assert.equal(await panel.inputValue('#f-name'), 'Local Docs');
    assert.equal(await panel.inputValue('#f-keyword'), 'localhost');
    assert.match(await panel.textContent('#form-note'), /search settings/);
    if (shotDir) await panel.screenshot({ path: path.join(shotDir, 'add-form.png') });
    await panel.keyboard.press('Escape');
  });

  await step('export and import', async () => {
    await panel.click('#menu-btn');
    const downloadPromise = panel.waitForEvent('download');
    await panel.click('[data-cmd=export]');
    const file = await (await downloadPromise).path();
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(data.format, 'omnisearch');
    assert.ok(data.shortcuts.lamp);
    const importFile = path.join(os.tmpdir(), 'omnisearch-import.json');
    fs.writeFileSync(importFile, JSON.stringify({ shortcuts: { wiki2: { name: 'Wiki 2', url: 'https://de.wikipedia.org/w/index.php?search=%s' } } }));
    await panel.setInputFiles('#import-file', importFile);
    await until(async () => (await storage())['sc:wiki2']);
    assert.match(await panel.textContent('#toast-text'), /Imported 1 shortcut/);
  });

  if (shotDir) {
    await panel.fill('#filter', '');
    await panel.screenshot({ path: path.join(shotDir, 'list.png') });
  }

  await step('restore defaults', async () => {
    await panel.click('#menu-btn');
    await panel.click('[data-cmd=reset]');
    await panel.click('#confirm-ok');
    await until(async () => scKeys(await storage()).length === 10);
    await until(async () => (await items()) === 10);
  });

  await step('migrates 2.0 storage (single "shortcuts" object)', async () => {
    await sw.evaluate(async () => {
      await chrome.storage.sync.set({
        firstTime: false,
        shortcuts: {
          ai: { name: 'AI Studio', keyword: 'ai', type: 'advanced', url: 'https://aistudio.google.com/prompts/new_chat',
            inputSelector: 'textarea', buttonSelector: 'button[aria-label*="Run"]:not([disabled])', enabled: true, icon: 'x' },
          youtube: { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=%s', enabled: false, icon: 'x' },
          mine: { name: 'My Site', url: 'https://mine.example/?s=%s', enabled: true, type: 'simple', icon: 'x' },
        },
      });
      const all = await chrome.storage.sync.get(null);
      await chrome.storage.sync.remove(['schema', ...Object.keys(all).filter((k) => k.startsWith('sc:'))]);
    });
    // Migration writes the new items first and deletes the old object last.
    const all = await until(async () => { const s = await storage(); return s.schema === 2 && !s.shortcuts && s; });
    assert.deepEqual(scKeys(all), ['ai', 'mine', 'youtube']);
    assert.equal(all.shortcuts, undefined);
    assert.equal(all['sc:youtube'].enabled, false);
    await until(async () => (await items()) === 3);
    // The old advanced shortcut has lost its blanket site access, so it asks for it.
    await until(async () => (await panel.locator('.item', { hasText: 'AI Studio' }).locator('.warn').count()) === 1);
    if (shotDir) await panel.screenshot({ path: path.join(shotDir, 'migrated.png') });
  });

  console.log(`\n${passed} passed${process.exitCode ? ', some FAILED' : ''}`);
  await ctx.close();
  server.close();
})();
