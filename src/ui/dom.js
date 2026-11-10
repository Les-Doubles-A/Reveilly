/* Aides d'affichage : icônes SVG, toast, interrupteur. */
import { esc } from '../core/util.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const svg = (body, vb = '0 0 24 24') => `<svg viewBox="${vb}" aria-hidden="true" focusable="false">${body}</svg>`;
export const ICON = {
  alarm: svg('<circle cx="12" cy="13" r="8.2" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="5" cy="4.6" r="2.4" fill="currentColor"/><circle cx="19" cy="4.6" r="2.4" fill="currentColor"/><path d="M11.2 17V12.2l3.4-2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'),
  gear: svg('<path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3.2h-4l-.4 2.7a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.5 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.8 1.7 1l.4 2.7h4l.4-2.7c.6-.2 1.2-.6 1.7-1l2.5 1 2-3.5zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/>'),
  plus: svg('<path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>'),
  dots: svg('<circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/>'),
  trash: svg('<path fill="currentColor" d="M9 3h6l1 1h4v2H4V4h4zM6 8h12l-1 13H7zm3 2v9h1.5v-9zm4.5 0v9H15v-9z"/>'),
  copy: svg('<path fill="none" stroke="currentColor" stroke-width="2" d="M8 8h11v13H8zM5 16H4V3h11v1"/>'),
  chevron: svg('<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'),
  back: svg('<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'),
  play: svg('<path d="M7 5l12 7-12 7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
  stop: svg('<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>'),
  vibrate: svg('<rect x="8" y="3" width="8" height="18" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4.5 8c-1.3 2.6-1.3 5.4 0 8M19.5 8c1.3 2.6 1.3 5.4 0 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  note: svg('<path fill="currentColor" d="M10 17.5a3 3 0 1 1-2-2.8V4l11-2v12.5a3 3 0 1 1-2-2.8V5.4l-7 1.3z"/>'),
  backspace: svg('<path d="M9 5h11v14H9l-6-7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 9l5 6m0-6l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'),
  warn: svg('<path fill="currentColor" d="M12 2 1 21h22zm-1 7h2v6h-2zm0 8h2v2h-2z"/>')
};

export const toggle = (on, label, attrs = '') =>
  `<button type="button" class="switch" role="switch" aria-checked="${on}" aria-label="${esc(label)}" ${attrs}><span></span></button>`;

let toastTimer;
export function toast(msg, action) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  if (action) t.querySelector('button').onclick = () => { action.run(); t.classList.remove('show'); };
  t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), action ? 5000 : 2600);
}
