export type Category = 'pokemon' | 'move' | 'ability' | 'item';

/** ditto: the imposter knows and only sees the category. rocket: the spy gets a decoy card and doesn't know. */
export type Mode = 'ditto' | 'rocket';

/** sneaky: the decoy shares a type (or item group). sloppy: any card from the same category. */
export type Disguise = 'sneaky' | 'sloppy';

export interface Game {
  v: number;
  dv: string;
  players: string[];
  imposters: number;
  categories: Category[];
  gens: number[];
  mode: Mode;
  disguise: Disguise;
  seed: string;
}

export interface PokemonCard { category: 'pokemon'; id: number; name: string; gen: number; types: string[] }
export interface MoveCard { category: 'move'; id: number; name: string; gen: number; type: string }
export interface AbilityCard { category: 'ability'; id: number; name: string; gen: number }
export interface ItemCard { category: 'item'; id: number; name: string; slug: string; group: string }
export type Card = PokemonCard | MoveCard | AbilityCard | ItemCard;

export interface Pools {
  pokemon: PokemonCard[];
  move: MoveCard[];
  ability: AbilityCard[];
  item: ItemCard[];
}

export interface Deal {
  round: number;
  category: Category;
  card: Card;
  /** The card the Team Rocket spies get. Null in Ditto mode. */
  decoy: Card | null;
  /** Player indexes, ascending. */
  imposters: number[];
  /** Player indexes in speaking order. */
  order: number[];
}

/** What one player sees on their phone. */
export type Hand = { kind: 'card'; card: Card } | { kind: 'ditto'; category: Category };
