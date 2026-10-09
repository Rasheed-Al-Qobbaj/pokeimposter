// Fetches every card from PokeAPI once and writes compact JSON into src/data/.
// Run with `npm run data`. The app never calls PokeAPI at runtime.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const ENDPOINT = 'https://graphql.pokeapi.co/v1beta2';
const EN = 9; // PokeAPI language id for English
const OUT = new URL('../src/data/', import.meta.url);

// Familiar item categories only. Skips TMs, key items, mail, Z-crystals and other filler.
const ITEM_CATEGORIES = [
  'standard-balls', 'special-balls', 'apricorn-balls',
  'healing', 'status-cures', 'revival', 'pp-recovery', 'vitamins', 'stat-boosts', 'flutes',
  'evolution', 'held-items', 'choice', 'bad-held-items', 'plates', 'species-specific', 'type-enhancement',
  'medicine', 'in-a-pinch', 'picky-healing', 'type-protection', 'other', 'effort-drop', 'loot',
];

async function gql(query) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`PokeAPI ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const enName = (names) => names[0]?.name?.trim();
const blocklist = JSON.parse(readFileSync(new URL('blocklist.json', OUT), 'utf8'));
const blocked = (cat, slug) => blocklist[cat]?.includes(slug);

const { pokemonspecies } = await gql(`{
  pokemonspecies(order_by: {id: asc}) {
    id name generation_id
    pokemonspeciesnames(where: {language_id: {_eq: ${EN}}}) { name }
    pokemons(where: {is_default: {_eq: true}}) { pokemontypes(order_by: {slot: asc}) { type { name } } }
  }
}`);
const pokemon = pokemonspecies
  .filter((p) => enName(p.pokemonspeciesnames) && !blocked('pokemon', p.name))
  .map((p) => [p.id, enName(p.pokemonspeciesnames), p.generation_id, p.pokemons[0].pokemontypes.map((t) => t.type.name)]);

// Card descriptions: the newest in-game text, falling back to PokeAPI's short effect.
// Sword/Shield replaced removed moves' text with "This move can't be used…", so skip that.
const clean = (s) =>
  s?.replace(/­\s*/g, '')
    .replace(/\[([^\]]*)\]\{[^:}]*:([^}]*)\}/g, (_, label, id) => label || id.replace(/-/g, ' '))
    .replace(/[\s\f]+/g, ' ')
    .trim();
function describe(flavors, effects, chance) {
  const flavor = flavors.map((f) => clean(f.flavor_text)).find((t) => t && t !== '???' && !/can.t be used/i.test(t));
  if (flavor) return flavor;
  return clean(effects?.[0]?.short_effect)?.replace(/\$effect_chance/g, String(chance ?? '')) ?? '';
}
const FLAVOR = `(where: {language_id: {_eq: ${EN}}}, order_by: {version_group_id: desc})`;
const EFFECT = `(where: {language_id: {_eq: ${EN}}})`;

const { move } = await gql(`{
  move(order_by: {id: asc}) {
    id name generation_id pp power accuracy move_effect_chance type { name } movedamageclass { name }
    movenames(where: {language_id: {_eq: ${EN}}}) { name }
    moveflavortexts${FLAVOR} { flavor_text }
    moveeffect { moveeffecteffecttexts${EFFECT} { short_effect } }
  }
}`);
const isZMove = (m) => m.generation_id === 7 && m.pp === 1;
const isMaxMove = (m) => m.name.startsWith('max-') || m.name.startsWith('g-max-');
const moves = move
  .filter((m) => m.id < 10000 && m.type?.name !== 'shadow' && !isZMove(m) && !isMaxMove(m))
  .filter((m) => enName(m.movenames) && !blocked('moves', m.name))
  .map((m) => [m.id, enName(m.movenames), m.generation_id, m.type.name]);

const { ability } = await gql(`{
  ability(order_by: {id: asc}, where: {is_main_series: {_eq: true}}) {
    id name generation_id
    abilitynames(where: {language_id: {_eq: ${EN}}}) { name }
    abilityflavortexts${FLAVOR} { flavor_text }
    abilityeffecttexts${EFFECT} { short_effect }
  }
}`);
const abilities = ability
  .filter((a) => enName(a.abilitynames) && !blocked('abilities', a.name))
  .map((a) => [a.id, enName(a.abilitynames), a.generation_id]);

const { item } = await gql(`{
  item(order_by: {id: asc}, where: {itemcategory: {name: {_in: ${JSON.stringify(ITEM_CATEGORIES)}}}}) {
    id name itemcategory { name }
    itemnames(where: {language_id: {_eq: ${EN}}}) { name }
    itemflavortexts${FLAVOR} { flavor_text }
    itemeffecttexts${EFFECT} { short_effect }
  }
}`);
const items = item
  .filter((i) => enName(i.itemnames) && !blocked('items', i.name))
  .map((i) => [i.id, enName(i.itemnames), i.name, i.itemcategory.name]);

// Hisui-era copies ("Poké Ball" twice) and multi-form abilities ("As One") share a name: keep the first.
const uniqueByName = (rows) => {
  const seen = new Set();
  return rows.filter((r) => !seen.has(r[1]) && seen.add(r[1]));
};
const files = {
  pokemon: uniqueByName(pokemon),
  moves: uniqueByName(moves),
  abilities: uniqueByName(abilities),
  items: uniqueByName(items),
};
mkdirSync(OUT, { recursive: true });
const hash = createHash('sha1');
let gz = 0;
for (const [name, rows] of Object.entries(files)) {
  const text = JSON.stringify(rows);
  writeFileSync(new URL(`${name}.json`, OUT), text);
  hash.update(text);
  gz += gzipSync(text).length;
}
// Descriptions don't affect the deal, so they live outside the data-version hash:
// rewording a description never breaks links people already shared.
const byId = (rows) => new Map(rows.map((r) => [r.id, r]));
const moveById = byId(move);
const abilityById = byId(ability);
const itemById = byId(item);
const text = {
  move: Object.fromEntries(files.moves.map(([id]) => {
    const m = moveById.get(id);
    const desc = describe(m.moveflavortexts, m.moveeffect?.moveeffecteffecttexts, m.move_effect_chance);
    return [id, [desc, m.movedamageclass?.name ?? '', m.power, m.accuracy]];
  })),
  ability: Object.fromEntries(files.abilities.map(([id]) => {
    const a = abilityById.get(id);
    return [id, describe(a.abilityflavortexts, a.abilityeffecttexts)];
  })),
  item: Object.fromEntries(files.items.map(([id]) => {
    const i = itemById.get(id);
    return [id, describe(i.itemflavortexts, i.itemeffecttexts)];
  })),
};
const textJson = JSON.stringify(text);
writeFileSync(new URL('text.json', OUT), textJson);
const missing = Object.fromEntries(Object.entries(text).map(([k, v]) =>
  [k, Object.values(v).filter((d) => !(Array.isArray(d) ? d[0] : d)).length]));
console.log(`descriptions gzip ${(gzipSync(textJson).length / 1024).toFixed(1)} KB, missing:`, missing);

const meta = {
  dv: hash.digest('hex').slice(0, 8),
  counts: Object.fromEntries(Object.entries(files).map(([k, v]) => [k, v.length])),
  source: ENDPOINT,
  fetched: new Date().toISOString().slice(0, 10),
};
writeFileSync(new URL('meta.json', OUT), JSON.stringify(meta, null, 2) + '\n');

console.log('counts', meta.counts, 'dv', meta.dv, `gzip ${(gz / 1024).toFixed(1)} KB`);
const find = (rows, name) => rows.find((r) => r[1] === name);
console.log('spot checks:', {
  mrMime: find(pokemon, 'Mr. Mime'),
  farfetchd: find(pokemon, 'Farfetch’d'),
  pecharunt: find(pokemon, 'Pecharunt'),
  flamethrower: find(moves, 'Flamethrower'),
  struggle: find(moves, 'Struggle'),
  gmaxLeft: moves.filter((m) => /^(G-Max|Max) /.test(m[1])).map((m) => m[1]),
  zLeft: moves.filter((m) => m[1] === 'Breakneck Blitz').length,
  intimidate: find(abilities, 'Intimidate'),
  masterBall: find(items, 'Master Ball'),
  leftovers: find(items, 'Leftovers'),
});
