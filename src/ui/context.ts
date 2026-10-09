import type { Game, Pools } from '../engine/types';

/** Everything a game screen needs, parsed from the URL hash `#<code>/<round>[/<me>]`. */
export interface Ctx {
  game: Game;
  code: string;
  round: number;
  pools: Pools;
}
