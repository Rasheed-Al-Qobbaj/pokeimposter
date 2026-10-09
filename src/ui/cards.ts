// Markup for the card faces: the Pokémon, Move, Ability or Item a player sees.
import type { Card, Category } from '../engine/types';
import { esc } from './dom';
import { cornerDeco, motifIcon, TYPE_COLORS } from './motifs';
import { descriptionOf, type CardText } from './text';

export const CATEGORY_LABEL: Record<Category, string> = { pokemon: 'Pokémon', move: 'Move', ability: 'Ability', item: 'Item' };
export const CATEGORY_PLURAL: Record<Category, string> = { pokemon: 'Pokémon', move: 'Moves', ability: 'Abilities', item: 'Items' };

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
export const roman = (gen: number) => ROMAN[gen - 1] ?? String(gen);

const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites';
export const artworkUrl = (id: number) => `${SPRITES}/pokemon/other/official-artwork/${id}.png`;
export const itemSpriteUrl = (slug: string) => `${SPRITES}/items/${slug}.png`;
export const DITTO_ID = 132;

const BERRY_GROUPS = ['medicine', 'in-a-pinch', 'picky-healing', 'type-protection', 'other', 'effort-drop'];
export function itemGroupLabel(group: string) {
  if (BERRY_GROUPS.includes(group)) return 'Berry';
  const words = group.replace(/-/g, ' ').replace(/s$/, '');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export const typeBadge = (type: string) => `<span class="type t-${esc(type)}">${esc(type)}</span>`;

/** Hides an image that fails to load (a few newer items have no sprite). */
const imgFallback = `onerror="this.remove()"`;

function art(card: Card, size: 'big' | 'mini'): string {
  switch (card.category) {
    case 'pokemon':
      return `<img class="art art-${size}" src="${artworkUrl(card.id)}" alt="" ${imgFallback}>`;
    case 'item':
      return `<span class="art art-${size} art-item"><img src="${itemSpriteUrl(card.slug)}" alt="" ${imgFallback}></span>`;
    case 'move':
      return `<span class="art art-${size} art-move" style="--c:${TYPE_COLORS[card.type] ?? '#888'}">${motifIcon(card.type)}</span>`;
    case 'ability':
      return `<span class="art art-${size} art-ability">${motifIcon('ability')}</span>`;
  }
}

const DAMAGE_CLASS: Record<string, string> = { physical: 'Physical', special: 'Special', status: 'Status' };

function details(card: Card, text: CardText | null): string {
  switch (card.category) {
    case 'pokemon':
      return `${card.types.map(typeBadge).join('')}<span class="gen">Gen ${roman(card.gen)}</span>`;
    case 'move': {
      const [, cls, power, accuracy] = text?.move[card.id] ?? [];
      const stats = [
        cls && DAMAGE_CLASS[cls],
        power ? `${power} power` : '',
        accuracy ? `${accuracy}% acc` : '',
      ].filter(Boolean).map((s) => `<span class="gen">${s}</span>`).join('');
      return `${typeBadge(card.type)}${stats}`;
    }
    case 'ability':
      return `<span class="gen">Gen ${roman(card.gen)}</span>`;
    case 'item':
      return `<span class="gen">${esc(itemGroupLabel(card.group))}</span>`;
  }
}

/** Border and corner colors: a Pokémon's two types, a move's type, or a theme for abilities and items. */
function theme(card: Card): { c1: string; c2: string; m1: string; m2: string } {
  switch (card.category) {
    case 'pokemon': {
      const [t1, t2 = t1] = card.types;
      return { c1: TYPE_COLORS[t1], c2: TYPE_COLORS[t2], m1: t1, m2: t2 };
    }
    case 'move':
      return { c1: TYPE_COLORS[card.type], c2: TYPE_COLORS[card.type], m1: card.type, m2: card.type };
    case 'ability':
      return { c1: '#5B8DEF', c2: '#9B6CF0', m1: 'ability', m2: 'ability' };
    case 'item':
      return { c1: '#EF4036', c2: '#FFCB05', m1: 'item', m2: 'item' };
  }
}

/** The whole front face of a card. Pass the descriptions once they've loaded. */
export function cardFront(card: Card, text: CardText | null): string {
  const { c1, c2, m1, m2 } = theme(card);
  const desc = descriptionOf(card, text);
  return `
    <span class="face front typed front-${card.category}${desc ? ' has-desc' : ''}" style="--c1:${c1};--c2:${c2}">
      ${cornerDeco(m1, c1, 'tl')}${cornerDeco(m2, c2, 'br')}
      <span class="kicker">${CATEGORY_LABEL[card.category]}</span>
      ${art(card, 'big')}
      <span class="card-name">${esc(card.name)}</span>
      <span class="details">${details(card, text)}</span>
      ${desc ? `<span class="desc">${esc(desc)}</span>` : ''}
    </span>`;
}

export function dittoFront(category: Category): string {
  return `
    <span class="face front front-ditto">
      <span class="kicker">Shh… you're the</span>
      <img class="art art-big" src="${artworkUrl(DITTO_ID)}" alt="">
      <span class="card-name">Ditto!</span>
      <span class="ditto-hint">The card is ${category === 'item' || category === 'ability' ? 'an' : 'a'} <strong>${CATEGORY_LABEL[category]}</strong>.<br>Listen first, then transform and blend in.</span>
    </span>`;
}

export function miniCard(card: Card, caption: string): string {
  return `
    <figure class="mini">
      ${art(card, 'mini')}
      <figcaption><small>${esc(caption)}</small><strong>${esc(card.name)}</strong></figcaption>
    </figure>`;
}
