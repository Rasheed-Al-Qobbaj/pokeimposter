// The game link: settings + seed packed into the URL hash as base64url JSON.
import { CATEGORY_ORDER, GENERATIONS } from './pools';
import type { Category, Disguise, Game, Mode } from './types';

export const ENGINE_VERSION = 1;
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const MAX_NAME = 16;

export const maxImposters = (players: number) => Math.max(1, Math.floor((players - 1) / 2));

const CAT_LETTER: Record<Category, string> = { pokemon: 'p', move: 'm', ability: 'a', item: 'i' };

interface Packed { v: number; dv: string; p: string[]; k: number; c: string; g: number; m: 'd' | 'r'; d: 's' | 'l'; s: string }

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
}

export function encodeGame(game: Game): string {
  const packed: Packed = {
    v: game.v,
    dv: game.dv,
    p: game.players,
    k: game.imposters,
    c: CATEGORY_ORDER.filter((c) => game.categories.includes(c)).map((c) => CAT_LETTER[c]).join(''),
    g: game.gens.reduce((mask, gen) => mask | (1 << (gen - 1)), 0),
    m: game.mode === 'ditto' ? 'd' : 'r',
    d: game.disguise === 'sneaky' ? 's' : 'l',
    s: game.seed,
  };
  return toBase64Url(JSON.stringify(packed));
}

export type DecodeResult = { ok: true; game: Game } | { ok: false; reason: 'invalid' | 'version' };

export function decodeGame(code: string, dataVersion: string): DecodeResult {
  let x: Packed;
  try {
    x = JSON.parse(fromBase64Url(code));
  } catch {
    return { ok: false, reason: 'invalid' };
  }
  const players = Array.isArray(x?.p) ? x.p : [];
  const valid =
    players.length >= MIN_PLAYERS && players.length <= MAX_PLAYERS &&
    players.every((n) => typeof n === 'string' && n.trim() !== '' && n.length <= MAX_NAME) &&
    new Set(players.map((n) => n.toLowerCase())).size === players.length &&
    Number.isInteger(x.k) && x.k >= 1 && x.k <= maxImposters(players.length) &&
    typeof x.c === 'string' && /^[pmai]{1,4}$/.test(x.c) &&
    Number.isInteger(x.g) && x.g >= 1 && x.g < 1 << GENERATIONS.length &&
    (x.m === 'd' || x.m === 'r') && (x.d === 's' || x.d === 'l') &&
    typeof x.s === 'string' && /^[a-z0-9]{4,16}$/.test(x.s);
  if (!valid) return { ok: false, reason: 'invalid' };
  if (x.v !== ENGINE_VERSION || x.dv !== dataVersion) return { ok: false, reason: 'version' };
  return {
    ok: true,
    game: {
      v: x.v,
      dv: x.dv,
      players,
      imposters: x.k,
      categories: CATEGORY_ORDER.filter((c) => x.c.includes(CAT_LETTER[c])),
      gens: GENERATIONS.filter((gen) => x.g & (1 << (gen - 1))),
      mode: (x.m === 'd' ? 'ditto' : 'rocket') as Mode,
      disguise: (x.d === 's' ? 'sneaky' : 'sloppy') as Disguise,
      seed: x.s,
    },
  };
}

/** A fresh random seed for a new game. Not part of the deal, so crypto randomness is fine here. */
export function newSeed(): string {
  const [a, b] = crypto.getRandomValues(new Uint32Array(2));
  return (a.toString(36) + b.toString(36)).slice(0, 10).padEnd(6, '0');
}

/** Short label everyone can read out loud to confirm they're in the same game. */
export const gameTag = (seed: string) => seed.slice(0, 4).toUpperCase();
