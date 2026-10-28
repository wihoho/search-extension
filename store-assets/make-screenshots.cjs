// Renders the Chrome Web Store screenshots (1280x800 JPEG) into store-assets/screenshots/.
// The side panel is the real sidepanel.html and the address bar text comes from
// the real background.js; only the browser frame and web pages are mockups.
//
// Run: PLAYWRIGHT=/path/to/node_modules/playwright ROBOTO=/path/to/Roboto.ttf node store-assets/make-screenshots.cjs

const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'screenshots');
const ROBOTO = process.env.ROBOTO || '/tmp/os-fonts/Roboto.ttf';

function extensionCopy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'omnisearch-shots-'));
  for (const entry of ['manifest.json', 'background.js', 'sidepanel.html', 'sidepanel.css', 'sidepanel.js',
    'welcome.html', 'welcome.css', 'welcome.js', 'lib', 'icons', '_locales']) {
    fs.cpSync(path.join(ROOT, entry), path.join(dir, entry), { recursive: true });
  }
  fs.mkdirSync(path.join(dir, 'store-assets'));
  for (const f of ['shots.html', 'shots.css', 'shots.js']) fs.copyFileSync(path.join(__dirname, f), path.join(dir, 'store-assets', f));
  fs.copyFileSync(ROBOTO, path.join(dir, 'store-assets', 'Roboto.ttf'));
  return dir;
}

// Same font as the rest of the image, and no scrollbars, inside the real panel.
const PANEL_STYLE = `
  @font-face { font-family: "Roboto"; src: url("store-assets/Roboto.ttf"); font-weight: 100 900; }
  body { font-family: "Roboto", sans-serif; }
  ::-webkit-scrollbar { display: none; }`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ext = extensionCopy();
  const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'omnisearch-shots-profile-')), {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 800 },
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--lang=en-US'],
    env: { ...process.env, LANG: 'en_US.UTF-8', LANGUAGE: 'en_US' }, // US Amazon and Wikipedia defaults
  });
  const sw = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker');
  const base = sw.url().replace('background.js', '');

  // Wait for the default shortcuts, then add a few and some use counts so the
  // panel looks lived-in.
  for (let i = 0; i < 50 && !(await sw.evaluate(() => chrome.storage.sync.get('schema'))).schema; i++) await new Promise((r) => setTimeout(r, 100));
  await sw.evaluate(async () => {
    const add = (name, url) => ({ name, url, type: 'simple', enabled: true });
    const { 'sc:spotify': spotify } = await chrome.storage.sync.get('sc:spotify');
    await chrome.storage.sync.set({
      'sc:maps': add('Google Maps', 'https://www.google.com/maps/search/%s'),
      'sc:so': add('Stack Overflow', 'https://stackoverflow.com/search?q=%s'),
      'sc:pplx': add('Perplexity', 'https://www.perplexity.ai/search?q=%s'),
      'sc:spotify': { ...spotify, enabled: false },
    });
    await chrome.storage.local.set({ usage: { youtube: 42, amazon: 27, wikipedia: 19, maps: 15, drive: 12, github: 9, gmail: 6, pplx: 5, ai: 4, so: 3 } });
  });
  await new Promise((r) => setTimeout(r, 500));
  const omnibox = (text) => sw.evaluate((t) => omnisearch.onInputChanged(t, () => {}), text);

  const heroInput = 'youtube how to make sourdough';
  const hero = { input: heroInput, ...(await omnibox(heroInput)) };
  hero.suggestions = hero.suggestions.slice(0, 5);
  const cards = [];
  for (const input of ['youtube', 'you cats', 'youtube+amazon headphones', 'best pizza near me']) {
    cards.push({ input, description: (await omnibox(input)).description });
  }

  const page = await ctx.newPage();
  for (const n of [1, 2, 3, 4, 5]) {
    await page.goto(`${base}store-assets/shots.html`);
    if (n === 4) {
      // What the right-click item leaves for the panel. Set only after the previous
      // shot's panel is gone, or that panel would take it.
      await sw.evaluate(() => chrome.storage.session.set({ pendingAdd: {
        name: 'Recipe Box', url: 'https://recipebox.example/search?q=%s', how: 'form', at: Date.now() } }));
    }
    await page.evaluate(([n, data]) => window.renderShot(n, data), [n, { hero, cards }]);
    const iframe = await page.$('iframe');
    if (iframe) {
      const frame = await iframe.contentFrame();
      await frame.waitForLoadState();
      await frame.addStyleTag({ content: PANEL_STYLE });
      await frame.waitForSelector('#list .item', { state: 'attached' });
      if (n === 4) await frame.waitForFunction(() => document.querySelector('#f-url').value.includes('recipebox'));
      if (n === 5) await frame.click('#browse-btn');
      await frame.evaluate(() => document.activeElement?.blur());
      const view = await frame.evaluate(() => ['view-list', 'view-form', 'view-catalog'].find((id) => !document.getElementById(id).hidden));
      console.log(`shot ${n}: panel shows ${view}`);
    }
    await page.mouse.move(5, 5); // no hover highlight in the panel
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500); // favicons
    const file = path.join(OUT, `omnisearch-${n}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
    console.log(file);
  }
  await ctx.close();
})();
