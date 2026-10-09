// Markup for the card faces: the Pokémon, Move, Ability or Item a player sees.
import type { Card, Category } from '../engine/types';
import { esc } from './dom';

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
      return `<span class="art art-${size} art-move t-${esc(card.type)}" aria-hidden="true">✦</span>`;
    case 'ability':
      return `<span class="art art-${size} art-ability" aria-hidden="true">✧</span>`;
  }
}

function details(card: Card): string {
  switch (card.category) {
    case 'pokemon':
      return `${card.types.map(typeBadge).join('')}<span class="gen">Gen ${roman(card.gen)}</span>`;
    case 'move':
      return `${typeBadge(card.type)}<span class="gen">Gen ${roman(card.gen)}</span>`;
    case 'ability':
      return `<span class="gen">Gen ${roman(card.gen)}</span>`;
    case 'item':
      return `<span class="gen">${esc(itemGroupLabel(card.group))}</span>`;
  }
}

export function cardFront(card: Card): string {
  return `
    <span class="kicker">${CATEGORY_LABEL[card.category]}</span>
    ${art(card, 'big')}
    <span class="card-name">${esc(card.name)}</span>
    <span class="details">${details(card)}</span>`;
}

export function dittoFront(category: Category): string {
  return `
    <span class="kicker">Shh… you're the</span>
    <img class="art art-big" src="${artworkUrl(DITTO_ID)}" alt="">
    <span class="card-name">Ditto!</span>
    <span class="ditto-hint">The card is ${category === 'item' || category === 'ability' ? 'an' : 'a'} <strong>${CATEGORY_LABEL[category]}</strong>.<br>Listen first, then transform and blend in.</span>`;
}

export function miniCard(card: Card, caption: string): string {
  return `
    <figure class="mini">
      ${art(card, 'mini')}
      <figcaption><small>${esc(caption)}</small><strong>${esc(card.name)}</strong></figcaption>
    </figure>`;
}
