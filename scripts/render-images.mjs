// Renders the README banner, the link-preview image (og.png) and the iPhone icon from public/logo.svg.
// Run with `npm run og`. Uses system fonts (Segoe UI on Windows).
import { background, FONT, logo, render } from './svg-kit.mjs';

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

// Link preview for WhatsApp, Discord, etc.
render(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  ${background(1200, 630)}
  ${logo(70, 135, 360)}
  ${title(478, 272, 92)}
  <text x="486" y="350" ${FONT} font-size="40" font-weight="700" fill="#ffffff">A Pokémon imposter party game</text>
  <text x="486" y="404" ${FONT} font-size="30" fill="#A9B1D6">Find the Ditto before it fools you.</text>
  ${pills(486, 450, ['Pokémon', 'Moves', 'Abilities', 'Items'])}
</svg>`, 1200, 'public/og.png');

// README banner.
render(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="420" viewBox="0 0 1280 420">
  ${background(1280, 420)}
  ${logo(120, 60, 300)}
  ${title(470, 200, 112)}
  <text x="476" y="268" ${FONT} font-size="36" font-weight="700" fill="#ffffff">A Pokémon imposter party game</text>
  <text x="476" y="316" ${FONT} font-size="30" fill="#A9B1D6">Find the Ditto before it fools you.</text>
</svg>`, 1280, 'docs/banner.png');

// iPhone home-screen icon.
render(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="#10142A"/>
  ${logo(14, 14, 152)}
</svg>`, 180, 'public/apple-touch-icon.png');
