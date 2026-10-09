import './style.css';
import { decodeGame } from './engine/code';
import { buildPools, DATA_VERSION, playableCategories } from './engine/pools';
import type { Pools } from './engine/types';
import type { Ctx } from './ui/context';
import { renderPick } from './ui/pick';
import { renderSetup } from './ui/setup';
import { renderTable } from './ui/table';

const root = document.getElementById('app')!;
let poolCache: { key: string; pools: Pools } | null = null;

function renderError(reason: 'invalid' | 'version') {
  root.innerHTML = `
    <section class="panel error-panel">
      <img src="/logo.svg" alt="" width="72" height="72">
      <h1>${reason === 'version' ? 'This game is from an older Pokédex' : "That link doesn't look right"}</h1>
      <p>${reason === 'version'
        ? 'The app was updated since this game started, so phones could deal different cards. Start a new game and share the new link.'
        : 'The game link is incomplete or broken. Ask the host to share it again, or start a new game.'}</p>
      <a class="cta" href="#">Start a new game</a>
    </section>`;
}

/** Routes: `#` → setup, `#<code>/<round>` → pick your name, `#<code>/<round>/<me>` → your card. */
function route() {
  root.onclick = root.oninput = root.onsubmit = null;
  const hash = location.hash.slice(1);
  if (!hash) {
    renderSetup(root);
    return;
  }
  const [code, roundPart, mePart] = hash.split('/');
  const res = decodeGame(code, DATA_VERSION);
  if (!res.ok) return renderError(res.reason);
  const { game } = res;

  const key = game.gens.join(',');
  if (poolCache?.key !== key) poolCache = { key, pools: buildPools(game.gens) };
  if (playableCategories(game.categories, poolCache.pools).length === 0) return renderError('invalid');

  const round = Math.min(Math.max(Number.parseInt(roundPart ?? '1', 10) || 1, 1), 9999);
  const me = mePart !== undefined && /^\d+$/.test(mePart) && Number(mePart) < game.players.length ? Number(mePart) : null;
  const ctx: Ctx = { game, code, round, pools: poolCache.pools };
  if (me === null) renderPick(root, ctx);
  else renderTable(root, ctx, me);
}

window.addEventListener('hashchange', () => {
  route();
  window.scrollTo({ top: 0 });
});
route();
