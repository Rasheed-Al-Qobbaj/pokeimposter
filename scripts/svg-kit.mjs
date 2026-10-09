// Shared helpers for the image scripts: SVG building blocks rendered to PNG with resvg.
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

export const root = new URL('../', import.meta.url);

const logoSvg = readFileSync(new URL('public/logo.svg', root), 'utf8');
const logoInner = logoSvg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
export const logo = (x, y, size) => `<g transform="translate(${x} ${y}) scale(${size / 256})">${logoInner}</g>`;

export const FONT = `font-family="Segoe UI, Arial, sans-serif"`;
export const MONO = `font-family="Consolas, Menlo, monospace"`;
export const C = {
  bg: '#10142A', panel: '#1B2250', panel2: '#232C63', line: '#34408A', ink: '#F4F6FF', muted: '#A9B1D6',
  red: '#EF4036', yellow: '#FFCB05', ditto: '#A77BCA', blue: '#6390F0', green: '#7AC74C', orange: '#EE8130', paper: '#FFFFFF', paperInk: '#161B3D',
};

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const background = (w, h) => `
  <defs>
    <radialGradient id="glow" cx="50%" cy="0%" r="80%">
      <stop offset="0" stop-color="#2c3a85"/><stop offset="1" stop-color="${C.bg}"/>
    </radialGradient>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1.2" fill="#ffffff" opacity=".07"/>
    </pattern>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <rect width="${w}" height="${h}" fill="url(#dots)"/>`;

/** <text> with sensible defaults. opts: size, weight, fill, anchor, mono, opacity. */
export const text = (x, y, s, { size = 20, weight = 400, fill = C.ink, anchor = 'start', mono = false, opacity = 1 } = {}) =>
  `<text x="${x}" y="${y}" ${mono ? MONO : FONT} font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" opacity="${opacity}">${esc(s)}</text>`;

export const rect = (x, y, w, h, { fill = C.panel, stroke = 'none', sw = 2, r = 14, opacity = 1 } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"/>`;

/** A rounded pill with centered text. */
export const pill = (cx, cy, label, { fill = C.yellow, ink = C.paperInk, size = 20, mono = false, padX = 14, h = 36 } = {}) => {
  const w = label.length * size * (mono ? 0.56 : 0.55) + padX * 2;
  return `${rect(cx - w / 2, cy - h / 2, w, h, { fill, r: h / 2 })}${text(cx, cy + size * 0.35, label, { size, weight: 700, fill: ink, anchor: 'middle', mono })}`;
};

/** An arrow along a path (straight or curved), with a triangular head drawn by hand so any color works. */
export function arrow(d, end, angle, color = C.muted, width = 3) {
  const [x, y] = end;
  const a = (angle * Math.PI) / 180;
  const p = (da, len) => `${x - len * Math.cos(a + da)},${y - len * Math.sin(a + da)}`;
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>
    <path d="M${x},${y} L${p(0.45, 14)} L${p(-0.45, 14)} Z" fill="${color}"/>`;
}

/** Downloads a PNG and returns it as a data URI for <image href>. */
export async function pngData(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return `data:image/png;base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
}

export function render(svg, width, file) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: true, defaultFontFamily: 'Segoe UI' } }).render().asPng();
  const out = new URL(file, root);
  mkdirSync(new URL('./', out), { recursive: true });
  writeFileSync(out, png);
  console.log(`${file}  ${(png.length / 1024).toFixed(0)} KB`);
}
