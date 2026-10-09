// Type-themed decorations for the card corners: droplets for Water, flames and ash for Fire, etc.
// Each motif is drawn in a 24×24 box with currentColor, so one shape serves every size and color.

export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C', grass: '#7AC74C', ice: '#96D9D6',
  fighting: '#C22E28', poison: '#A33EA1', ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
  rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746', steel: '#B7B7CE', fairy: '#D685AD',
};

const stroke = (d: string, width = 2.2) =>
  `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;

const SPARKLE = '<path d="M12 1.5c.9 5.6 3.9 8.6 9.5 10.5-5.6 1.9-8.6 4.9-9.5 10.5-.9-5.6-3.9-8.6-9.5-10.5C8.1 10.1 11.1 7.1 12 1.5z"/>';

export const MOTIFS: Record<string, string> = {
  water: '<path d="M12 2.5S5 10.2 5 15a7 7 0 0 0 14 0c0-4.8-7-12.5-7-12.5z"/>',
  fire: '<path d="M12.5 2c.6 3.6 5.5 5.6 5.5 11.4A6 6 0 0 1 6 13.5c0-2.6 1.4-4.4 2.9-5.6-.1 1.9.8 3.2 2 3.6-.6-3.5.2-6.9 1.6-9.5z"/>',
  grass: '<path d="M20.5 3.5C9.8 3.5 3.5 9.8 3.5 20.5c10.7 0 17-6.3 17-17z"/>',
  electric: '<path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.2L13.5 2z"/>',
  ice: stroke('M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9.3 3.6 12 6.2l2.7-2.6M9.3 20.4 12 17.8l2.7 2.6', 2),
  fighting: '<path d="M12 1l2.2 6.2L20 4.3l-2.8 5.9 5.8 2.2-5.8 2 2.8 6-5.8-2.9L12 23l-2.2-5.5L4 20.4l2.8-6-5.8-2 5.8-2.2L4 4.3l5.8 2.9z"/>',
  poison: '<circle cx="9" cy="14.5" r="6"/><circle cx="17.5" cy="6.5" r="3.6"/><circle cx="18.5" cy="17.5" r="2.1"/>',
  ground: '<path d="M1.5 19.5 8.5 8.5l4.2 5.8 2.8-3.4 7 8.6z"/>',
  flying: '<path d="M21 3C12 3 5 9 4.2 18.6L2.8 21h2.1l1.6-2.1C15.4 17.9 21 12 21 3z"/>',
  psychic: stroke('M12.6 12.3c.4-.9-.9-1.6-1.6-.7-.9 1.2.4 3 2 2.6 2-.5 2.3-3.3.8-4.6-2-1.8-5.4-.9-6 1.8-.8 3.3 2.4 6.1 5.6 5.4 3.9-.8 5.4-5.6 3.2-8.7C14.3 4.4 8.3 4.2 5.5 7.9', 2.3),
  bug: '<path d="M12 2.5 20.2 7.2v9.6L12 21.5l-8.2-4.7V7.2z"/>',
  rock: '<path d="M5 18 3.5 10.2l5-5.7 7.2.6 4.8 6.1-2.1 7.4-7.3 2.2z"/>',
  ghost: '<path fill-rule="evenodd" d="M5 21.5V11a7 7 0 0 1 14 0v10.5l-2.4-1.8-2.3 1.8-2.3-1.8-2.3 1.8-2.3-1.8zM8.3 10.6a1.4 1.7 0 1 0 2.8 0 1.4 1.7 0 1 0-2.8 0zm4.6 0a1.4 1.7 0 1 0 2.8 0 1.4 1.7 0 1 0-2.8 0z"/>',
  dragon: stroke('M5.5 2.5c3.2 5.3 4.2 10.6 2.4 18.5M11.5 2c3.2 5.3 4.2 10.8 2.4 19M17.5 2.5c3.2 5.3 4.2 10.6 2.4 18.5', 2.4),
  dark: '<path d="M15.5 2.5A9.5 9.5 0 1 0 21.5 17 8 8 0 0 1 15.5 2.5z"/>',
  steel: '<path fill-rule="evenodd" d="M12 2 20.7 7v10L12 22l-8.7-5V7zm0 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7z"/>',
  fairy: SPARKLE,
  normal: stroke('M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 1 1 0-15z', 3),
  // Not types: abilities sparkle, items get little Poké Balls.
  ability: SPARKLE,
  item: '<path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20zm0 2.4a7.6 7.6 0 0 1 7.5 6.4h-4.6a3 3 0 0 0-5.8 0H4.5A7.6 7.6 0 0 1 12 4.4zm0 6.2a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 1 1 0-2.8z"/>',
};

/** Extra specks around the motifs. Fire leaves embers and grey ash. */
const SPECKS: Record<string, string[]> = { fire: ['#F7A440', '#9AA0AA', '#B9BEC7'] };

// [x, y, size, rotation, opacity] in a 130×130 corner box, densest at the corner.
const CLUSTER: [number, number, number, number, number][] = [
  [6, 8, 34, -14, 0.5], [46, 4, 20, 12, 0.38], [8, 50, 22, 18, 0.38], [40, 38, 13, -8, 0.26], [78, 10, 12, 22, 0.22], [12, 86, 12, -10, 0.22],
];
const DOTS: [number, number, number][] = [[64, 30, 2.6], [30, 70, 2.2], [96, 26, 1.8], [24, 104, 1.8], [58, 58, 1.6], [104, 6, 1.4]];

/** A cluster of motifs for one corner. `corner` mirrors the layout without flipping the shapes. */
export function cornerDeco(motif: string, color: string, corner: 'tl' | 'br'): string {
  const shape = MOTIFS[motif] ?? MOTIFS.normal;
  const at = (x: number, y: number, size = 0) => (corner === 'tl' ? [x, y] : [130 - x - size, 130 - y - size]);
  const shapes = CLUSTER.map(([x, y, size, rot, opacity]) => {
    const [px, py] = at(x, y, size);
    const half = size / 2;
    return `<g opacity="${opacity}" transform="translate(${px} ${py}) rotate(${rot} ${half} ${half}) scale(${size / 24})">${shape}</g>`;
  }).join('');
  const specks = SPECKS[motif];
  const dots = DOTS.map(([x, y, r], i) => {
    const [px, py] = at(x, y);
    const fill = specks ? specks[i % specks.length] : 'currentColor';
    return `<circle cx="${px}" cy="${py}" r="${r}" fill="${fill}" opacity="${specks ? 0.6 : 0.3}"/>`;
  }).join('');
  return `<svg class="deco deco-${corner}" viewBox="0 0 130 130" fill="currentColor" aria-hidden="true" style="color:${color}">${shapes}${dots}</svg>`;
}

/** A single motif, e.g. drawn large inside a move's type circle. */
export const motifIcon = (motif: string, cls = '') =>
  `<svg class="motif ${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${MOTIFS[motif] ?? MOTIFS.normal}</svg>`;
