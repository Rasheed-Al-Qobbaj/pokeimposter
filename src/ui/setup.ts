// Screen 1: the host sets up a game and gets a link.
import { encodeGame, ENGINE_VERSION, MAX_NAME, MAX_PLAYERS, MIN_PLAYERS, maxImposters, newSeed } from '../engine/code';
import { buildPools, CATEGORY_ORDER, DATA_VERSION, GENERATIONS, playableCategories } from '../engine/pools';
import type { Category, Disguise, Mode } from '../engine/types';
import { artworkUrl, CATEGORY_PLURAL, DITTO_ID, roman } from './cards';
import { esc, go, store } from './dom';
import { rocketRank } from './table';

interface SetupState {
  players: string[];
  imposters: number;
  categories: Category[];
  gens: number[];
  mode: Mode;
  disguise: Disguise;
}

const KEY = 'pokeimposter:setup';
const PLACEHOLDERS = ['Ash', 'Misty', 'Brock', 'May', 'Dawn', 'Serena', 'Hop', 'Nemona', 'Cynthia', 'Red', 'Blue', 'Oak'];

const defaults = (): SetupState => ({
  players: ['', '', ''],
  imposters: 1,
  categories: [...CATEGORY_ORDER],
  gens: [...GENERATIONS],
  mode: 'ditto',
  disguise: 'sneaky',
});

function load(): SetupState {
  const s = store.get<SetupState>(KEY);
  const d = defaults();
  if (!s || !Array.isArray(s.players) || s.players.length < MIN_PLAYERS) return d;
  return {
    players: s.players.slice(0, MAX_PLAYERS).map((p) => String(p).slice(0, MAX_NAME)),
    imposters: Number.isInteger(s.imposters) ? s.imposters : 1,
    categories: CATEGORY_ORDER.filter((c) => s.categories?.includes(c)),
    gens: GENERATIONS.filter((g) => s.gens?.includes(g)),
    mode: s.mode === 'rocket' ? 'rocket' : 'ditto',
    disguise: s.disguise === 'sloppy' ? 'sloppy' : 'sneaky',
  };
}

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

