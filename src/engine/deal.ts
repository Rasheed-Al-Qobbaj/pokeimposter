import { hashString, mulberry32, pick, range, shuffle, type Rng } from './rng';
import { playableCategories } from './pools';
import type { Card, Deal, Disguise, Game, Hand, Pools } from './types';

/** Cards that look like `card`: a shared type, or the same item group. Abilities have no look-alikes. */
function lookalikes(card: Card, pool: readonly Card[]): Card[] {
  return pool.filter((c) => {
    if (c.id === card.id) return false;
    if (card.category === 'pokemon' && c.category === 'pokemon') return c.types.some((t) => card.types.includes(t));
    if (card.category === 'move' && c.category === 'move') return c.type === card.type;
    if (card.category === 'item' && c.category === 'item') return c.group === card.group;
    return false;
  });
}

function pickDecoy(card: Card, pool: readonly Card[], disguise: Disguise, rng: Rng): Card {
  const similar = disguise === 'sneaky' ? lookalikes(card, pool) : [];
  return pick(similar.length > 0 ? similar : pool.filter((c) => c.id !== card.id), rng);
}

/**
 * Deals one round. Pure and deterministic: the same game + round gives the same result
 * on every phone, so the phones never need to talk to each other.
 */
export function deal(game: Game, round: number, pools: Pools): Deal {
  const rng = mulberry32(hashString(`${game.seed}:${round}`));
  const categories = playableCategories(game.categories, pools);
  if (categories.length === 0) throw new Error('No playable categories for these settings');

  const category = pick(categories, rng);
  const pool: readonly Card[] = pools[category];
  const card = pick(pool, rng);

  const n = game.players.length;
  const imposters = shuffle(range(n), rng).slice(0, game.imposters).sort((a, b) => a - b);
  let order = shuffle(range(n), rng);
  if (game.mode === 'ditto') {
    // Ditto never speaks first: they need to hear at least one clue.
    const first = order.findIndex((p) => !imposters.includes(p));
    order = [...order.slice(first), ...order.slice(0, first)];
  }
  const decoy = game.mode === 'rocket' ? pickDecoy(card, pool, game.disguise, rng) : null;

  return { round, category, card, decoy, imposters, order };
}

export function handFor(d: Deal, player: number): Hand {
  if (!d.imposters.includes(player)) return { kind: 'card', card: d.card };
  return d.decoy ? { kind: 'card', card: d.decoy } : { kind: 'ditto', category: d.category };
}
