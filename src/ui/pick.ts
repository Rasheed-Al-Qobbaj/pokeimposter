// Screen 2: "Who's holding this phone?" plus the invite link.
import { gameTag } from '../engine/code';
import type { Ctx } from './context';
import { copyText, esc, flash, gameUrl, go, shareLink } from './dom';
import { topBar, modeNote } from './table';

export function renderPick(root: HTMLElement, ctx: Ctx) {
  const { game, code, round } = ctx;
  const url = gameUrl(code, round);

  root.innerHTML = `
    ${topBar(gameTag(game.seed))}

    <section class="panel invite">
      <h2>Invite your squad</h2>
      <p>Everyone opens the <strong>same link</strong>, then taps their own name.</p>
      <div class="row">
        <button type="button" class="cta" data-share>Share link</button>
        <button type="button" class="ghost-btn" data-copy>Copy</button>
      </div>
      <input class="link-box" readonly value="${esc(url)}" aria-label="Game link">
    </section>

    <section class="panel">
      <h2>Who's holding this phone?</h2>
      <div class="who">
        ${game.players.map((p, i) => `
          <button type="button" class="who-btn" data-me="${i}">
            <span class="avatar" aria-hidden="true">${esc([...p][0]?.toUpperCase() ?? '?')}</span>
            <span>${esc(p)}</span>
          </button>`).join('')}
      </div>
      <p class="hint">Tap your own name. No peeking at your friends' cards!</p>
    </section>

    ${modeNote(game)}`;

  root.onclick = async (e) => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b) return;
    if (b.dataset.me !== undefined) go(code, round, Number(b.dataset.me));
    else if (b.dataset.share !== undefined) {
      const r = await shareLink(url);
      if (r === 'copied') flash(b, 'Link copied!');
    } else if (b.dataset.copy !== undefined) {
      flash(b, (await copyText(url)) === 'copied' ? 'Copied!' : 'Select & copy ↓');
    }
  };
  const linkBox = root.querySelector<HTMLInputElement>('.link-box')!;
  linkBox.onfocus = () => linkBox.select();
}