export function renderSetup(root: HTMLElement) {
  const s = load();
  let error = '';

  const draw = (focus?: number) => {
    const n = s.players.length;
    const max = maxImposters(n);
    s.imposters = Math.min(Math.max(1, s.imposters), max);
    const pools = buildPools(s.gens);
    const single = s.mode === 'ditto' ? 'Ditto' : rocketRank(s.disguise);
    const role = s.imposters > 1 ? `${single}s` : single;
    const allGens = s.gens.length === GENERATIONS.length;

    root.innerHTML = `
      <header class="brand">
        <img class="brand-logo" src="/logo.svg" alt="" width="88" height="88">
        <h1>PokeImposter</h1>
        <p class="tagline">Find the Ditto before it fools you.</p>
      </header>

      <form class="setup" novalidate>
        <section class="panel">
          <h2>Trainers <small>${n} / ${MAX_PLAYERS}</small></h2>
          <ol class="names">
            ${s.players.map((p, i) => `
              <li>
                <span class="num">${i + 1}</span>
                <input data-i="${i}" value="${esc(p)}" placeholder="${PLACEHOLDERS[i]}" maxlength="${MAX_NAME}"
                  autocomplete="off" autocapitalize="words" enterkeyhint="next" aria-label="Trainer ${i + 1} name">
                ${n > MIN_PLAYERS ? `<button type="button" class="icon-btn" data-remove="${i}" aria-label="Remove trainer ${i + 1}">✕</button>` : ''}
              </li>`).join('')}
          </ol>
          ${n < MAX_PLAYERS ? `<button type="button" class="ghost-btn" data-add>+ Add trainer</button>` : ''}
        </section>

        <section class="panel">
          <h2>Mode</h2>
          <div class="modes">
            <button type="button" class="mode mode-ditto" data-mode="ditto" aria-pressed="${s.mode === 'ditto'}">
              <img src="${artworkUrl(DITTO_ID)}" alt="" width="64" height="64">
              <strong>Who's the Ditto?</strong>
              <span>The Ditto knows they're the imposter but only sees the category. Transform and blend in.</span>
            </button>
            <button type="button" class="mode mode-rocket" data-mode="rocket" aria-pressed="${s.mode === 'rocket'}">
              <span class="rocket-r" aria-hidden="true">R</span>
              <strong>Team Rocket Spy</strong>
              <span>The spy gets a different card and doesn't know they're the spy. Prepare for trouble!</span>
            </button>
          </div>
          ${s.mode === 'rocket' ? `
            <h3>Spy's rank</h3>
            <div class="segmented" role="radiogroup" aria-label="Spy's rank">
              <button type="button" role="radio" data-disguise="sloppy" aria-checked="${s.disguise === 'sloppy'}">
                <strong>Grunt</strong><span>Sloppy disguise: any card from the same category</span>
              </button>
              <button type="button" role="radio" data-disguise="sneaky" aria-checked="${s.disguise === 'sneaky'}">
                <strong>Executive</strong><span>Sneaky disguise: shares a type or item group</span>
              </button>
            </div>` : ''}
        </section>

        <section class="panel">
          <h2>${role}</h2>
          <div class="stepper">
            <button type="button" data-imp="-1" aria-label="Fewer" ${s.imposters <= 1 ? 'disabled' : ''}>−</button>
            <output aria-live="polite">${s.imposters}</output>
            <button type="button" data-imp="1" aria-label="More" ${s.imposters >= max ? 'disabled' : ''}>+</button>
          </div>
          <p class="hint">Up to ${max} with ${n} trainers.</p>
        </section>

        <section class="panel">
          <h2>Cards</h2>
          <div class="chips">
            ${CATEGORY_ORDER.map((c) => `
              <button type="button" class="chip" data-cat="${c}" aria-pressed="${s.categories.includes(c)}">
                ${CATEGORY_PLURAL[c]} <small>${pools[c].length.toLocaleString('en')}</small>
              </button>`).join('')}
          </div>
          <h3>Generations</h3>
          <div class="chips gens">
            <button type="button" class="chip" data-gen="all" aria-pressed="${allGens}">All</button>
            ${GENERATIONS.map((g) => `<button type="button" class="chip" data-gen="${g}" aria-pressed="${!allGens && s.gens.includes(g)}">${roman(g)}</button>`).join('')}
          </div>
          <p class="hint">Items aren't tied to a generation. Abilities start in Gen III.</p>
        </section>

        <p class="error" role="alert">${esc(error)}</p>
        <button type="submit" class="cta">Start game</button>
      </form>

      <details class="panel how">
        <summary>How to play</summary>
        <ol>
          <li>One person sets up the game and shares the link in your group chat.</li>
          <li>Everyone opens the link and taps their own name.</li>
          <li>Hold the card to peek. Everyone has the same Pokémon, Move, Ability or Item, except the imposter.</li>
          <li>In speaking order, each trainer says <strong>one word</strong> about their card.</li>
          <li>Vote out loud on who the imposter is, then tap <em>Reveal</em>.</li>
          <li>A caught Ditto gets one guess at the card to steal the win.</li>
        </ol>
      </details>

      <footer class="foot-note">
        <span>Fan-made for fun. Data from <a href="https://pokeapi.co" target="_blank" rel="noopener">PokeAPI</a>.</span>
        <a href="https://github.com/Rasheed-Al-Qobbaj/pokeimposter" target="_blank" rel="noopener">Source on GitHub</a>
      </footer>`;

    if (focus !== undefined) root.querySelector<HTMLInputElement>(`input[data-i="${focus}"]`)?.focus();
  };

  // Delegated events survive the re-renders.
  root.oninput = (e) => {
    const input = e.target as HTMLInputElement;
    if (input.dataset.i !== undefined) s.players[Number(input.dataset.i)] = input.value;
  };

  root.onclick = (e) => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b || b.type === 'submit') return;
    const d = b.dataset;
    if (d.add !== undefined) {
      s.players.push('');
      draw(s.players.length - 1);
      return;
    }
    if (d.remove !== undefined) s.players.splice(Number(d.remove), 1);
    else if (d.mode) s.mode = d.mode as Mode;
    else if (d.disguise) s.disguise = d.disguise as Disguise;
    else if (d.imp) s.imposters += Number(d.imp);
    else if (d.cat) s.categories = toggle(s.categories, d.cat as Category);
    else if (d.gen === 'all') s.gens = [...GENERATIONS];
    else if (d.gen) {
      const g = Number(d.gen);
      // From "All", tapping a generation selects just that one.
      s.gens = s.gens.length === GENERATIONS.length ? [g] : toggle(s.gens, g);
      if (s.gens.length === 0) s.gens = [...GENERATIONS];
      s.gens.sort((a, b) => a - b);
    } else return;
    error = '';
    draw();
  };

  root.onsubmit = (e) => {
    e.preventDefault();
    const players = s.players.map((p) => p.trim());
    const pools = buildPools(s.gens);
    if (players.some((p) => !p)) error = 'Every trainer needs a name.';
    else if (new Set(players.map((p) => p.toLowerCase())).size !== players.length) error = 'Two trainers have the same name.';
    else if (playableCategories(s.categories, pools).length === 0) error = 'Pick at least one card type that has cards in these generations.';
    else error = '';
    if (error) {
      draw();
      return;
    }
    s.players = players;
    store.set(KEY, s);
    const code = encodeGame({
      v: ENGINE_VERSION,
      dv: DATA_VERSION,
      players,
      imposters: s.imposters,
      categories: s.categories,
      gens: s.gens,
      mode: s.mode,
      disguise: s.disguise,
      seed: newSeed(),
    });
    go(code, 1);
  };

  draw();
}
