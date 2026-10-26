// Quick visual/XSS smoke check: node perf/check-ui.mjs http://localhost:4200 out.png
import { chromium } from 'playwright-core';
const [url = 'http://localhost:4200', out = 'ui.png'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN ?? '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 700, height: 900 } });
const dialogs = [];
page.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss(); });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url);
await page.waitForTimeout(800);
const input = page.locator('input').first();
for (const text of ['Plain task', '<img src=x onerror="alert(\'xss\')">Image payload', '<script>alert("xss")</script>', '<b>bold</b> allowed']) {
  await input.fill(text); await input.press('Enter');
}
await page.waitForTimeout(300);
console.log('header:', JSON.stringify(await page.locator('h1').innerHTML()));
console.log('rows:', JSON.stringify(await page.locator('span.text-gray-700').allTextContents()));
console.log('alerts fired:', dialogs.length, 'console errors:', errors.length);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
