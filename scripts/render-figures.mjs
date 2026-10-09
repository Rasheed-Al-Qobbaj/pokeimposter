// Renders the "how it works" figures in the README from a real deal: game k7qx92ab, round 3,
// trainers Ash, Misty, Brock. The numbers below are pinned by the "README worked example" test
// in src/engine/deal.test.ts. If that test changes, update them here and run `npm run figures`.
import { arrow, background, C, pill, pngData, rect, render, text } from './svg-kit.mjs';

const ART = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const FARFETCHD = await pngData(ART(83));
const DITTO = await pngData(ART(132));
const img = (href, x, y, size) => `<image href="${href}" x="${x}" y="${y}" width="${size}" height="${size}"/>`;
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${background(w, h)}
  <defs>
    <linearGradient id="dittoGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9bfee"/><stop offset="1" stop-color="${C.ditto}"/></linearGradient>
  </defs>
  ${body}</svg>`;

// The real draws for "k7qx92ab:3".
const DRAWS = ['0.1407', '0.0805', '0.0858', '0.2087', '0.4745', '0.9619'];
const USE = [C.red, C.orange, C.ditto, C.ditto, C.green, C.green];

// ---------------------------------------------------------------------------
// Figure 1: one link, every phone runs the same math.
{
  const W = 1280;
  const H = 700;
  let body = text(W / 2, 58, 'One link. Every phone runs the same math.', { size: 34, weight: 700, anchor: 'middle' });

  // The link, split into what it carries.
  const prefix = 'pokeimposter.vercel.app/#';
  const chips = [
    { label: 'settings', fill: C.blue, ink: '#fff', note: 'names, mode, cards' },
    { label: 'seed k7qx92ab', fill: C.yellow, ink: C.paperInk, note: 'random, from the host', mono: true },
    { label: '/ round 3', fill: C.red, ink: '#fff', note: '+1 each round' },
  ];
  const chipW = (c) => c.label.length * 20 * (c.mono ? 0.56 : 0.55) + 28;
  const prefixW = prefix.length * 22 * 0.55;
  const total = 24 + prefixW + 12 + chips.reduce((s, c) => s + chipW(c) + 10, 0) + 14;
  let x = W / 2 - total / 2;
  body += rect(x, 90, total, 64, { fill: '#0B0F22', stroke: C.line, r: 32 });
  body += text(x + 24, 130, prefix, { size: 22, mono: true, fill: C.muted });
  x += 24 + prefixW + 12;
  for (const c of chips) {
    const w = chipW(c);
    body += pill(x + w / 2, 122, c.label, { fill: c.fill, ink: c.ink, size: 20, mono: c.mono });
    body += text(x + w / 2, 182, c.note, { size: 15, fill: C.muted, anchor: 'middle' });
    x += w + 10;
  }

  // Three phones.
  const phones = [
    { cx: 250, name: 'Ash', ditto: false },
    { cx: 640, name: 'Misty', ditto: true },
    { cx: 1030, name: 'Brock', ditto: false },
  ];
  for (const p of phones) {
    const d = p.cx === 640 ? 'M640 200 L640 246' : `M640 200 C640 232, ${p.cx} 218, ${p.cx} 246`;
    body += arrow(d, [p.cx, 250], 90, C.muted, 3);
  }
  for (const { cx, name, ditto } of phones) {
    body += rect(cx - 150, 258, 300, 384, { fill: C.panel, stroke: C.line, sw: 3, r: 36 });
    body += rect(cx - 40, 270, 80, 10, { fill: '#0B0F22', r: 5 });
    body += text(cx, 316, `${name}’s phone`, { size: 22, weight: 700, anchor: 'middle' });
    body += rect(cx - 112, 332, 224, 42, { fill: '#0B0F22', r: 10 });
    body += text(cx, 360, 'deal(seed, 3)', { size: 20, mono: true, fill: C.yellow, anchor: 'middle' });
    body += arrow(`M${cx} 380 L${cx} 398`, [cx, 404], 90, C.muted, 2.5);
    if (ditto) {
      body += rect(cx - 105, 410, 210, 166, { fill: 'url(#dittoGrad)', stroke: '#6f4a8e', sw: 4, r: 18 });
      body += img(DITTO, cx - 45, 416, 90);
      body += text(cx, 536, 'You’re the Ditto!', { size: 21, weight: 800, fill: '#2e1a42', anchor: 'middle' });
      body += text(cx, 560, 'The card is a Pokémon', { size: 15, fill: '#3f2558', anchor: 'middle' });
    } else {
      body += rect(cx - 105, 410, 210, 166, { fill: C.paper, stroke: C.yellow, sw: 4, r: 18 });
      body += img(FARFETCHD, cx - 48, 414, 96);
      body += text(cx, 536, 'Farfetch’d', { size: 23, weight: 800, fill: C.paperInk, anchor: 'middle' });
      body += text(cx, 560, 'POKÉMON', { size: 13, weight: 700, fill: '#5a6390', anchor: 'middle' });
    }
    body += text(cx, 600, 'speaking order', { size: 13, fill: C.muted, anchor: 'middle' });
    body += text(cx, 624, 'Ash → Brock → Misty', { size: 18, weight: 600, anchor: 'middle' });
  }
  body += text(W / 2, 680, 'Same seed + same round = same card, same Ditto, same order. No server, no messages between phones.', { size: 19, fill: C.muted, anchor: 'middle' });
  render(svg(W, H, body), W, 'docs/how-link.png');
}

// ---------------------------------------------------------------------------
// Figure 2: inside deal(seed, round).
{
  const W = 1280;
  const H = 730;
  let body = text(W / 2, 56, 'Inside deal(seed, round)', { size: 34, weight: 700, anchor: 'middle' });
  body += text(W / 2, 90, 'Round 3 of game k7qx92ab, one random number at a time', { size: 19, fill: C.muted, anchor: 'middle' });

  // seed:round → cyrb53 → 32-bit number → mulberry32 → stream
  const box = (x, w, label, value) =>
    rect(x, 124, w, 92, { fill: C.panel, stroke: C.line }) +
    text(x + w / 2, 154, label, { size: 15, fill: C.muted, anchor: 'middle' }) +
    (value ? text(x + w / 2, 194, value, { size: 26, mono: true, fill: C.yellow, anchor: 'middle' }) : '');
  body += box(40, 240, 'seed : round', 'k7qx92ab:3');
  body += text(337, 160, 'cyrb53', { size: 17, weight: 700, fill: C.blue, anchor: 'middle' });
  body += text(337, 204, 'hash', { size: 14, fill: C.muted, anchor: 'middle' });
  body += arrow('M290 172 L378 172', [386, 172], 0, C.blue, 3);
  body += box(392, 210, 'one 32-bit number', '913420011');
  body += text(660, 160, 'mulberry32', { size: 17, weight: 700, fill: C.green, anchor: 'middle' });
  body += text(660, 204, 'PRNG', { size: 14, fill: C.muted, anchor: 'middle' });
  body += arrow('M604 172 L708 172', [716, 172], 0, C.green, 3);
  body += box(722, 518, 'a stream of random numbers in [0, 1)', '');
  DRAWS.forEach((v, i) => {
    body += pill(770 + i * 84, 192, v, { fill: USE[i], ink: i === 1 ? C.paperInk : '#fff', size: 17, mono: true, padX: 9, h: 32 });
  });

  // What each number is used for.
  const steps = [
    { n: 1, color: C.red, title: 'Category', draws: [0], lines: ['4 card types in play:', 'Pokémon · Move · Ability · Item', '', 'floor(0.1407 × 4) = 0'], result: 'category' },
    { n: 2, color: C.orange, title: 'Card', draws: [1], lines: ['1,025 Pokémon in the pool', '', 'floor(0.0805 × 1025)', '  = 82'], result: 'card' },
    { n: 3, color: C.ditto, title: 'Who’s the Ditto', draws: [2, 3], lines: ['Fisher–Yates shuffle:', '[Ash, Misty, Brock]', '        ↓', '[Misty, Brock, Ash]'], result: 'ditto' },
    { n: 4, color: C.green, title: 'Speaking order', draws: [4, 5], lines: ['Fisher–Yates shuffle:', '[Ash, Misty, Brock]', '        ↓', '[Ash, Brock, Misty]'], result: 'order' },
  ];
  steps.forEach((s, i) => {
    const x = 40 + i * 305;
    const y = 262;
    const w = 285;
    const h = 418;
    body += rect(x, y, w, h, { fill: C.panel, stroke: s.color, sw: 3, r: 18 });
    body += `<circle cx="${x + 30}" cy="${y + 34}" r="16" fill="${s.color}"/>`;
    body += text(x + 30, y + 40, String(s.n), { size: 17, weight: 800, fill: '#fff', anchor: 'middle' });
    body += text(x + 56, y + 42, s.title, { size: 22, weight: 700 });
    s.draws.forEach((d, j) => {
      body += pill(x + 56 + j * 88, y + 82, DRAWS[d], { fill: s.color, ink: d === 1 ? C.paperInk : '#fff', size: 17, mono: true, padX: 9, h: 32 });
    });
    s.lines.forEach((line, j) => {
      const mono = /floor|=|\[|↓/.test(line);
      const lx = line.trim() === '↓' ? x + 110 : x + 20; // SVG collapses leading spaces
      body += text(lx, y + 140 + j * 30, line.trim(), { size: mono ? 17 : 16, mono, fill: mono ? C.ink : C.muted, weight: line.endsWith(':') ? 700 : 400 });
    });
    // The result tile.
    const ry = y + h - 140;
    body += rect(x + 16, ry, w - 32, 124, { fill: C.paper, r: 14 });
    const mid = x + w / 2;
    if (s.result === 'category') {
      body += text(mid, ry + 70, 'Pokémon', { size: 30, weight: 800, fill: C.paperInk, anchor: 'middle' });
      body += text(mid, ry + 98, 'slot 0', { size: 15, fill: '#5a6390', anchor: 'middle' });
    } else if (s.result === 'card') {
      body += img(FARFETCHD, x + 26, ry + 12, 100);
      body += text(x + 136, ry + 64, 'Farfetch’d', { size: 22, weight: 800, fill: C.paperInk });
      body += text(x + 136, ry + 90, 'slot 82', { size: 15, fill: '#5a6390' });
    } else if (s.result === 'ditto') {
      body += img(DITTO, x + 26, ry + 16, 92);
      body += text(x + 132, ry + 60, 'Misty', { size: 26, weight: 800, fill: C.paperInk });
      body += text(x + 132, ry + 86, 'first in the list', { size: 15, fill: '#5a6390' });
    } else {
      body += text(mid, ry + 58, 'Ash → Brock → Misty', { size: 21, weight: 800, fill: C.paperInk, anchor: 'middle' });
      body += text(mid, ry + 88, 'the Ditto never goes first', { size: 15, fill: '#5a6390', anchor: 'middle' });
    }
  });
  body += text(W / 2, 712, 'Team Rocket mode draws one more number to pick the spy’s decoy card.', { size: 18, fill: C.muted, anchor: 'middle' });
  render(svg(W, H, body), W, 'docs/how-deal.png');
}

// ---------------------------------------------------------------------------
// Figure 3: Fisher–Yates, step by step (the "Who's the Ditto" shuffle above).
{
  const W = 1280;
  const H = 640;
  let body = text(W / 2, 56, 'Fisher–Yates shuffle, step by step', { size: 34, weight: 700, anchor: 'middle' });
  body += text(W / 2, 90, 'Round 3: shuffle the trainers, and whoever lands first is the Ditto', { size: 19, fill: C.muted, anchor: 'middle' });

  const SLOT_X = [440, 630, 820];
  const SW = 170;
  const slotRow = (ry, names, { locked = [], swapped = [], ditto = -1 } = {}) =>
    names.map((name, i) => {
      const isLocked = locked.includes(i);
      const fill = i === ditto ? 'url(#dittoGrad)' : isLocked ? C.yellow : C.paper;
      const stroke = swapped.includes(i) ? C.ditto : 'none';
      return rect(SLOT_X[i], ry + 22, SW, 66, { fill, stroke, sw: 5, r: 14 }) +
        text(SLOT_X[i] + SW / 2, ry + 64, name, { size: 24, weight: 700, fill: C.paperInk, anchor: 'middle' }) +
        (isLocked && i !== ditto ? text(SLOT_X[i] + SW / 2, ry + 108, 'final', { size: 14, fill: C.yellow, anchor: 'middle' }) : '');
    }).join('');
  const swapArc = (ry, a, b) => {
    const xa = SLOT_X[a] + SW / 2;
    const xb = SLOT_X[b] + SW / 2;
    const top = ry - 18 - (b - a) * 8;
    return arrow(`M${xa} ${ry + 18} Q${(xa + xb) / 2} ${top} ${xb} ${ry + 18}`, [xb, ry + 20], 70, C.ditto, 3) +
      arrow(`M${xb} ${ry + 18} Q${(xa + xb) / 2} ${top} ${xa} ${ry + 18}`, [xa, ry + 20], 110, C.ditto, 3);
  };
  const stepText = (ry, i, r, j, swap) =>
    text(40, ry + 44, `i = ${i}`, { size: 28, weight: 800, fill: C.yellow }) +
    pill(200, ry + 36, `r = ${r}`, { fill: C.ditto, ink: '#fff', size: 17, mono: true, padX: 10, h: 32 }) +
    text(40, ry + 82, `j = floor(${r} × ${i + 1}) = ${j}`, { size: 18, mono: true }) +
    text(40, ry + 110, swap, { size: 17, fill: C.muted });

  // Start
  let ry = 120;
  body += SLOT_X.map((x, i) => text(x + SW / 2, ry + 12, `slot ${i}`, { size: 15, fill: C.muted, anchor: 'middle' })).join('');
  body += text(40, ry + 62, 'Start', { size: 28, weight: 800 });
  body += slotRow(ry, ['Ash', 'Misty', 'Brock']);
  body += text(1030, ry + 50, 'Walk from the last slot', { size: 17 });
  body += text(1030, ry + 74, 'to the first.', { size: 17 });

  // i = 2: swap slots 2 and 0
  ry = 270;
  body += stepText(ry, 2, '0.0858', 0, 'swap slot 2 with slot 0');
  body += swapArc(ry, 0, 2);
  body += slotRow(ry, ['Brock', 'Misty', 'Ash'], { locked: [2], swapped: [0, 2] });
  body += text(1030, ry + 50, 'Pick a random slot j', { size: 17 });
  body += text(1030, ry + 74, 'from 0…i and swap.', { size: 17 });
  body += text(1030, ry + 98, 'Slot 2 is now final.', { size: 17, fill: C.yellow });

  // i = 1: swap slots 1 and 0
  ry = 420;
  body += stepText(ry, 1, '0.2087', 0, 'swap slot 1 with slot 0');
  body += swapArc(ry, 0, 1);
  body += slotRow(ry, ['Misty', 'Brock', 'Ash'], { locked: [1, 2], swapped: [0, 1], ditto: 0 });
  body += text(1030, ry + 50, 'Done after n − 1 = 2', { size: 17 });
  body += text(1030, ry + 74, 'random numbers.', { size: 17 });
  body += text(1030, ry + 98, 'Misty is the Ditto.', { size: 17, weight: 700, fill: C.ditto });

  body += text(W / 2, 612, 'Every one of the 3! = 6 possible orders has the same chance, and every phone makes the same swaps.', { size: 19, fill: C.muted, anchor: 'middle' });
  render(svg(W, H, body), W, 'docs/fisher-yates.png');
}
