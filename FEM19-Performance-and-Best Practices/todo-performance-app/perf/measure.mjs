// Measures how much change-detection work a scripted interaction causes.
//
//   npm start                                   (in another terminal, dev build)
//   node perf/measure.mjs http://localhost:4200 [label]
//
// How it counts: Chrome's precise code coverage reports how many times each
// function ran. Every Angular template is compiled to a function named
// "<Component>_Template", and Angular runs it once per change-detection pass
// that checks that component (or embedded view). So "template runs" is a direct
// measure of how much of the UI Angular re-checks. The legacy app's expensive
// getStats() method is counted separately.
//
// Set CHROME_BIN if Chrome is not at /usr/bin/google-chrome.
import { chromium } from 'playwright-core';

const url = process.argv[2] ?? 'http://localhost:4200';
const label = process.argv[3] ?? 'run';
const EXTRA_TODOS = 50;

const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN ?? '/usr/bin/google-chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
const cdp = await page.context().newCDPSession(page);
await cdp.send('Profiler.enable');
await cdp.send('Performance.enable');

await page.goto(url);
await page.waitForSelector('input');

// Setup: a realistic list, so per-item cost is visible.
const input = page.locator('input[type="text"], input:not([type])').first();
for (let i = 1; i <= EXTRA_TODOS; i++) {
  await input.fill(`Task number ${i}`);
  await input.press('Enter');
}
await page.waitForTimeout(500);

async function snapshot() {
  const { result } = await cdp.send('Profiler.takePreciseCoverage');
  const counts = {};
  for (const script of result) {
    for (const fn of script.functions) {
      if (!fn.functionName) continue;
      const calls = fn.ranges[0]?.count ?? 0;
      counts[fn.functionName] = (counts[fn.functionName] ?? 0) + calls;
    }
  }
  const metrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  return { counts, scriptMs: metrics.ScriptDuration * 1000 };
}

async function measure(name, action) {
  await cdp.send('Profiler.startPreciseCoverage', { callCount: true, detailed: false });
  const before = await snapshot(); // takePreciseCoverage also RESETS the counters,
  // so `after` below holds exactly the calls made during the action.
  await action();
  await page.waitForTimeout(300);
  const after = await snapshot();
  await cdp.send('Profiler.stopPreciseCoverage');

  let templateRuns = 0;
  const byTemplate = {};
  for (const [fn, n] of Object.entries(after.counts)) {
    const delta = n;
    if (delta > 0 && /_Template$/.test(fn)) {
      templateRuns += delta;
      byTemplate[fn] = delta;
    }
  }
  const getStats = after.counts['getStats'] ?? 0;
  return { name, templateRuns, getStatsCalls: getStats, scriptMs: Math.round((after.scriptMs - before.scriptMs) * 10) / 10, byTemplate };
}

const results = [];
results.push(
  await measure('mouse moved 200 times over the list', async () => {
    for (let i = 0; i < 200; i++) await page.mouse.move(100 + (i % 50) * 8, 150 + (i % 20) * 20);
  }),
);
results.push(
  await measure('typed 30 characters in the input', async () => {
    await input.click();
    await page.keyboard.type('abcdefghijklmnopqrstuvwxyz1234', { delay: 5 });
  }),
);
await input.fill('');
results.push(
  await measure('ticked one task as done', async () => {
    await page.locator('input[type="checkbox"]').first().click();
  }),
);
results.push(
  await measure('added one task', async () => {
    await input.fill('One more task');
    await input.press('Enter');
  }),
);

console.log(JSON.stringify({ label, url, todosInList: EXTRA_TODOS + 2, results }, null, 2));
await browser.close();
