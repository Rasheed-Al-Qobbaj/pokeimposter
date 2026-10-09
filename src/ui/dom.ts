// Small DOM helpers shared by the screens.

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape text before it goes into innerHTML. Player names come from the link, so always escape them. */
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

export const store = {
  get<T>(key: string): T | null {
    try {
      return JSON.parse(localStorage.getItem(key) ?? 'null') as T | null;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private mode or storage blocked: the game works without it.
    }
  },
};

export function go(code: string, round: number, me?: number) {
  location.hash = me === undefined ? `${code}/${round}` : `${code}/${round}/${me}`;
}

export const gameUrl = (code: string, round: number) => `${location.origin}${location.pathname}#${code}/${round}`;

/** Share sheet on phones, clipboard elsewhere. Resolves to what happened, for the button label. */
export async function shareLink(url: string): Promise<'shared' | 'copied' | 'failed'> {
  const data = { title: 'PokeImposter', text: "Join my PokeImposter game! Open the link and tap your name.", url };
  if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'failed';
    }
  }
  return copyText(url);
}

export async function copyText(text: string): Promise<'copied' | 'failed'> {
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/** Briefly swap a button's label, e.g. "Copied!". */
export function flash(button: HTMLElement, label: string) {
  const original = button.dataset.label ?? button.textContent ?? '';
  button.dataset.label = original;
  button.textContent = label;
  setTimeout(() => (button.textContent = original), 1600);
}
