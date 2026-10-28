// Renders icons/icon{16,32,48,128}.png from the SVGs in this folder (8x, then downscaled).
// Run: PLAYWRIGHT=/path/to/node_modules/playwright node store-assets/icon/render.cjs && python3 store-assets/icon/downscale.py
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const SIZES = { 16: 'icon-16.svg', 32: 'icon-toolbar.svg', 48: 'icon-toolbar.svg', 128: 'icon.svg' };
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [size, file] of Object.entries(SIZES)) {
    const big = size * 8;
    const svg = fs.readFileSync(path.join(__dirname, file), 'utf8').replace('<svg ', `<svg width="${big}" height="${big}" `);
    await page.setViewportSize({ width: big, height: big });
    await page.setContent(`<style>html,body{margin:0;background:transparent}</style>${svg}`);
    await page.locator('svg').screenshot({ path: `/tmp/omnisearch-icon-${size}@8x.png`, omitBackground: true });
  }
  await browser.close();
})();
