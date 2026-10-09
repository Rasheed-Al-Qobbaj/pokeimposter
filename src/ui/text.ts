// Card descriptions load lazily (about 40 KB gzip) so the first screen stays fast.
import type { Card } from '../engine/types';

export interface CardText {
  /** id → [description, damage class, power, accuracy] */
  move: Record<string, [string, string, number | null, number | null]>;
  ability: Record<string, string>;
  item: Record<string, string>;
}

let cache: CardText | null = null;
let pending: Promise<CardText> | null = null;

export function loadText(): Promise<CardText> {
  pending ??= import('../data/text.json').then((m) => (cache = m.default as unknown as CardText));
  return pending;
}

/** The descriptions, if they've already loaded. */
export const textNow = () => cache;

export function descriptionOf(card: Card, text: CardText | null): string {
  if (!text || card.category === 'pokemon') return '';
  if (card.category === 'move') return text.move[card.id]?.[0] ?? '';
  return text[card.category][card.id] ?? '';
}
