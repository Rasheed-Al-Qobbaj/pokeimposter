// Renders the README banner, the link-preview image (og.png) and the iPhone icon from public/logo.svg.
// Run with `npm run og`. Uses system fonts (Segoe UI on Windows).
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const logoSvg = readFileSync(new URL('public/logo.svg', root), 'utf8');
const logoInner = logoSvg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const logo = (x, y, size) => `<g transform="translate(${x} ${y}) scale(${size / 256})">${logoInner}</g>`;

const FONT = `font-family="Segoe UI, Arial, sans-serif"`;
const background = (w, h) => `
  <defs>
    <radialGradient id="glow" cx="50%" cy="0%" r="80%">
      <stop offset="0" stop-color="#2c3a85"/><stop offset="1" stop-color="#10142A"/>
    </radialGradient>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1.2" fill="#ffffff" opacity=".07"/>
    </pattern>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <rect width="${w}" height="${h}" fill="url(#dots)"/>`;

const title = (x, y, size) => `
  <text x="${x}" y="${y}" ${FONT} font-size="${size}" font-weight="900" fill="#1d377a">PokeImposter</text>
  <text x="${x}" y="${y - size * 0.07}" ${FONT} font-size="${size}" font-weight="900" fill="#FFCB05"
    stroke="#2a4ea0" stroke-width="${size * 0.06}" paint-order="stroke" stroke-linejoin="round">PokeImposter</text>`;

const pills = (x, y, labels) => {
  const colors = ['#EF4036', '#6390F0', '#A77BCA', '#7AC74C'];
  let cx = x;
  return labels.map((label, i) => {
    const w = label.length * 15 + 40;
    const out = `<rect x="${cx}" y="${y}" width="${w}" height="44" rx="22" fill="${colors[i % colors.length]}"/>
      <text x="${cx + w / 2}" y="${y + 29}" ${FONT} font-size="22" font-weight="700" fill="#fff" text-anchor="middle">${label}</text>`;
    cx += w + 12;
    return out;
  }).join('');
};

function render(svg, width, file) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: true, defaultFontFamily: 'Segoe UI' } }).render().asPng();
  const out = new URL(file, root);
  mkdirSync(new URL('./', out), { recursive: true });
  writeFileSync(out, png);
  console.log(`${file}  ${(png.length / 1024).toFixed(0)} KB`);
}

// Link preview for WhatsApp, Discord, etc.
render(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  ${background(1200, 630)}
  ${logo(70, 135, 360)}
  ${title(478, 272, 92)}
  <text x="486" y="350" ${FONT} font-size="40" font-weight="700" fill="#ffffff">Who's the Ditto?</text>
  <text x="486" y="400" ${FONT} font-size="27" fill="#A9B1D6">One link. Everyone gets the same secret card…</text>
  <text x="486" y="437" ${FONT} font-size="27" fill="#A9B1D6">except the imposter.</text>
  ${pills(486, 480, ['Pokémon', 'Moves', 'Abilities', 'Items'])}
</svg>`, 1200, 'public/og.png');

// README banner.
render(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="420" viewBox="0 0 1280 420">
  ${background(1280, 420)}
  ${logo(120, 60, 300)}
  ${title(470, 200, 112)}
  <text x="476" y="268" ${FONT} font-size="36" font-weight="700" fill="#ffffff">A Pokémon imposter party game</text>
  <text x="476" y="314" ${FONT} font-size="27" fill="#A9B1D6">One link. Same secret card. Find the Ditto before it fools you.</text>
</svg>`, 1280, 'docs/banner.png');

// iPhone home-screen icon.
render(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="#10142A"/>
  ${logo(14, 14, 152)}
</svg>`, 180, 'public/apple-touch-icon.png');
