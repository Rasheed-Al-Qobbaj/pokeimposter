// Screen 3: your secret card for this round, the speaking order, and the reveal.
import { gameTag } from '../engine/code';
import { deal, handFor } from '../engine/deal';
import type { Disguise, Game } from '../engine/types';
import { cardFront, CATEGORY_LABEL, dittoFront, miniCard } from './cards';
import type { Ctx } from './context';
import { esc, flash, gameUrl, go, shareLink } from './dom';
import { loadText, textNow } from './text';

export const topBar = (tag: string) => `
  <header class="top-bar">
    <a class="home-link" href="#" aria-label="New game"><img src="/logo.svg" alt="" width="34" height="34"><span>PokeImposter</span></a>
    <span class="game-tag" title="Everyone should see the same game tag">Game ${esc(tag)}</span>
  </header>`;

/** Team Rocket ranks: an Executive's disguise is sneaky (shares a type), a Grunt's is sloppy (anything goes). */
export const rocketRank = (disguise: Disguise) => (disguise === 'sneaky' ? 'Executive' : 'Grunt');

export function modeNote(game: Game): string {
  const k = game.imposters;
  if (game.mode === 'ditto') {
    return `<p class="mode-note ditto-note">${k > 1 ? `${k} Dittos are` : 'A Ditto is'} hiding among you.</p>`;
  }
  const rank = rocketRank(game.disguise);
  const disguise = game.disguise === 'sneaky' ? 'a sneaky disguise' : 'a sloppy disguise';
  return `<p class="mode-note rocket-note"><span class="rocket-r small" aria-hidden="true">R</span>${k > 1 ? `${k} Team Rocket ${rank}s have` : `A Team Rocket ${rank} has`} infiltrated your squad in ${disguise}. They might not even know it.</p>`;
}

export function renderTable(root: HTMLElement, ctx: Ctx, me: number) {
  const { game, code, round, pools } = ctx;
  const d = deal(game, round, pools);
  const hand = handFor(d, me);
  const role = game.mode === 'ditto' ? 'Ditto' : rocketRank(game.disguise);
  const roles = game.mode === 'ditto' ? 'Dittos' : `${role}s`;
  const front = () => (hand.kind === 'ditto' ? dittoFront(hand.category) : cardFront(hand.card, textNow()));
  let armed = false;

  root.innerHTML = `
    ${topBar(gameTag(game.seed))}

    <div class="round-bar">
      <button type="button" class="round-btn" data-step="-1" aria-label="Previous round" ${round <= 1 ? 'disabled' : ''}>‹</button>
      <div class="round-label"><small>Round</small><strong>${round}</strong></div>
      <button type="button" class="round-btn" data-step="1" aria-label="Next round">›</button>
    </div>

    <p class="hello">Trainer <strong>${esc(game.players[me])}</strong></p>

    <button type="button" class="card" aria-label="Hold to see your secret card">
      <span class="card-inner">
        <span class="face back" aria-hidden="true">
          <span class="ball"></span>
          <span class="peek-label">Hold to peek</span>
        </span>
        ${front()}
      </span>
    </button>
    <p class="hint center">Category this round: <strong>${CATEGORY_LABEL[d.category]}</strong></p>

    <section class="panel">
      <h2>Speaking order</h2>
      <ol class="order">
        ${d.order.map((p) => `<li class="${p === me ? 'me' : ''}">${esc(game.players[p])}${p === me ? ' <small>(you)</small>' : ''}</li>`).join('')}
      </ol>
      <p class="hint">Each trainer says <strong>one word</strong> about their card. Then vote out loud.</p>
    </section>

    <section class="reveal-slot">
      <button type="button" class="cta danger" data-reveal>Reveal the ${role}</button>
    </section>

    <button type="button" class="cta" data-step="1">Next round →</button>

    ${modeNote(game)}

    <nav class="foot-actions">
      <button type="button" class="link-btn" data-share>Invite</button>
      <a href="#${code}/${round}">Switch trainer</a>
      <a href="#">New game</a>
    </nav>`;

  // Hold to peek: the card shows only while pressed, so neighbours can't glance at it.
  const card = root.querySelector<HTMLButtonElement>('.card')!;
  const show = (e: Event) => {
    e.preventDefault();
    card.classList.add('peek');
  };
  const hide = () => card.classList.remove('peek');
  card.addEventListener('pointerdown', (e) => {
    try {
      card.setPointerCapture(e.pointerId); // keep the card shown if the finger drifts off it
    } catch {
      // Pointer already gone; still show the card.
    }
    show(e);
  });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur']) card.addEventListener(ev, hide);
  card.addEventListener('contextmenu', (e) => e.preventDefault());
  card.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') show(e);
  });
  card.addEventListener('keyup', hide);
  card.addEventListener('click', (e) => e.preventDefault());

  // Descriptions arrive a moment later on the first card; swap the face in place when they do.
  if (!textNow() && hand.kind === 'card' && hand.card.category !== 'pokemon') {
    loadText().then(() => {
      if (card.isConnected) card.querySelector('.front')!.outerHTML = front();
    });
  }

  const reveal = () => {
    const names = d.imposters.map((p) => `<strong>${esc(game.players[p])}</strong>`).join(' & ');
    root.querySelector('.reveal-slot')!.innerHTML = `
      <section class="panel reveal ${game.mode}">
        <h2>The ${d.imposters.length > 1 ? `${roles} were` : `${role} was`}</h2>
        <p class="culprit">${names}</p>
        <div class="minis">
          ${miniCard(d.card, d.decoy ? "Everyone's card" : 'The card')}
          ${d.decoy ? miniCard(d.decoy, `${d.imposters.length > 1 ? `${roles}'` : `${role}'s`} card`) : ''}
        </div>
      </section>`;
  };

  root.onclick = async (e) => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b || b === card) return;
    if (b.dataset.step) go(code, Math.max(1, round + Number(b.dataset.step)), me);
    else if (b.dataset.reveal !== undefined) {
      if (armed) return reveal();
      armed = true;
      b.textContent = 'Everyone voted? Tap again';
      b.classList.add('armed');
    } else if (b.dataset.share !== undefined) {
      if ((await shareLink(gameUrl(code, round))) === 'copied') flash(b, 'Link copied!');
    }
  };
}
