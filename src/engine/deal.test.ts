import { describe, expect, it } from 'vitest';
import { decodeGame, encodeGame, ENGINE_VERSION, maxImposters } from './code';
import { deal, handFor } from './deal';
import { buildPools, DATA_VERSION, GENERATIONS } from './pools';
import { hashString, mulberry32 } from './rng';
import type { Category, Game } from './types';

const ALL_CATS: Category[] = ['pokemon', 'move', 'ability', 'item'];

function game(over: Partial<Game> = {}): Game {
  return {
    v: ENGINE_VERSION,
    dv: DATA_VERSION,
    players: ['Ash', 'Misty', 'Brock'],
    imposters: 1,
    categories: ALL_CATS,
    gens: GENERATIONS,
    mode: 'ditto',
    disguise: 'sneaky',
    seed: 'k7qx92ab',
    ...over,
  };
}

/** Simulates one phone: decode the shared link from scratch and deal. */
function phoneDeal(link: string, round: number) {
  const res = decodeGame(link, DATA_VERSION);
  if (!res.ok) throw new Error(res.reason);
  return deal(res.game, round, buildPools(res.game.gens));
}

describe('rng', () => {
  it('is deterministic for a seed and differs across seeds', () => {
    const a = mulberry32(hashString('abc:1'));
    const b = mulberry32(hashString('abc:1'));
    const c = mulberry32(hashString('abc:2'));
    const seqA = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(seqA);
    expect([c(), c(), c()]).not.toEqual(seqA);
    expect(seqA.every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it('pins known values so an accidental algorithm change is caught', () => {
    expect(hashString('pokeimposter')).toMatchInlineSnapshot(`666817509`);
    const r = mulberry32(42);
    expect([r(), r()]).toMatchInlineSnapshot(`
      [
        0.6011037519201636,
        0.44829055899754167,
      ]
    `);
  });
});

describe('game link', () => {
  it('round-trips, including Arabic names', () => {
    const g = game({ players: ['بيكاتشو', 'إيفي', 'سنورلاكس', 'Ash'], mode: 'rocket', disguise: 'sloppy', gens: [1, 4, 9], categories: ['pokemon', 'item'] });
    expect(decodeGame(encodeGame(g), DATA_VERSION)).toEqual({ ok: true, game: g });
  });

  it('rejects garbage and bad settings', () => {
    expect(decodeGame('not-a-code', DATA_VERSION)).toEqual({ ok: false, reason: 'invalid' });
    expect(decodeGame(encodeGame(game({ players: ['A', 'B'] })), DATA_VERSION).ok).toBe(false);
    expect(decodeGame(encodeGame(game({ players: ['A', 'a', 'B'] })), DATA_VERSION).ok).toBe(false);
    expect(decodeGame(encodeGame(game({ imposters: 2 })), DATA_VERSION).ok).toBe(false);
  });

  it('flags a link made with different data as a version mismatch', () => {
    expect(decodeGame(encodeGame(game()), 'deadbeef')).toEqual({ ok: false, reason: 'version' });
  });

  it('caps imposters below half the table', () => {
    expect([3, 4, 5, 6, 7, 12].map(maxImposters)).toEqual([1, 1, 2, 2, 3, 5]);
  });
});

describe('deal', () => {
  const link = encodeGame(game());

  it('gives every phone the identical deal for the same link and round', () => {
    for (let r = 1; r <= 50; r++) {
      expect(phoneDeal(link, r)).toEqual(phoneDeal(link, r));
    }
  });

  it('changes from round to round', () => {
    const cards = new Set(Array.from({ length: 30 }, (_, i) => phoneDeal(link, i + 1).card.name));
    expect(cards.size).toBeGreaterThan(25);
  });

  it('picks exactly k distinct imposters and a full speaking order', () => {
    const g = game({ players: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], imposters: 3 });
    const pools = buildPools(g.gens);
    for (let r = 1; r <= 200; r++) {
      const d = deal(g, r, pools);
      expect(new Set(d.imposters).size).toBe(3);
      expect([...d.order].sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
    }
  });

  it('Ditto mode: the first speaker is never an imposter, and Ditto sees only the category', () => {
    const g = game();
    const pools = buildPools(g.gens);
    for (let r = 1; r <= 500; r++) {
      const d = deal(g, r, pools);
      expect(d.imposters).not.toContain(d.order[0]);
      expect(d.decoy).toBeNull();
      expect(handFor(d, d.imposters[0])).toEqual({ kind: 'ditto', category: d.category });
      const crew = [0, 1, 2].find((p) => !d.imposters.includes(p))!;
      expect(handFor(d, crew)).toEqual({ kind: 'card', card: d.card });
    }
  });

  it('Team Rocket, sneaky: the decoy differs but shares a type or item group', () => {
    const g = game({ mode: 'rocket', disguise: 'sneaky', players: ['A', 'B', 'C', 'D', 'E'], imposters: 2 });
    const pools = buildPools(g.gens);
    for (let r = 1; r <= 500; r++) {
      const d = deal(g, r, pools);
      const decoy = d.decoy!;
      expect(decoy.category).toBe(d.category);
      expect(decoy.id).not.toBe(d.card.id);
      if (d.card.category === 'pokemon' && decoy.category === 'pokemon') {
        expect(decoy.types.some((t) => (d.card as typeof decoy).types.includes(t))).toBe(true);
      }
      if (d.card.category === 'move' && decoy.category === 'move') expect(decoy.type).toBe(d.card.type);
      if (d.card.category === 'item' && decoy.category === 'item') expect(decoy.group).toBe(d.card.group);
      // Both spies hold the same decoy.
      expect(handFor(d, d.imposters[0])).toEqual(handFor(d, d.imposters[1]));
    }
  });

  it('Team Rocket, sloppy: the decoy is any other card from the same category', () => {
    const g = game({ mode: 'rocket', disguise: 'sloppy' });
    const pools = buildPools(g.gens);
    let sharedType = 0;
    let pokemonRounds = 0;
    for (let r = 1; r <= 1000; r++) {
      const d = deal(g, r, pools);
      expect(d.decoy!.category).toBe(d.category);
      expect(d.decoy!.id).not.toBe(d.card.id);
      if (d.card.category === 'pokemon' && d.decoy!.category === 'pokemon') {
        pokemonRounds++;
        if (d.decoy!.types.some((t) => (d.card as typeof d.decoy & { types: string[] }).types.includes(t))) sharedType++;
      }
    }
    // Sloppy isn't secretly sneaky: most random pairs don't share a type.
    expect(sharedType / pokemonRounds).toBeLessThan(0.5);
  });

  it('respects the generation filter and enabled categories', () => {
    const g = game({ gens: [1], categories: ['pokemon', 'move'] });
    const pools = buildPools(g.gens);
    for (let r = 1; r <= 300; r++) {
      const d = deal(g, r, pools);
      expect(['pokemon', 'move']).toContain(d.category);
      expect((d.card as { gen: number }).gen).toBe(1);
    }
  });

  it('skips abilities when the chosen generations have none (they start in Gen 3)', () => {
    const g = game({ gens: [1, 2], categories: ['ability', 'item'] });
    const pools = buildPools(g.gens);
    for (let r = 1; r <= 100; r++) expect(deal(g, r, pools).category).toBe('item');
  });

  it('is fair: over 3,000 rounds each player is the imposter about 1/3 of the time', () => {
    const g = game();
    const pools = buildPools(g.gens);
    const counts = [0, 0, 0];
    const cats: Record<string, number> = {};
    for (let r = 1; r <= 3000; r++) {
      const d = deal(g, r, pools);
      counts[d.imposters[0]]++;
      cats[d.category] = (cats[d.category] ?? 0) + 1;
    }
    for (const c of counts) expect(Math.abs(c - 1000)).toBeLessThan(100);
    for (const cat of ALL_CATS) expect(Math.abs(cats[cat] - 750)).toBeLessThan(100);
  });
});

describe('README worked example', () => {
  // docs/how-deal.png and docs/fisher-yates.png show this exact round. If this fails, re-render them.
  it('game k7qx92ab, round 3: Farfetch’d, Misty is the Ditto, Ash speaks first', () => {
    const g = game({ players: ['Ash', 'Misty', 'Brock'], seed: 'k7qx92ab' });
    expect(hashString('k7qx92ab:3')).toBe(913420011);
    const rng = mulberry32(913420011);
    expect(Array.from({ length: 6 }, () => rng().toFixed(4))).toEqual(['0.1407', '0.0805', '0.0858', '0.2087', '0.4745', '0.9619']);
    const d = deal(g, 3, buildPools(g.gens));
    expect(d.category).toBe('pokemon');
    expect(d.card.name).toBe('Farfetch’d');
    expect(d.imposters).toEqual([1]);
    expect(d.order).toEqual([0, 2, 1]);
  });
});
