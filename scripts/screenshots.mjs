// Captures phone-sized README screenshots from a running app (default: the Vite dev server).
// Run `npm run dev` first, then `npm run shots` (or BASE=https://pokeimposter.vercel.app npm run shots).
// Uses your installed Chrome through playwright-core, so no browser download.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:5173';
const OUT = 'docs/screens';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const settle = () => page.waitForTimeout(700);

// 1. Setup
await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.reload();
for (const [i, name] of ['Rasheed', 'Hassan', 'Arafat'].entries()) await page.fill(`input[data-i="${i}"]`, name);
await page.waitForLoadState('networkidle');
await shot('1-setup');
await page.locator('.modes').scrollIntoViewIfNeeded();
await page.click('[data-mode="rocket"]');
await page.locator('.setup .panel').nth(1).screenshot({ path: `${OUT}/modes.png` });
await page.click('[data-mode="ditto"]');

// 2. Pick your name
await page.click('button[type="submit"]');
await page.waitForSelector('.who-btn');
await settle();
await shot('2-pick');
const base = (await page.evaluate(() => location.hash)).replace(/\/1$/, '');

// 3. Find a round where Rasheed (player 0) holds a Pokémon, and one where he's the Ditto.
const roundWhere = async (want) => {
  for (let r = 1; r < 60; r++) {
    await page.evaluate((h) => (location.hash = h), `${base}/${r}/0`);
    const kind = await page.evaluate(() =>
      document.querySelector('.front-ditto') ? 'ditto' : document.querySelector('.front .kicker')?.textContent);
    if (kind === want) return r;
  }
  throw new Error(`no round with ${want}`);
};
const peek = async (name) => {
  const box = await page.locator('.card').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await settle();
  await shot(name);
  await page.mouse.up();
};

await roundWhere('Pokémon');
await page.waitForLoadState('networkidle');
await settle();
await shot('3-card-hidden');
await peek('4-card-peek');

await roundWhere('ditto');
await page.waitForLoadState('networkidle');
await peek('5-ditto');

// 4. Reveal
await page.click('[data-reveal]');
await page.click('[data-reveal]', { force: true }); // it pulses once armed
await page.locator('.reveal').scrollIntoViewIfNeeded();
await page.waitForLoadState('networkidle');
await settle();
await shot('6-reveal');

await browser.close();
console.log(`screenshots saved to ${OUT}/`);
