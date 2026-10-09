// Captures phone-sized README screenshots and the card gallery from a running app (default: the Vite dev server).
// Run `npm run dev` first, then `npm run shots`. The gallery imports the app's own modules, so it needs the dev server.
// Uses your installed Chrome through playwright-core, so no browser download.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:5173';
const OUT = 'docs/screens';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });

// ---- Card gallery: four showcase cards rendered by the app's own card code ----
const SHOWCASE = [['pokemon', 6], ['move', 53], ['ability', 22], ['item', 211]]; // Charizard, Flamethrower, Intimidate, Leftovers
const W = 300;
const gallery = await browser.newPage({ viewport: { width: SHOWCASE.length * (W + 20) + 20, height: W * 1.4 + 40 }, deviceScaleFactor: 2 });
await gallery.goto(BASE);
await gallery.evaluate(async ({ list, w }) => {
  const { buildPools, GENERATIONS } = await import('/src/engine/pools.ts');
  const { cardFront } = await import('/src/ui/cards.ts');
  const { loadText } = await import('/src/ui/text.ts');
  const text = await loadText();
  const pools = buildPools(GENERATIONS);
  const g = document.createElement('div');
  g.id = 'gallery';
  g.style.cssText = 'position:fixed;inset:0;z-index:99;display:flex;gap:20px;padding:20px;background:#10142A';
  g.innerHTML = list.map(([cat, id]) => {
    const card = pools[cat].find((c) => c.id === id);
    return `<div class="card peek" style="width:${w}px;flex:none"><span class="card-inner" style="transition:none"><span class="face back"></span>${cardFront(card, text)}</span></div>`;
  }).join('');
  document.body.append(g);
}, { list: SHOWCASE, w: W });
await gallery.waitForLoadState('networkidle');
await gallery.waitForTimeout(500);
await gallery.locator('#gallery').screenshot({ path: 'docs/cards.png' });
await gallery.close();

// ---- The phone flow ----
const page = await browser.newPage({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const settle = () => page.waitForTimeout(700);

// 1. Setup
await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.reload();
for (const [i, name] of ['Ash', 'Misty', 'Brock'].entries()) await page.fill(`input[data-i="${i}"]`, name);
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

// 3. Find a round where Ash (player 0) holds a dual-type Pokémon, and one where Ash is the Ditto.
const roundWhere = async (want) => {
  for (let r = 1; r < 80; r++) {
    await page.evaluate((h) => (location.hash = h), `${base}/${r}/0`);
    const kind = await page.evaluate(() => {
      const f = document.querySelector('.front');
      if (f.classList.contains('front-ditto')) return 'ditto';
      return f.classList.contains('front-pokemon') && f.querySelectorAll('.type').length === 2 ? 'dual' : 'other';
    });
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

await roundWhere('dual');
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
console.log(`screenshots saved to ${OUT}/ and docs/cards.png`);
