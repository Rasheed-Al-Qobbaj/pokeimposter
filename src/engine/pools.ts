import pokemonRows from '../data/pokemon.json';
import moveRows from '../data/moves.json';
import abilityRows from '../data/abilities.json';
import itemRows from '../data/items.json';
import meta from '../data/meta.json';
import type { AbilityCard, Category, ItemCard, MoveCard, PokemonCard, Pools } from './types';

export const DATA_VERSION: string = meta.dv;
export const DATA_COUNTS = meta.counts;
export const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const CATEGORY_ORDER: Category[] = ['pokemon', 'move', 'ability', 'item'];

const ALL: Pools = {
  pokemon: (pokemonRows as [number, string, number, string[]][]).map(([id, name, gen, types]) => ({
    category: 'pokemon', id, name, gen, types,
  }) satisfies PokemonCard),
  move: (moveRows as [number, string, number, string][]).map(([id, name, gen, type]) => ({
    category: 'move', id, name, gen, type,
  }) satisfies MoveCard),
  ability: (abilityRows as [number, string, number][]).map(([id, name, gen]) => ({
    category: 'ability', id, name, gen,
  }) satisfies AbilityCard),
  item: (itemRows as [number, string, string, string][]).map(([id, name, slug, group]) => ({
    category: 'item', id, name, slug, group,
  }) satisfies ItemCard),
};

/** Cards available for a game. Items have no generation, so the generation filter skips them. */
export function buildPools(gens: readonly number[]): Pools {
  const inGens = (c: { gen: number }) => gens.includes(c.gen);
  return {
    pokemon: ALL.pokemon.filter(inGens),
    move: ALL.move.filter(inGens),
    ability: ALL.ability.filter(inGens),
    item: ALL.item,
  };
}

/** A category is playable when it has at least 2 cards (the decoy must differ from the card). */
export function playableCategories(categories: readonly Category[], pools: Pools): Category[] {
  return CATEGORY_ORDER.filter((c) => categories.includes(c) && pools[c].length >= 2);
}
